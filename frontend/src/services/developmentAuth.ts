import { developmentEmployees, type DevelopmentEmployee } from "./developmentRepository";

export type DevelopmentUser = DevelopmentEmployee;

// Version the temporary browser session whenever its shape or routing changes.
// This prevents an older development login from silently reopening an API-backed
// page that is not ready yet.
const SESSION_KEY = "travel-reimbursement-development-user-v3";
const LEGACY_SESSION_KEYS = ["travel-reimbursement-development-user", "travel-reimbursement-development-user-v2"] as const;

/**
 * Browser-only test accounts must be explicitly supplied for the opt-in mock
 * repository as a JSON object, for example {"DEV001":"local secret"}.
 * Normal development uses the API and never includes these values.
 */
function configuredPasswords(): Record<string, string> {
  const raw = import.meta.env.VITE_DEVELOPMENT_ACCOUNTS;
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    return typeof value === "object" && value !== null ? value as Record<string, string> : {};
  } catch {
    return {};
  }
}

export function loginDevelopmentUser(
  employeeNumber: string,
  password: string,
  remember: boolean,
): DevelopmentUser | null {
  const normalizedEmployeeNumber = employeeNumber.trim().toUpperCase();
  const expectedPassword = configuredPasswords()[normalizedEmployeeNumber];
  const account = developmentEmployees.find(
    (candidate) => candidate.employeeNumber === normalizedEmployeeNumber,
  );

  if (!account || !expectedPassword || password !== expectedPassword) return null;

  const user = account;
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
