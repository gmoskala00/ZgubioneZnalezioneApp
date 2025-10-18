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
  createFoundItem: (payload: any) =>
    Api.post<FoundItem>("/api/found-items", payload),
  updateFoundItem: (id: string, payload: any) =>
    Api.put<FoundItem>(`/api/found-items/${id}`, payload),
  deleteFoundItem: (id: string) =>
    Api.del<{ message: string }>(`/api/found-items/${id}`),
};
