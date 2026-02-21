import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { createExpenseSchema, updateExpenseSchema, listExpenseQuerySchema } from "./expense.schema.js";

type CreateBody = {
  amount: number;
  currency?: string;
  categoryId?: string | null;
  description?: string | null;
  date: string;
  isRecurring?: boolean;
  receiptId?: string | null;
};
type UpdateBody = Partial<CreateBody>;
type Params = { id: string };

function parseDate(s: string): Date {
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new Error("Invalid date");
  return d;
}

export async function expenseRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate);

  // Summary: total spent + monthly spent (must be before /:id to avoid "summary" matching as id)
  app.get(
    "/expenses/summary",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const baseWhere: Prisma.ExpenseWhereInput = {
        tenantId: payload.tenantId,
        userId: payload.id,
      };
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const [totalRes, monthlyRes] = await Promise.all([
        prisma.expense.aggregate({
          where: baseWhere,
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: {
            ...baseWhere,
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
      ]);

      const toNum = (v: unknown): number => {
        if (v == null) return 0;
        if (typeof v === 'object' && v !== null && 'toNumber' in v && typeof (v as { toNumber: () => number }).toNumber === 'function') {
          return (v as { toNumber: () => number }).toNumber();
        }
        return Number(v);
      };
      const totalSpent = toNum(totalRes._sum.amount);
      const monthlySpent = toNum(monthlyRes._sum.amount);

      return reply.send({
        success: true,
        data: { totalSpent, monthlySpent },
      });
    }
  );

  // List with search/filter
  app.get(
    "/expenses",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const parsed = listExpenseQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const { page, limit, from, to, categoryId, search } = parsed.data;
      const skip = (page - 1) * limit;

      const where: Prisma.ExpenseWhereInput = {
        tenantId: payload.tenantId,
        userId: payload.id,
      };

      if (from || to) {
        where.date = {};
        if (from) where.date.gte = parseDate(from);
        if (to) where.date.lte = parseDate(to);
      }
      if (categoryId) where.categoryId = categoryId;
      if (search) {
        where.OR = [
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          orderBy: { date: "desc" },
          skip,
          take: limit,
        }),
        prisma.expense.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: {
          expenses,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        },
      });
    }
  );

  // Create
  app.post<{ Body: CreateBody }>(
    "/expenses",
    async (request: FastifyRequest<{ Body: CreateBody }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const parsed = createExpenseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const date = parseDate(parsed.data.date);

      const expense = await prisma.expense.create({
        data: {
          tenantId: payload.tenantId,
          userId: payload.id,
          amount: parsed.data.amount,
          currency: parsed.data.currency ?? "USD",
          categoryId: parsed.data.categoryId ?? null,
          description: parsed.data.description ?? null,
          date,
          isRecurring: parsed.data.isRecurring ?? false,
          receiptId: parsed.data.receiptId ?? null,
        },
      });

      return reply.status(201).send({ success: true, data: { expense } });
    }
  );

  // Get by id
  app.get<{ Params: Params }>(
    "/expenses/:id",
    async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const { id } = request.params;

      const expense = await prisma.expense.findFirst({
        where: { id, tenantId: payload.tenantId, userId: payload.id },
      });
      if (!expense) {
        return reply.status(404).send({ success: false, error: "Expense not found" });
      }
      return reply.send({ success: true, data: { expense } });
    }
  );

  // Update
  app.patch<{ Params: Params; Body: UpdateBody }>(
    "/expenses/:id",
    async (request: FastifyRequest<{ Params: Params; Body: UpdateBody }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const { id } = request.params;
      const parsed = updateExpenseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        });
      }

      const existing = await prisma.expense.findFirst({
        where: { id, tenantId: payload.tenantId, userId: payload.id },
      });
      if (!existing) {
        return reply.status(404).send({ success: false, error: "Expense not found" });
      }

      const data: Prisma.ExpenseUpdateInput = {};
      if (parsed.data.amount !== undefined) data.amount = parsed.data.amount;
      if (parsed.data.currency !== undefined) data.currency = parsed.data.currency;
      if (parsed.data.categoryId !== undefined) data.categoryId = parsed.data.categoryId;
      if (parsed.data.description !== undefined) data.description = parsed.data.description;
      if (parsed.data.date !== undefined) data.date = parseDate(parsed.data.date);
      if (parsed.data.isRecurring !== undefined) data.isRecurring = parsed.data.isRecurring;
      if (parsed.data.receiptId !== undefined) data.receiptId = parsed.data.receiptId;

      const expense = await prisma.expense.update({
        where: { id },
        data,
      });

      return reply.send({ success: true, data: { expense } });
    }
  );

  // Delete
  app.delete<{ Params: Params }>(
    "/expenses/:id",
    async (request: FastifyRequest<{ Params: Params }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const { id } = request.params;

      const existing = await prisma.expense.findFirst({
        where: { id, tenantId: payload.tenantId, userId: payload.id },
      });
      if (!existing) {
        return reply.status(404).send({ success: false, error: "Expense not found" });
      }

      await prisma.expense.delete({ where: { id } });
      return reply.status(204).send();
    }
  );
}
