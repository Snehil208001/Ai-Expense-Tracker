export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar?: string | null;
  currency: string;
  monthlyBudget?: number | null;
  tenantId: string;
  tenant?: { id: string; name: string; slug: string };
}

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  type: 'expense' | 'income';
  isSystem?: boolean;
}

export interface Expense {
  id: string;
  amount: string | number;
  currency: string;
  categoryId?: string | null;
  description?: string | null;
  date: string;
  isRecurring?: boolean;
  receiptId?: string | null;
  createdAt: string;
}

export interface Receipt {
  id: string;
  url: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: Pick<User, 'id' | 'email' | 'name' | 'tenantId'> & { tenantSlug?: string };
    token: string;
    expiresIn: string;
  };
  error?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export interface Anomaly {
  type: string;
  message: string;
  severity: string;
}
