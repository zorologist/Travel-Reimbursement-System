import type { User } from "../../../shared/types/User.js";

/**
 * Safe, non-sensitive development accounts — one per system role, so every
 * stage of the workflow can be exercised end-to-end without Active Directory.
 * Never add real employee data here.
 */
export const devUsers: User[] = [
  { id: "u-employee-1", employeeNumber: "EMP001", displayName: "Fatima Hassan", jobLevel: "Level 1", roles: ["employee"] },
  { id: "u-manager-1", employeeNumber: "MGR001", displayName: "Karim Said", jobLevel: "General Manager", roles: ["manager"] },
  { id: "u-pr-1", employeeNumber: "PR001", displayName: "Nour Adel", jobLevel: "Level 2", roles: ["pr"] },
  { id: "u-transport-1", employeeNumber: "TRN001", displayName: "Omar Fathy", jobLevel: "Level 2", roles: ["transportation"] },
  { id: "u-timing-1", employeeNumber: "TIM001", displayName: "Laila Mostafa", jobLevel: "Level 2", roles: ["timing"] },
  { id: "u-salary-1", employeeNumber: "SAL001", displayName: "Youssef Adly", jobLevel: "Assistant", roles: ["salary"] },
];