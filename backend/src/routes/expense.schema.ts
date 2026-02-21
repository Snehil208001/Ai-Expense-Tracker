import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  categoryId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  date: z.string(), // ISO date or YYYY-MM-DD
  isRecurring: z.boolean().default(false),
  receiptId: z.string().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const listExpenseQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  from: z.string().optional(),
  to: z.string().optional(),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  type: z.enum(["expense", "income"]).optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpenseQuery = z.infer<typeof listExpenseQuerySchema>;
