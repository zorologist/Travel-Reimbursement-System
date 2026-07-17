export type SystemRole =
  | "employee"
  | "manager"
  | "pr"
  | "transportation"
  | "timing"
  | "salary";

export type JobLevel =
  | "Chairman"
  | "Deputy"
  | "Advisor"
  | "Expert"
  | "Assistant"
  | "Deputy Assistant"
  | "General Manager"
  | "Assistant General Manager"
  | "Level 1"
  | "Level 2"
  | "Level 3";

export interface User {
  id: string;
  employeeNumber: string;
  displayName: string;
  jobLevel: JobLevel;
  roles: SystemRole[];
}
