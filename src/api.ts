import type { ApiEnvelope, AutomationResult, GpmGroup, GpmProfile, ScriptStep } from "./types";

const STORAGE_KEY = "gpm-console-base-url";

export function getStoredBaseUrl() {
  return localStorage.getItem(STORAGE_KEY) || "http://127.0.0.1:19995";
}

export function setStoredBaseUrl(baseUrl: string) {
  localStorage.setItem(STORAGE_KEY, baseUrl);
}

function unwrapArray<T>(response: ApiEnvelope<T[]> | ApiEnvelope<{ data?: T[]; items?: T[] }> | T[]): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
}

export async function checkHealth(baseUrl: string) {
  return window.gpm.request<ApiEnvelope & { ok?: boolean }>("gpm:health", { baseUrl });
}

export async function getGroups(baseUrl: string) {
  const response = await window.gpm.request<ApiEnvelope<GpmGroup[]>>("gpm:groups", { baseUrl });
  return unwrapArray<GpmGroup>(response);
}

export async function getProfiles(baseUrl: string, filters: Record<string, string | number>) {
  const response = await window.gpm.request<ApiEnvelope<GpmProfile[]>>("gpm:profiles", {
    baseUrl,
    page: 1,
    per_page: 100,
    ...filters
  });
  return unwrapArray<GpmProfile>(response);
}

export async function startProfile(baseUrl: string, id: string | number) {
  return window.gpm.request<ApiEnvelope<GpmProfile>>("gpm:startProfile", { baseUrl, id });
}

export async function closeProfile(baseUrl: string, id: string | number) {
  return window.gpm.request<ApiEnvelope>("gpm:closeProfile", { baseUrl, id });
}

export async function createProfile(baseUrl: string, profile: Record<string, unknown>) {
  return window.gpm.request<ApiEnvelope<GpmProfile>>("gpm:createProfile", { baseUrl, profile });
}

export async function updateProfile(baseUrl: string, id: string | number, patch: Record<string, unknown>) {
  return window.gpm.request<ApiEnvelope<GpmProfile>>("gpm:updateProfile", { baseUrl, id, patch });
}

export async function deleteProfile(baseUrl: string, id: string | number) {
  return window.gpm.request<ApiEnvelope>("gpm:deleteProfile", { baseUrl, id, mode: 1 });
}

export async function runOpenUrlAutomation(
  baseUrl: string,
  profile: GpmProfile,
  options: { targetUrl: string; screenshot: boolean; closeWhenDone: boolean; workflowAction?: string; inspectMode?: boolean; steps?: ScriptStep[] }
) {
  return window.gpm.request<AutomationResult>("automation:openUrl", {
    baseUrl,
    profile,
    ...options
  });
}
