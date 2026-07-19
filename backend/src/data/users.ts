import type { User } from "@travel-reimbursement/shared";

/**
 * Stable, obviously fictional accounts for development and automated tests.
 * Administrative users also have the employee role so every staff member can
 * submit a personal request while retaining their department capability.
 */
export const developmentUsers: readonly User[] = [
  {
    id: "u1",
    employeeNumber: "DEV001",
    displayName: "Mariam Hassan (Demo)",
    jobLevel: "Level 1",
    roles: ["employee"],
  },
  {
    id: "u2",
    employeeNumber: "DEV002",
    displayName: "Omar Nabil (Demo)",
    jobLevel: "Level 2",
    roles: ["employee"],
  },
  {
    id: "u3",
    employeeNumber: "DEV003",
    displayName: "Salma Fathy (Demo)",
    jobLevel: "Level 3",
    roles: ["employee"],
  },
  {
    id: "u4",
    employeeNumber: "DEV004",
    displayName: "Karim Adel (Demo Manager)",
    jobLevel: "General Manager",
    roles: ["employee", "manager"],
  },
  {
    id: "u5",
    employeeNumber: "DEV005",
    displayName: "Nour Samir (Demo PR)",
    jobLevel: "Assistant",
    roles: ["employee", "pr"],
  },
  {
    id: "u6",
    employeeNumber: "DEV006",
    displayName: "Youssef Amin (Demo Transportation)",
    jobLevel: "Level 1",
    roles: ["employee", "transportation"],
  },
  {
    id: "u7",
    employeeNumber: "DEV007",
    displayName: "Dina Hany (Demo Timing)",
    jobLevel: "Level 2",
    roles: ["employee", "timing"],
  },
  {
    id: "u8",
    employeeNumber: "DEV008",
    displayName: "Tarek Mostafa (Demo Salary)",
    jobLevel: "General Manager",
    roles: ["employee", "salary"],
  },
  {
    id: "u9",
    employeeNumber: "DEV009",
    displayName: "Heba Magdy (Demo Salary)",
    jobLevel: "Assistant General Manager",
    roles: ["employee", "salary"],
  },
];
