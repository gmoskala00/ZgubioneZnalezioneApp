// services/http.ts
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

export async function asJson<T = any>(res: Response): Promise<T> {
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}
