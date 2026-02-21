import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '../types/api';
import { getMe } from '../api';
import { getToken, setToken, clearToken } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (token: string, user: User) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    ready: false,
  });

  const refreshUser = useCallback(async () => {
    const t = await getToken();
    if (!t) {
      setState((s) => ({ ...s, user: null, token: null, loading: false, ready: true }));
      return;
    }
    const { data, error } = await getMe();
    if (error || !data?.user) {
      await clearToken();
      setState((s) => ({ ...s, user: null, token: null, loading: false, ready: true }));
      return;
    }
    setState((s) => ({ ...s, user: data.user, token: t, loading: false, ready: true }));
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const t = await getToken();
      if (!t) {
        if (mounted) setState((s) => ({ ...s, loading: false, ready: true }));
        return;
      }
      const { data, error } = await getMe();
      if (!mounted) return;
      if (error || !data?.user) {
        await clearToken();
        setState((s) => ({ ...s, user: null, token: null, loading: false, ready: true }));
        return;
      }
      setState((s) => ({ ...s, user: data.user, token: t, loading: false, ready: true }));
    })();
    return () => { mounted = false; };
  }, []);

  const signIn = useCallback((token: string, user: User) => {
    setToken(token);
    setState((s) => ({ ...s, token, user, loading: false, ready: true }));
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setState((s) => ({ ...s, user: null, token: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
