import { useQuery } from "@tanstack/react-query";
import { fetchLeadDetail } from "../services/leads-admin-client";
import type { LeadDetail } from "../types/leads";

export function useLeadDetail(id: string, initialData: LeadDetail) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => fetchLeadDetail(id),
    initialData,
  });
}
