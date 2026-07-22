// src/lib/api.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tt_token");
}

export function setToken(token: string) {
  localStorage.setItem("tt_token", token);
}

export function clearToken() {
  localStorage.removeItem("tt_token");
}

type FetchOpts = Omit<RequestInit, "body"> & {
  auth?: boolean;
  body?: any;
};

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(opts.headers || {});
  headers.set("Accept", "application/json");

if (opts.auth) {
  const token = getToken();

  if (!token) {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
  return Promise.reject(new Error("NO_TOKEN"));
}

  headers.set("Authorization", `Bearer ${token}`);
}
  // If body is plain object, auto JSON it
  let body = opts.body;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
    if (!headers.get("Content-Type")) headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const res = await fetch(url, { ...opts, headers, body, cache: "no-store" });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    // Only logout when an authenticated API call fails
    if (res.status === 401 && opts.auth) {
      clearToken();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      throw new Error("Session expired");
    }

    const msg = data?.detail || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}
