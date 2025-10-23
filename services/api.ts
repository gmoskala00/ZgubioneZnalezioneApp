import { authorizedFetch, asJson } from "./http";
import type { FoundItem } from "../models/FoundItem";
import type { UserData } from "../models/auth";

export const Api = {
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

  getMe: () => Api.get<UserData>("/api/users/me"),

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
    if (opts?.q && opts.q.trim()) params.set("q", opts.q.trim());
    if (opts?.categories && opts.categories.length > 0) {
      params.set("categories", opts.categories.join(","));
    }
    return Api.get<{ items: any[] }>(
      `/api/found-items/bbox?${params.toString()}`
    );
  },
  createFoundItem: (payload: any) =>
    Api.post<FoundItem>("/api/found-items", payload),
  updateFoundItem: (id: string, payload: any) =>
    Api.put<FoundItem>(`/api/found-items/${id}`, payload),
  deleteFoundItem: (id: string) =>
    Api.del<{ message: string }>(`/api/found-items/${id}`),
};
