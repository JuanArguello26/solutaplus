import { apiRequest } from "@/lib/api-client";
import { buildSearchParams } from "@/lib/query-params";
import type {
  LeadDetail,
  LeadListFilters,
  LeadListResult,
} from "../types/leads";

export function fetchLeads(filters: LeadListFilters): Promise<LeadListResult> {
  const params = buildSearchParams(filters);
  return apiRequest<LeadListResult>(`/api/leads?${params.toString()}`);
}

export function fetchLeadDetail(id: string): Promise<LeadDetail> {
  return apiRequest<LeadDetail>(`/api/leads/${id}`);
}

export function updateLeadStatus(
  id: string,
  input: { newStatus: string; comment?: string },
): Promise<LeadDetail> {
  return apiRequest<LeadDetail>(`/api/leads/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
