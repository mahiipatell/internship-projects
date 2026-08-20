// Minimal fetch-based API client. Access token lives in memory; refresh uses
// the httpOnly cookie automatically sent by the browser. On a 401 to a
// non-auth route we attempt one silent refresh, then retry.

export type ApiUser = {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
};

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let accessToken: string | null = null;
type RefreshFn = () => Promise<{ accessToken: string; user: ApiUser } | null>;
let refreshFn: RefreshFn | null = null;

// Relative "/api" works behind the Vite dev proxy and same-origin prod.
// Set VITE_API_URL to an absolute URL when the client is hosted separately.
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function registerRefresh(fn: RefreshFn) {
  refreshFn = fn;
}

async function request<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (res.status === 401 && !retried && !path.startsWith("/auth/") && refreshFn) {
    const refreshed = await refreshFn();
    if (refreshed) return request<T>(method, path, body, true);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.code ?? "ERROR",
      data?.error?.message ?? "Request failed",
      data?.error?.details,
    );
  }
  return data as T;
}

export const api = {
  get: <T = unknown>(path: string) => request<T>("GET", path),
  post: <T = unknown>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T = unknown>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  del: <T = unknown>(path: string) => request<T>("DELETE", path),
};

// Fetches a binary response (e.g. a generated PDF report) and triggers a
// browser download. Reuses the same auth + silent-refresh behaviour as request().
export async function download(path: string, filename: string, retried = false): Promise<void> {
  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !retried && refreshFn) {
    const refreshed = await refreshFn();
    if (refreshed) return download(path, filename, true);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      data?.error?.code ?? "ERROR",
      data?.error?.message ?? "Download failed",
      data?.error?.details,
    );
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
