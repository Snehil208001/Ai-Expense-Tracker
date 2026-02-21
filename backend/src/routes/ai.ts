import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import multipart from "@fastify/multipart";
import path from "path";
import { prisma } from "../lib/prisma.js";
import {
  parseReceiptFromImage,
  parseReceiptFromFile,
  categorizeExpense,
  generateInsights,
  generateMonthlyReport,
  detectSpendingAnomalies,
  answerSpendingQuestion,
  parseNaturalLanguageExpense,
  getAiClient,
} from "../services/ai.js";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function buildExpenseSummary(
  tenantId: string,
  userId: string,
  options?: { month?: number; year?: number }
) {
  const now = options?.year && options?.month != null
    ? new Date(options.year, options.month, 1)
    : new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const expenses = await prisma.expense.findMany({
    where: { tenantId, userId, date: { gte: startOfMonth, lte: endOfMonth } },
    orderBy: { date: "desc" },
    take: 200,
  });

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const categoryIds = [...new Set(expenses.map((e) => e.categoryId).filter(Boolean))] as string[];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
  const byCategory = expenses.reduce((acc, e) => {
    const key = e.categoryId ? (catMap[e.categoryId] ?? e.categoryId) : "Uncategorized";
    acc[key] = (acc[key] ?? 0) + Number(e.amount);
    return acc;
  }, {} as Record<string, number>);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlyBudget: true, currency: true },
  });

  const budget = user?.monthlyBudget ? Number(user.monthlyBudget) : null;
  const currency = user?.currency ?? "USD";

  return {
    summary: `
Total spent this month: ${currency} ${total.toFixed(2)}
${budget ? `Monthly budget: ${currency} ${budget.toFixed(2)}` : ""}
${budget ? `Remaining: ${currency} ${(budget - total).toFixed(2)}` : ""}

Spending by category:
${Object.entries(byCategory)
  .map(([k, v]) => `- ${k}: ${currency} ${v.toFixed(2)}`)
  .join("\n")}

Recent expenses:
${expenses
  .slice(0, 20)
  .map((e) => `- ${e.description ?? "No description"}: ${e.amount} on ${e.date.toISOString().slice(0, 10)}`)
  .join("\n")}
`.trim(),
    total,
    byCategory,
    expenses,
    currency,
    budget,
  };
}

