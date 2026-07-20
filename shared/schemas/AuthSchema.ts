import { z } from "zod";

export const LoginInputSchema = z.object({
  employeeNumber: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(200),
  remember: z.boolean().optional().default(false),
});
