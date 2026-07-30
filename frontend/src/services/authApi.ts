import api, { setCsrfToken } from "./api";
import {
  clearDevelopmentSession,
  getDevelopmentUser,
  loginDevelopmentUser,
  type DevelopmentUser,
} from "./developmentAuth";
import { useDevelopmentRepository } from "./runtimeMode";

export const authApi = {
  async login(employeeNumber: string, password: string, remember: boolean): Promise<DevelopmentUser | null> {
    if (useDevelopmentRepository) return loginDevelopmentUser(employeeNumber, password, remember);
    const response = await api.post<{ user: DevelopmentUser; csrfToken: string }>("/api/auth/login", { employeeNumber, password, remember });
    setCsrfToken(response.data.csrfToken);
    return response.data.user;
  },
  async currentUser(): Promise<DevelopmentUser | null> {
    if (useDevelopmentRepository) return getDevelopmentUser();
    try {
      const response = await api.get<{ user: DevelopmentUser; csrfToken: string }>("/api/auth/me");
      setCsrfToken(response.data.csrfToken);
      return response.data.user;
    } catch {
      setCsrfToken(null);
      return null;
    }
  },
  async logout(): Promise<void> {
    if (useDevelopmentRepository) { clearDevelopmentSession(); return; }
    const logoutRequest = api.post("/api/auth/logout");
    setCsrfToken(null);
    await logoutRequest;
  },
};
