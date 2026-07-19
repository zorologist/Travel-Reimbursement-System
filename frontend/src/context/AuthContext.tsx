import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  clearDevelopmentSession,
  getDevelopmentUser,
  loginDevelopmentUser,
  type DevelopmentUser,
} from "../services/developmentAuth";

interface AuthContextValue {
  user: DevelopmentUser | null;
  isAuthenticated: boolean;
  login: (
    employeeNumber: string,
    password: string,
    remember: boolean,
  ) => DevelopmentUser | null;
  logout: () => void;
  restore: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function restoredDevelopmentUser(): DevelopmentUser | null {
  return typeof window === "undefined" ? null : getDevelopmentUser();
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<DevelopmentUser | null>(restoredDevelopmentUser);

  const login = useCallback(
    (
      employeeNumber: string,
      password: string,
      remember: boolean,
    ): DevelopmentUser | null => {
      const authenticatedUser = loginDevelopmentUser(employeeNumber, password, remember);
      setUser(authenticatedUser);
      return authenticatedUser;
    },
    [],
  );

  const logout = useCallback(() => {
    clearDevelopmentSession();
    setUser(null);
  }, []);

  const restore = useCallback(() => {
    setUser(restoredDevelopmentUser());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      restore,
    }),
    [login, logout, restore, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
