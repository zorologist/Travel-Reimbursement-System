export interface DevelopmentCredential {
  employeeNumber: string;
  password: string;
}

/** Fictional credentials used only until company identity integration is available. */
export const developmentCredentials: readonly DevelopmentCredential[] = [
  { employeeNumber: "DEV001", password: "Employee@123" },
  { employeeNumber: "DEV002", password: "Employee@123" },
  { employeeNumber: "DEV003", password: "Employee@123" },
  { employeeNumber: "DEV004", password: "Admin@123" },
  { employeeNumber: "DEV005", password: "Admin@123" },
  { employeeNumber: "DEV006", password: "Admin@123" },
  { employeeNumber: "DEV007", password: "Admin@123" },
  { employeeNumber: "DEV008", password: "Admin@123" },
  { employeeNumber: "DEV009", password: "Admin@123" },
];
