import { GoogleGenAI, createPartFromBase64 } from "@google/genai";
import { prisma } from "../lib/prisma.js";
import path from "path";
import { readFile } from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "receipts");

let aiClient: GoogleGenAI | null = null;

export function getAiClient(apiKey?: string): GoogleGenAI {
  const key = apiKey ?? process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_GEMINI_API_KEY is required for AI features");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export async function logAiUsage(
  tenantId: string,
  userId: string,
  action: string,
  tokensIn?: number,
  tokensOut?: number
) {
  try {
    await prisma.aiLog.create({
      data: {
        tenantId,
        userId,
        action,
        model: "gemini",
        tokensIn,
        tokensOut,
      },
    });
  } catch {
    // Non-critical
  }
}

const RECEIPT_PARSE_PROMPT = `Extract structured data from this receipt image. Return ONLY valid JSON with these exact keys (no markdown, no extra text):
{
  "amount": number (total amount, e.g. 25.50),
  "currency": "USD" or "INR" or other 3-letter code,
  "merchant": string (store/vendor name),
  "date": "YYYY-MM-DD" if visible, else null,
  "items": array of strings (line items if visible),
  "description": string (short summary for expense, max 100 chars)
}
If you cannot read the receipt, return: {"error": "Could not parse receipt"}`;

export async function parseReceiptFromImage(
  imageBuffer: Buffer,
  mimeType: string,
  tenantId: string,
  userId: string
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const ai = getAiClient();
  const base64 = imageBuffer.toString("base64");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      RECEIPT_PARSE_PROMPT,
      createPartFromBase64(base64, mimeType),
    ],
  });

  const text = response.text?.trim() ?? "";
  await logAiUsage(tenantId, userId, "receipt_parse");

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    if (parsed.error) {
      return { error: String(parsed.error) };
    }
    return { data: parsed };
  } catch {
    return { error: "Failed to parse AI response" };
  }
}

export async function parseReceiptFromFile(
  filepath: string,
  tenantId: string,
  userId: string
): Promise<{ data?: Record<string, unknown>; error?: string }> {
  const buffer = await readFile(filepath);
  const ext = path.extname(filepath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return parseReceiptFromImage(buffer, mime, tenantId, userId);
}

const CATEGORIZE_PROMPT = `Given an expense description, suggest the best matching category. Return ONLY a valid JSON object:
{"category": "Category Name", "confidence": 0.0-1.0}
Use one of these categories if provided, otherwise suggest a sensible one: {categories}
Description: `;

export async function categorizeExpense(
  text: string,
  categories: string[],
  tenantId: string,
  userId: string
): Promise<{ category: string; confidence: number }> {
  const ai = getAiClient();
  const catList = categories.length > 0 ? categories.join(", ") : "Food, Transport, Shopping, Bills, Entertainment, Health, Other";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: CATEGORIZE_PROMPT.replace("{categories}", catList) + text,
  });

  const raw = response.text?.trim() ?? "";
  await logAiUsage(tenantId, userId, "categorize");

  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as { category: string; confidence?: number };
    return {
      category: parsed.category ?? "Other",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.8,
    };
  } catch {
    return { category: "Other", confidence: 0.5 };
  }
}

const INSIGHTS_PROMPT = `You are a personal finance advisor. Based on the user's expense summary below, provide 3-5 brief, actionable insights or tips (each 1-2 sentences). Be specific and helpful. Return ONLY a JSON array of strings:
["insight 1", "insight 2", ...]

Expense summary:
`;

export async function generateInsights(
  summary: string,
  tenantId: string,
  userId: string
): Promise<string[]> {
  const ai = getAiClient();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: INSIGHTS_PROMPT + summary,
  });

  const raw = response.text?.trim() ?? "";
  await logAiUsage(tenantId, userId, "insights");

  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as string[];
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

