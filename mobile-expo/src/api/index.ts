import type { User, Category, Expense, Receipt } from '../types/api';
import { apiGet, apiPost, apiPatch, apiDelete } from './client';

// Auth
export async function login(email: string, password: string, tenantId?: string) {
  return apiPost<{ user: User; token: string; expiresIn: string }>('/auth/login', {
    email,
    password,
    tenantId,
  });
}

export async function signup(email: string, password: string, name?: string, tenantName?: string) {
  return apiPost<{ user: User; token: string; expiresIn: string }>('/auth/signup', {
    email,
    password,
    name,
    tenantName,
  });
}

export async function getMe() {
  return apiGet<{ user: User }>('/auth/me');
}

// User
export async function updateProfile(data: { name?: string; currency?: string; monthlyBudget?: number | null }) {
  return apiPatch<{ user: User }>('/users/me', data);
}

// Categories
export async function getCategories(type?: 'expense' | 'income') {
  const q = type ? `?type=${type}` : '';
  return apiGet<{ categories: Category[] }>(`/categories${q}`);
}

export async function createCategory(data: { name: string; icon?: string; color?: string; type?: 'expense' | 'income' }) {
  return apiPost<{ category: Category }>('/categories', data);
}

export async function updateCategory(id: string, data: { name?: string; icon?: string; color?: string; type?: 'expense' | 'income' }) {
  return apiPatch<{ category: Category }>(`/categories/${id}`, data);
}

export async function deleteCategory(id: string) {
  return apiDelete(`/categories/${id}`);
}

// Expenses
export async function getExpenseSummary() {
  return apiGet<{ totalSpent: number; monthlySpent: number }>('/expenses/summary');
}

export async function getExpenses(params?: {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  categoryId?: string;
  search?: string;
}) {
  const q = params
    ? '?' +
      Object.entries(params)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return apiGet<{ expenses: Expense[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
    `/expenses${q}`
  );
}

export async function createExpense(data: {
  amount: number;
  currency?: string;
  categoryId?: string | null;
  description?: string | null;
  date: string;
  isRecurring?: boolean;
}) {
  return apiPost<{ expense: Expense }>('/expenses', data);
}

export async function updateExpense(id: string, data: Partial<{ amount: number; categoryId: string | null; description: string | null; date: string }>) {
  return apiPatch<{ expense: Expense }>(`/expenses/${id}`, data);
}

export async function deleteExpense(id: string) {
  return apiDelete(`/expenses/${id}`);
}

// Receipts
export async function uploadReceipt(uri: string) {
  const token = await import('./client').then((m) => m.getToken());
  if (!token) return { error: 'Not authenticated' };

  const filename = uri.split('/').pop() || 'image.jpg';
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: filename,
    type: 'image/jpeg',
  } as any);

  const { API_BASE, API_PREFIX } = await import('../config/api');
  const url = `${API_BASE}${API_PREFIX}/receipts/upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json.error || 'Upload failed' };
  return { data: json.data };
}

// AI
export async function getAiStatus() {
  return apiGet<{ enabled: boolean }>('/ai/status');
}

export async function parseReceiptFromImage(uri: string) {
  const token = await import('./client').then((m) => m.getToken());
  if (!token) return { error: 'Not authenticated' };

  const { API_BASE, API_PREFIX } = await import('../config/api');
  const url = `${API_BASE}${API_PREFIX}/ai/receipt-parse`;

  try {
    const formData = new FormData();
    const filename = uri.split('/').pop() || `receipt_${Date.now()}.jpg`;
    formData.append('file', {
      uri,
      name: filename,
      type: 'image/jpeg',
    } as any);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error || `Parse failed (${res.status})` };
    return { data: json.data ?? json };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Upload failed';
    return { error: msg };
  }
}

export async function receiptToExpense(receiptData: Record<string, unknown>, receiptId?: string, createExpense?: boolean) {
  return apiPost<{ expense?: Expense; parsed: Record<string, unknown> }>('/ai/receipt-to-expense', {
    receiptData,
    receiptId,
    createExpense,
  });
}

export async function expenseFromText(text: string, createExpense?: boolean) {
  return apiPost<{ expense?: Expense; parsed: Record<string, unknown> }>('/ai/expense-from-text', {
    text,
    createExpense,
  });
}

export async function getInsights() {
  return apiGet<{ insights: string }>('/ai/insights');
}

export async function getReport(month?: number, year?: number) {
  const q: string[] = [];
  if (month != null) q.push(`month=${month + 1}`);
  if (year != null) q.push(`year=${year}`);
  return apiGet<{ report: string; month: number; year: number }>(`/ai/report${q.length ? '?' + q.join('&') : ''}`);
}

export async function getAnomalies(month?: number, year?: number) {
  const q: string[] = [];
  if (month != null) q.push(`month=${month + 1}`);
  if (year != null) q.push(`year=${year}`);
  return apiGet<{ anomalies: Array<{ type: string; message: string; severity: string }> }>(
    `/ai/anomalies${q.length ? '?' + q.join('&') : ''}`
  );
}

export async function aiChat(query: string) {
  return apiPost<{ answer: string }>('/ai/chat', { query });
}
