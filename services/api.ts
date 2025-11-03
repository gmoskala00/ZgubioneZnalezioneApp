import { authorizedFetch, asJson } from "./http";
import type { FoundItem } from "../models/FoundItem";
import type {
  UserData,
  LoginCredentials,
  AuthCredentials,
} from "../models/auth";

export const Api = {
  // ======== AUTH ========
  login: async (credentials: LoginCredentials) =>
    authorizedFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: { "Content-Type": "application/json" },
    })
      .then(asJson<{ user: UserData; token: string }>)
      .catch((err) => {
        throw new Error(err.message || "Błąd logowania");
      }),

  register: async (credentials: AuthCredentials) =>
    authorizedFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
      headers: { "Content-Type": "application/json" },
    })
      .then(asJson<{ user: UserData; token: string }>)
      .catch((err) => {
        throw new Error(err.message || "Błąd rejestracji");
      }),

  getMe: () => Api.get<UserData>("/api/users/me"),
  updateMe: (payload: Partial<UserData>) =>
    Api.patch<UserData>("/api/users/me", payload),

  // ======== FOUND ITEMS ========
  listFoundItems: () => Api.get<FoundItem[]>("/api/found-items"),

  listFoundItemsBBox: (
    n: number,
    e: number,
    s: number,
    w: number,
    limit = 300,
    opts?: { q?: string; categories?: string[] }
  ) => {
    const params = new URLSearchParams({
      n: String(n),
      e: String(e),
      s: String(s),
      w: String(w),
      limit: String(limit),
    });

    if (opts?.q?.trim()) params.set("q", opts.q.trim());
    if (opts?.categories?.length)
      params.set("categories", opts.categories.join(","));

    return Api.get<{ items: FoundItem[] }>(
      `/api/found-items/bbox?${params.toString()}`
    );
  },

  createFoundItem: (payload: any) =>
    Api.post<FoundItem>("/api/found-items", payload),

  updateFoundItem: (id: string, payload: any) =>
    Api.put<FoundItem>(`/api/found-items/${id}`, payload),

  deleteFoundItem: (id: string) =>
    Api.del<{ message: string }>(`/api/found-items/${id}`),

  // ======== CLAIMS ========:
  sendClaim: (
    itemId: string,
    payload: { answers: [string, string]; message?: string }
  ) => Api.post(`/api/claims/${itemId}`, payload),

  markClaimSeen: (id: string, role: "owner" | "responder") =>
    Api.patch(`/api/claims/${id}/seen?role=${role}`),

  unreadCount: (mode: "mine" | "responses") =>
    Api.get<{ count: number }>(`/api/claims/unread-count?mode=${mode}`),

  // ======== OGÓLNE METODY ========
  get: <T = any>(path: string) => authorizedFetch(path).then(asJson<T>),

  post: <T = any>(path: string, body?: any) =>
    authorizedFetch(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }).then(asJson<T>),

  put: <T = any>(path: string, body?: any) =>
    authorizedFetch(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }).then(asJson<T>),

  del: <T = any>(path: string) =>
    authorizedFetch(path, { method: "DELETE" }).then(asJson<T>),

  patch: <T = any>(path: string, body?: any) =>
    authorizedFetch(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }).then(asJson<T>),
};
