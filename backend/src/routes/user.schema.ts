import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  avatar: z.string().url().optional().nullable(),
  currency: z.string().length(3).optional(),
  monthlyBudget: z.number().min(0).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
