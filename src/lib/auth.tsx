// src/lib/auth.tsx
"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch, clearToken, getToken, setToken } from "@/lib/api";

type User = { id: number; email: string; role: string; tenant_id: string; avatar_url?: string | null };
type Tenant = { id: string; name: string; booking_enabled?: boolean };
type AuthMe = { user: User; tenant: Tenant };
type AuthCtx = {
  token: string | null;
  me: AuthMe | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokState] = useState<string | null>(null);
  const [me, setMe] = useState<AuthMe | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    const t = getToken();
    if (!t) { setMe(null); setTokState(null); return; }
    setTokState(t);
    const data = await apiFetch<AuthMe>("/admin/auth/me", { auth: true });
    setMe(data);
  }

  async function login(email: string, password: string) {
    const resp = await apiFetch<{ access_token: string }>("/admin/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(resp.access_token);
    setTokState(resp.access_token);
    await refreshMe();
  }

  function logout() {
    clearToken();
    setTokState(null);
    setMe(null);
    window.location.replace("/login");
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } catch {
        clearToken();
        setTokState(null);
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ token, me, loading, login, logout, refreshMe }),
    [token, me, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
