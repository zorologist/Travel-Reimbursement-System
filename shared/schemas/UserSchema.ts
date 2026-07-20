import { z } from "zod";

export const SystemRoleSchema = z.enum([
  "employee",
  "manager",
  "pr",
  "transportation",
  "timing",
  "salary",
]);

export const JobLevelSchema = z.enum([
  "Chairman",
  "Deputy",
  "Advisor",
  "Expert",
  "Assistant",
  "Deputy Assistant",
  "General Manager",
  "Assistant General Manager",
  "Level 1",
  "Level 2",
  "Level 3",
]);

export const UserSchema = z.object({
  id: z.string(),
  employeeNumber: z.string(),
  displayName: z.string(),
  department: z.string().trim().min(1),
  jobLevel: JobLevelSchema,
  roles: z.array(SystemRoleSchema),
});
