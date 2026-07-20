import type { User } from "./User.js";

export interface LoginInput {
  employeeNumber: string;
  password: string;
  remember?: boolean;
}

export interface AuthResponse {
  user: User;
}
