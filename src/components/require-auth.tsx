"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  if (loading) return <div className="p-6 type-small text-muted-foreground">Loading…</div>;
  if (!token) return <div className="p-6 type-small text-muted-foreground">Redirecting…</div>;
  return <>{children}</>;
}