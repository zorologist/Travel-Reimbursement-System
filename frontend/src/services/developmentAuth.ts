import { developmentEmployees, type DevelopmentEmployee } from "./developmentRepository";

export type DevelopmentUser = DevelopmentEmployee;

interface DevelopmentAccount extends DevelopmentUser {
  password: string;
}

// Version the temporary browser session whenever its shape or routing changes.
// This prevents an older development login from silently reopening an API-backed
// page that is not ready yet.
const SESSION_KEY = "travel-reimbursement-development-user-v3";
const LEGACY_SESSION_KEYS = ["travel-reimbursement-development-user", "travel-reimbursement-development-user-v2"] as const;

/** Temporary frontend accounts. Replace with /api/auth/login and /api/auth/me. */
const developmentAccounts: DevelopmentAccount[] = developmentEmployees.map((employee) => ({
  ...employee,
  password: employee.roles.length > 1 ? "Admin@123" : "Employee@123",
}));

function publicUser(account: DevelopmentAccount): DevelopmentUser {
  const { password: _password, ...user } = account;
  return user;
}

export function loginDevelopmentUser(
  employeeNumber: string,
  password: string,
  remember: boolean,
): DevelopmentUser | null {
  const normalizedEmployeeNumber = employeeNumber.trim().toUpperCase();
  const account = developmentAccounts.find(
    (candidate) =>
      candidate.employeeNumber === normalizedEmployeeNumber &&
      candidate.password === password,
  );

  if (!account) return null;

  const user = publicUser(account);
  clearDevelopmentSession();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function getDevelopmentUser(): DevelopmentUser | null {
  const stored =
    sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as DevelopmentUser;
  } catch {
    clearDevelopmentSession();
    return null;
  }
}

export function clearDevelopmentSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
  for (const legacyKey of LEGACY_SESSION_KEYS) {
    sessionStorage.removeItem(legacyKey);
    localStorage.removeItem(legacyKey);
  }
}