export async function aiRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.authenticate);

  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  // Check if AI is configured
  app.get("/ai/status", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      getAiClient();
      return reply.send({ success: true, data: { enabled: true } });
    } catch {
      return reply.send({ success: true, data: { enabled: false } });
    }
  });

  // Receipt OCR + parse - upload image (multipart) or parse by receiptId (JSON)
  app.post(
    "/ai/receipt-parse",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };

      const data = await request.file();
      if (data) {
        // Parse from uploaded file
        const mime = data.mimetype;
        if (!ALLOWED_IMAGE_TYPES.includes(mime)) {
          return reply.status(400).send({
            success: false,
            error: "Invalid file type. Use JPEG, PNG, or WebP.",
          });
        }

        const chunks: Buffer[] = [];
        for await (const chunk of data.file) {
          chunks.push(Buffer.from(chunk));
        }
        const buffer = Buffer.concat(chunks);

        try {
          const result = await parseReceiptFromImage(
            buffer,
            mime,
            payload.tenantId,
            payload.id
          );
          if (result.error) {
            return reply.status(422).send({
              success: false,
              error: result.error,
            });
          }
          return reply.send({ success: true, data: result.data });
        } catch (err) {
          request.log.error(err);
          return reply.status(500).send({
            success: false,
            error: "AI processing failed",
          });
        }
      }

      // Parse from existing receipt by ID - use separate route for JSON body
      return reply.status(400).send({
        success: false,
        error: "Send multipart form with 'file' field (JPEG/PNG/WebP)",
      });
    }
  );

  // Parse receipt by ID (existing uploaded receipt)
  app.post<{ Body: { receiptId: string } }>(
    "/ai/receipt-parse-by-id",
    async (
      request: FastifyRequest<{ Body: { receiptId: string } }>,
      reply: FastifyReply
    ) => {
      const payload = request.user as { id: string; tenantId: string };
      const { receiptId } = request.body ?? {};

      if (!receiptId) {
        return reply.status(400).send({
          success: false,
          error: "receiptId is required",
        });
      }

      const receipt = await prisma.receipt.findFirst({
        where: {
          id: receiptId,
          tenantId: payload.tenantId,
          userId: payload.id,
        },
      });
      if (!receipt) {
        return reply.status(404).send({
          success: false,
          error: "Receipt not found",
        });
      }

      const filepath = path.join(process.cwd(), receipt.url);
      try {
        const result = await parseReceiptFromFile(
          filepath,
          payload.tenantId,
          payload.id
        );
        if (result.error) {
          return reply.status(422).send({
            success: false,
            error: result.error,
          });
        }
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: { ocrText: JSON.stringify(result.data) },
        });
        return reply.send({ success: true, data: result.data });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          error: "AI processing failed",
        });
      }
    }
  );

  // Categorize expense text
  app.post<{
    Body: { text: string; categories?: string[] };
  }>(
    "/ai/categorize",
    async (
      request: FastifyRequest<{ Body: { text: string; categories?: string[] } }>,
      reply: FastifyReply
    ) => {
      const payload = request.user as { id: string; tenantId: string };
      const { text, categories } = request.body ?? {};

      if (!text || typeof text !== "string") {
        return reply.status(400).send({
          success: false,
          error: "text is required",
        });
      }

      let catList = categories;
      if (!catList || catList.length === 0) {
        const dbCats = await prisma.category.findMany({
          where: { tenantId: payload.tenantId },
          select: { name: true },
        });
        catList = dbCats.map((c) => c.name);
      }

      try {
        const result = await categorizeExpense(
          text,
          catList,
          payload.tenantId,
          payload.id
        );
        return reply.send({ success: true, data: result });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          success: false,
          error: "AI categorization failed",
        });
      }
    }
  );

  // Generate insights from user's expenses (GET - no body needed)
  app.get(
    "/ai/insights",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      try {
        const { summary } = await buildExpenseSummary(payload.tenantId, payload.id);
        const insights = await generateInsights(summary, payload.tenantId, payload.id);
        return reply.send({ success: true, data: { insights } });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ success: false, error: "AI insights failed" });
      }
    }
  );

  // ============ SMART EXPENSE FROM RECEIPT ============
  app.post<{ Body: { receiptData: Record<string, unknown>; receiptId?: string; createExpense?: boolean } }>(
    "/ai/receipt-to-expense",
    async (request: FastifyRequest<{ Body: { receiptData: Record<string, unknown>; receiptId?: string; createExpense?: boolean } }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const { receiptData, receiptId, createExpense } = request.body ?? {};

      if (!receiptData || typeof receiptData !== "object") {
        return reply.status(400).send({ success: false, error: "receiptData is required" });
      }

      const amount = Number(receiptData.amount);
      if (!amount || amount <= 0) {
        return reply.status(400).send({ success: false, error: "Invalid amount in receipt data" });
      }

      const currency = String(receiptData.currency ?? "USD");
      const description = String(receiptData.description ?? receiptData.merchant ?? "Receipt");
      // Use date from receiptData if valid, otherwise today
      const dateInput = receiptData.date ? String(receiptData.date).trim() : "";
      const parsedDate = dateInput ? new Date(dateInput) : new Date();
      const date = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      date.setHours(0, 0, 0, 0);

      const categories = await prisma.category.findMany({
        where: { tenantId: payload.tenantId },
        select: { id: true, name: true },
      });
      const catResult = await categorizeExpense(description, categories.map((c) => c.name), payload.tenantId, payload.id);
      const matchingCat = categories.find((c) => c.name.toLowerCase() === catResult.category.toLowerCase());

      const expenseData = {
        amount,
        currency,
        description,
        date,
        categoryId: matchingCat?.id ?? null,
        receiptId: receiptId ?? null,
      };

      if (createExpense) {
        const expense = await prisma.expense.create({
          data: {
            tenantId: payload.tenantId,
            userId: payload.id,
            amount: expenseData.amount,
            currency: expenseData.currency,
            description: expenseData.description,
            date: expenseData.date,
            categoryId: expenseData.categoryId,
            receiptId: expenseData.receiptId,
          },
        });
        return reply.status(201).send({ success: true, data: { expense, parsed: expenseData } });
      }

      return reply.send({ success: true, data: { parsed: expenseData } });
    }
  );

  // ============ NATURAL LANGUAGE EXPENSE ENTRY ============
  app.post<{ Body: { text: string; createExpense?: boolean } }>(
    "/ai/expense-from-text",
    async (request: FastifyRequest<{ Body: { text: string; createExpense?: boolean } }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const { text, createExpense } = request.body ?? {};

      if (!text || typeof text !== "string") {
        return reply.status(400).send({ success: false, error: "text is required" });
      }

      try {
        const parsed = await parseNaturalLanguageExpense(text, payload.tenantId, payload.id);
        if (!parsed || parsed.amount <= 0) {
          return reply.status(422).send({ success: false, error: "Could not parse expense from text" });
        }

        const categories = await prisma.category.findMany({
          where: { tenantId: payload.tenantId },
          select: { id: true, name: true },
        });
        const matchingCat = categories.find((c) => c.name.toLowerCase() === parsed.category.toLowerCase());

        if (createExpense) {
          const expense = await prisma.expense.create({
            data: {
              tenantId: payload.tenantId,
              userId: payload.id,
              amount: parsed.amount,
              currency: parsed.currency,
              description: parsed.description,
              date: new Date(parsed.date),
              categoryId: matchingCat?.id ?? null,
            },
          });
          return reply.status(201).send({ success: true, data: { expense, parsed } });
        }

        return reply.send({ success: true, data: { parsed } });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ success: false, error: "AI parsing failed" });
      }
    }
  );

  // ============ RECURRING EXPENSE DETECTION ============
  app.get("/ai/recurring", async (request: FastifyRequest, reply: FastifyReply) => {
    const payload = request.user as { id: string; tenantId: string };

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const expenses = await prisma.expense.findMany({
      where: { tenantId: payload.tenantId, userId: payload.id, date: { gte: sixMonthsAgo } },
      orderBy: { date: "asc" },
    });

    const byDesc = expenses.reduce((acc, e) => {
      const key = (e.description ?? "").toLowerCase().trim() || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push({ amount: Number(e.amount), date: e.date });
      return acc;
    }, {} as Record<string, { amount: number; date: Date }[]>);

    const patterns: Array<{ description: string; avgAmount: number; frequency: string; count: number; lastDate: string }> = [];
    for (const [desc, items] of Object.entries(byDesc)) {
      if (items.length < 2) continue;
      const sorted = items.sort((a, b) => a.date.getTime() - b.date.getTime());
      const gaps = sorted.slice(1).map((_, i) => (sorted[i + 1].date.getTime() - sorted[i].date.getTime()) / (24 * 60 * 60 * 1000));
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      let frequency = "monthly";
      if (avgGap <= 10) frequency = "weekly";
      else if (avgGap >= 25) frequency = "monthly";
      else if (avgGap >= 300) frequency = "yearly";

      const avgAmount = items.reduce((s, i) => s + i.amount, 0) / items.length;
      patterns.push({
        description: desc,
        avgAmount: Math.round(avgAmount * 100) / 100,
        frequency,
        count: items.length,
        lastDate: sorted[sorted.length - 1].date.toISOString().slice(0, 10),
      });
    }

    patterns.sort((a, b) => b.count - a.count);
    return reply.send({ success: true, data: { patterns: patterns.slice(0, 10) } });
  });

  // ============ MONTHLY REPORT ============
  app.get<{ Querystring: { month?: string; year?: string } }>(
    "/ai/report",
    async (request: FastifyRequest<{ Querystring: { month?: string; year?: string } }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const { month, year } = request.query ?? {};
      const now = new Date();
      const m = month != null ? parseInt(String(month), 10) - 1 : now.getMonth();
      const y = year ? parseInt(String(year), 10) : now.getFullYear();

      try {
        const { summary } = await buildExpenseSummary(payload.tenantId, payload.id, { month: m, year: y });
        const report = await generateMonthlyReport(summary, payload.tenantId, payload.id);
        return reply.send({ success: true, data: { report, month: m, year: y } });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ success: false, error: "Report generation failed" });
      }
    }
  );

  // ============ SPENDING ANOMALY ALERTS ============
  app.get<{ Querystring: { month?: string; year?: string } }>(
    "/ai/anomalies",
    async (request: FastifyRequest<{ Querystring: { month?: string; year?: string } }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const { month, year } = request.query ?? {};
      const now = new Date();
      const m = month != null ? parseInt(String(month), 10) - 1 : now.getMonth();
      const y = year ? parseInt(String(year), 10) : now.getFullYear();
      try {
        const { summary } = await buildExpenseSummary(payload.tenantId, payload.id, { month: m, year: y });
        const anomalies = await detectSpendingAnomalies(summary, payload.tenantId, payload.id);
        return reply.send({ success: true, data: { anomalies } });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ success: false, error: "Anomaly detection failed" });
      }
    }
  );

  // ============ DUPLICATE DETECTION ============
  app.post<{ Body: { amount: number; date: string; description?: string } }>(
    "/ai/check-duplicate",
    async (request: FastifyRequest<{ Body: { amount: number; date: string; description?: string } }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const { amount, date, description } = request.body ?? {};

      if (!amount || !date) {
        return reply.status(400).send({ success: false, error: "amount and date required" });
      }

      const d = new Date(date);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const similar = await prisma.expense.findMany({
        where: {
          tenantId: payload.tenantId,
          userId: payload.id,
          amount: { gte: amount * 0.99, lte: amount * 1.01 },
          date: { gte: dayStart, lt: dayEnd },
        },
      });

      const duplicates = similar.map((e) => ({
        id: e.id,
        amount: e.amount,
        description: e.description,
        date: e.date,
      }));

      return reply.send({
        success: true,
        data: { isDuplicate: duplicates.length > 0, duplicates },
      });
    }
  );

  // ============ CHAT Q&A ============
  app.post<{ Body: { query: string } }>(
    "/ai/chat",
    async (request: FastifyRequest<{ Body: { query: string } }>, reply: FastifyReply) => {
      const payload = request.user as { id: string; tenantId: string };
      const { query } = request.body ?? {};

      if (!query || typeof query !== "string") {
        return reply.status(400).send({ success: false, error: "query is required" });
      }

      try {
        const { summary } = await buildExpenseSummary(payload.tenantId, payload.id);
        const answer = await answerSpendingQuestion(query, summary, payload.tenantId, payload.id);
        return reply.send({ success: true, data: { answer } });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({ success: false, error: "Chat failed" });
      }
    }
  );
}
