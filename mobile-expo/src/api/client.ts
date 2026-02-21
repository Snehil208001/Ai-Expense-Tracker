import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, API_PREFIX } from '../config/api';

const TOKEN_KEY = '@expense_tracker_token';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const { token, ...init } = options;
  const url = `${API_BASE}${API_PREFIX}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { ...init, headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: json.error || json.message || 'Request failed', status: res.status };
    }
    return { data: json.data ?? json, status: res.status };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Network error';
    return { error: msg, status: 0 };
  }
}

export async function apiGet<T>(path: string, token?: string | null): Promise<{ data?: T; error?: string }> {
  const t = token ?? (await getToken());
  return request<T>(path, { method: 'GET', token: t });
}

export async function apiPost<T>(path: string, body?: unknown, token?: string | null): Promise<{ data?: T; error?: string }> {
  const t = token ?? (await getToken());
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, token: t });
}

export async function apiPatch<T>(path: string, body: unknown, token?: string | null): Promise<{ data?: T; error?: string }> {
  const t = token ?? (await getToken());
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token: t });
}

export async function apiDelete(path: string, token?: string | null): Promise<{ error?: string }> {
  const t = token ?? (await getToken());
  return request(path, { method: 'DELETE', token: t });
}
