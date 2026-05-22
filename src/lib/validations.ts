import { z } from "zod";

export const registerSchema = z
  .object({
    username: z.string().min(3).max(32),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const accountSetupSchema = z.object({
  name: z.string().min(1).max(64),
  initialBalance: z.coerce.number().positive(),
  currentBalance: z.coerce.number().positive(),
  accountType: z.enum(["PERSONAL", "PROP_FIRM", "DEMO", "LIVE"]),
  isFunded: z.coerce.boolean(),
  propFirmName: z.string().optional(),
  challengeSize: z.coerce.number().optional(),
  profitTarget: z.coerce.number().optional(),
  dailyDrawdownLimit: z.coerce.number().optional(),
  maxDrawdownLimit: z.coerce.number().optional(),
  currentDrawdown: z.coerce.number().optional(),
  currentProfitProgress: z.coerce.number().optional(),
  phase: z
    .enum(["CHALLENGE_PHASE_1", "CHALLENGE_PHASE_2", "FUNDED"])
    .optional(),
  phaseDaysRemaining: z.coerce.number().int().positive().optional(),
});

export const dailyEntrySchema = z.object({
  accountId: z.string(),
  startBalance: z.coerce.number(),
  endBalance: z.coerce.number(),
  date: z.string().optional(),
});
