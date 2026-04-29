import type { ApiEnvelope, AutomationResult, GpmGroup, GpmProfile, ScriptStep } from "./types";

const STORAGE_KEY = "gpm-console-base-url";

export function getStoredBaseUrl() {
  return localStorage.getItem(STORAGE_KEY) || "http://127.0.0.1:19995";
}

export function setStoredBaseUrl(baseUrl: string) {
  localStorage.setItem(STORAGE_KEY, baseUrl);
}

const PROFILE_PAGE_SIZE = 1000;
const PROFILE_FETCH_CONCURRENCY = 4;

type PaginatedEnvelope<T> = ApiEnvelope<T[]> & {
  pagination?: {
    total?: number;
    page?: number;
    page_size?: number;
    total_page?: number;
  };
};

function unwrapArray<T>(response: ApiEnvelope<T[]> | ApiEnvelope<{ data?: T[]; items?: T[] }> | T[]): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  return [];
}

function pageCount(response: PaginatedEnvelope<unknown>) {
  const totalPage = Number(response.pagination?.total_page);
  if (Number.isFinite(totalPage) && totalPage > 0) return Math.floor(totalPage);

  const total = Number(response.pagination?.total);
  const pageSize = Number(response.pagination?.page_size || PROFILE_PAGE_SIZE);
  if (Number.isFinite(total) && Number.isFinite(pageSize) && total > pageSize && pageSize > 0) {
    return Math.ceil(total / pageSize);
  }

  return 1;
}

export async function checkHealth(baseUrl: string) {
  return window.gpm.request<ApiEnvelope & { ok?: boolean }>("gpm:health", { baseUrl });
}

export async function getGroups(baseUrl: string) {
  const response = await window.gpm.request<ApiEnvelope<GpmGroup[]>>("gpm:groups", { baseUrl });
  return unwrapArray<GpmGroup>(response);
}

export async function getProfiles(baseUrl: string, filters: Record<string, string | number>) {
  const { page: _page, per_page: _perPage, ...requestFilters } = filters;
  const firstPage = await window.gpm.request<PaginatedEnvelope<GpmProfile>>("gpm:profiles", {
    baseUrl,
    page: 1,
    per_page: PROFILE_PAGE_SIZE,
    ...requestFilters
  });

  const totalPages = pageCount(firstPage);
  if (totalPages <= 1) return unwrapArray<GpmProfile>(firstPage);

  const remainingPages: PaginatedEnvelope<GpmProfile>[] = [];
  const pages = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
  for (let offset = 0; offset < pages.length; offset += PROFILE_FETCH_CONCURRENCY) {
    const batch = pages.slice(offset, offset + PROFILE_FETCH_CONCURRENCY);
    const responses = await Promise.all(
      batch.map((page) =>
        window.gpm.request<PaginatedEnvelope<GpmProfile>>("gpm:profiles", {
          baseUrl,
          page,
          per_page: PROFILE_PAGE_SIZE,
          ...requestFilters
        })
      )
    );
    remainingPages.push(...responses);
  }

  return [firstPage, ...remainingPages].flatMap((response) => unwrapArray<GpmProfile>(response));
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
