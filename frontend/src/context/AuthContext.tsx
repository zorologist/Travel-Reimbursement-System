import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getDevelopmentUser, type DevelopmentUser } from "../services/developmentAuth";
import { authApi } from "../services/authApi";
import { useDevelopmentRepository } from "../services/runtimeMode";

interface AuthContextValue {
  user: DevelopmentUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (
    employeeNumber: string,
    password: string,
    remember: boolean,
  ) => Promise<DevelopmentUser | null>;
  logout: () => void;
  restore: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function restoredDevelopmentUser(): DevelopmentUser | null {
  return typeof window === "undefined" || !useDevelopmentRepository ? null : getDevelopmentUser();
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<DevelopmentUser | null>(restoredDevelopmentUser);
  const [loading, setLoading] = useState(!useDevelopmentRepository);

  const login = useCallback(
    (
      employeeNumber: string,
      password: string,
      remember: boolean,
    ): Promise<DevelopmentUser | null> => {
      return authApi.login(employeeNumber, password, remember).then((authenticatedUser) => {
      setUser(authenticatedUser);
      return authenticatedUser;
      });
    },
    [],
  );

  const logout = useCallback(() => {
    void authApi.logout();
    setUser(null);
  }, []);

  const restore = useCallback(async () => {
    setLoading(true);
    setUser(await authApi.currentUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!useDevelopmentRepository) void restore();
  }, [restore]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      loading,
      login,
      logout,
      restore,
    }),
    [loading, login, logout, restore, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
