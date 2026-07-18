export interface DevelopmentUser {
  id: string;
  employeeNumber: string;
  displayName: string;
  roles: Array<"employee" | "manager">;
}

interface DevelopmentAccount extends DevelopmentUser {
  password: string;
}

const SESSION_KEY = "travel-reimbursement-development-user";

/** Temporary frontend accounts. Replace with /api/auth/login and /api/auth/me. */
const developmentAccounts: DevelopmentAccount[] = [
  {
    id: "u1",
    employeeNumber: "DEV001",
    displayName: "Mariam Hassan (Demo)",
    roles: ["employee"],
    password: "Employee@123",
  },
  {
    id: "u4",
    employeeNumber: "DEV004",
    displayName: "Karim Adel (Demo Manager)",
    roles: ["employee", "manager"],
    password: "Admin@123",
  },
];

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
}
