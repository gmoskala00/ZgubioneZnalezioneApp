import { API_URL } from "../constants/api";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const setOnUnauthorized = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

export async function authorizedFetch(path: string, init: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const res = await fetch(url, { ...init, headers });

  if (res.status === 401) {
    onUnauthorized?.();
    throw new Error("Unauthorized");
  }
  return res;
}

export async function asJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {}

  if (!res.ok) {
    const msg = data?.message || text.slice(0, 160) || "Request failed";
    throw new Error(msg);
  }
  return data as T;
}