// ============ SMART EXPENSE FROM RECEIPT ============
export type ParsedReceiptData = {
  amount: number;
  currency?: string;
  merchant?: string;
  date?: string | null;
  items?: string[];
  description?: string;
};

// ============ NATURAL LANGUAGE EXPENSE ENTRY ============
const NL_EXPENSE_PROMPT = `Parse this natural language expense into structured data. Return ONLY valid JSON:
{"amount": number, "currency": "USD"|"INR"|etc, "description": string, "date": "YYYY-MM-DD", "category": string}
Examples: "$30 Uber yesterday" -> {"amount":30,"currency":"USD","description":"Uber","date":"<yesterday>","category":"Transport"}
"50 INR chai today" -> {"amount":50,"currency":"INR","description":"Chai","date":"<today>","category":"Food"}
Use today's date if not specified. Today is {today}.
Input: `;

export async function parseNaturalLanguageExpense(
  text: string,
  tenantId: string,
  userId: string
): Promise<{ amount: number; currency: string; description: string; date: string; category: string } | null> {
  const ai = getAiClient();
  const today = new Date().toISOString().slice(0, 10);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: NL_EXPENSE_PROMPT.replace("{today}", today) + text,
  });

  const raw = response.text?.trim() ?? "";
  await logAiUsage(tenantId, userId, "nl_expense");

  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    const date = String(parsed.date ?? today);
    const resolvedDate = date === "<today>" || date === "today" ? today : date;
    return {
      amount: Number(parsed.amount) || 0,
      currency: String(parsed.currency ?? "USD"),
      description: String(parsed.description ?? text),
      date: resolvedDate,
      category: String(parsed.category ?? "Other"),
    };
  } catch {
    return null;
  }
}

// ============ RECURRING EXPENSE DETECTION ============
export type RecurringPattern = {
  description: string;
  avgAmount: number;
  frequency: "weekly" | "monthly" | "yearly";
  count: number;
  lastDate: string;
};

// ============ MONTHLY REPORT ============
const REPORT_PROMPT = `Generate a concise monthly expense report (2-4 paragraphs). Include:
1. Total spent vs budget (if any)
2. Top spending categories with brief analysis
3. Notable trends or changes
4. 1-2 actionable recommendations
Be professional and helpful. Return plain text (no JSON).

Data:
`;

// ============ SPENDING ANOMALY ============
const ANOMALY_PROMPT = `Analyze this spending data for anomalies. Return ONLY a JSON array of objects:
[{"type": "high_spend"|"unusual_category"|"budget_exceeded", "message": string, "severity": "low"|"medium"|"high"}]
Focus on: spending spikes, categories that doubled, budget overruns. Return [] if nothing notable.

Data:
`;

// ============ CHAT Q&A ============
const CHAT_PROMPT = `You are a helpful expense tracker assistant. Answer the user's question based ONLY on the expense data below. Be concise (1-3 sentences). If the data doesn't contain the answer, say so.

Expense data:
{data}

User question: `;

export async function generateMonthlyReport(
  summary: string,
  tenantId: string,
  userId: string
): Promise<string> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: REPORT_PROMPT + summary,
  });
  const text = response.text?.trim() ?? "";
  await logAiUsage(tenantId, userId, "monthly_report");
  return text;
}

export async function detectSpendingAnomalies(
  summary: string,
  tenantId: string,
  userId: string
): Promise<Array<{ type: string; message: string; severity: string }>> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: ANOMALY_PROMPT + summary,
  });
  const raw = response.text?.trim() ?? "";
  await logAiUsage(tenantId, userId, "anomaly_detect");

  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed.filter((a) => a.type && a.message) : [];
  } catch {
    return [];
  }
}

export async function answerSpendingQuestion(
  query: string,
  dataSummary: string,
  tenantId: string,
  userId: string
): Promise<string> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: CHAT_PROMPT.replace("{data}", dataSummary) + query,
  });
  const text = response.text?.trim() ?? "";
  await logAiUsage(tenantId, userId, "chat_qa");
  return text;
}
