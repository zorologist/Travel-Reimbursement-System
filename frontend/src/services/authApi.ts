import api from "./api";
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
    const response = await api.post<{ user: DevelopmentUser }>("/api/auth/login", { employeeNumber, password, remember });
    return response.data.user;
  },
  async currentUser(): Promise<DevelopmentUser | null> {
    if (useDevelopmentRepository) return getDevelopmentUser();
    try { return (await api.get<{ user: DevelopmentUser }>("/api/auth/me")).data.user; }
    catch { return null; }
  },
  async logout(): Promise<void> {
    if (useDevelopmentRepository) { clearDevelopmentSession(); return; }
    await api.post("/api/auth/logout");
  },
};
