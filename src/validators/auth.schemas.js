import { z } from "zod";

export const registrationSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(72),
});
