const API_BASE = "/api/v1";

function getToken(): string | null {
  return localStorage.getItem("daycast_token");
}

export function setToken(token: string): void {
  localStorage.setItem("daycast_token", token);
}

export function logout(): void {
  localStorage.removeItem("daycast_token");
  localStorage.removeItem("daycast_username");
  window.location.href = "/login";
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getUsername(): string | null {
  return localStorage.getItem("daycast_username");
}

export function setUsername(username: string): void {
  localStorage.setItem("daycast_username", username);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const resp = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (resp.status === 401) {
    logout();
    throw new Error("Session expired");
  }

  if (!resp.ok) {
    const body = await resp.json().catch(() => null);
    throw new Error(body?.error || `HTTP ${resp.status}`);
  }

  if (resp.status === 204) return undefined as T;
  return resp.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

import type { PublishedPostResponse, PublishStatusResponse, GenerationSettingsRequest, GenerationSettingsResponse, ExportResponse } from "../types";

export function publishPost(resultId: string) {
  return api.post<PublishedPostResponse>("/publish", { generation_result_id: resultId });
}

export function unpublishPost(postId: string) {
  return api.delete<void>(`/publish/${postId}`);
}

export function getPublishStatus(resultIds: string[]) {
  return api.get<PublishStatusResponse>(`/publish/status?result_ids=${resultIds.join(",")}`);
}

export function publishInputItem(inputItemId: string) {
  return api.post<PublishedPostResponse>("/publish/input", { input_item_id: inputItemId });
}

export function getInputPublishStatus(inputIds: string[]) {
  return api.get<PublishStatusResponse>(`/publish/input-status?input_ids=${inputIds.join(",")}`);
}

export function getGenerationSettings() {
  return api.get<GenerationSettingsResponse>("/settings/generation");
}

export function saveGenerationSettings(settings: GenerationSettingsRequest) {
  return api.post<GenerationSettingsResponse>("/settings/generation", settings);
}

export function exportDay(date: string, format: string = "plain") {
  return api.get<ExportResponse>(`/inputs/export?date=${date}&format=${format}`);
}
