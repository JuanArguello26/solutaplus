import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLeads } from "../services/leads-admin-client";
import type { LeadListFilters, LeadListResult } from "../types/leads";

const LEADS_STALE_TIME_MS = 15_000;

// initialData viene del fetch hecho en el Server Component con los
// filtros por defecto (pagina 1, sin filtros). Solo debe usarse para
// sembrar esa consulta exacta: si se aplicara a cualquier combinacion
// de filtros, cambiar de pagina mostraria brevemente los datos de la
// pagina 1 antes del refetch real.
export function useLeads(
  filters: LeadListFilters,
  initialData?: LeadListResult,
) {
  const initialFiltersRef = useRef(filters);
  const isInitialFilters =
    JSON.stringify(filters) === JSON.stringify(initialFiltersRef.current);

  return useQuery({
    queryKey: ["leads", filters],
    queryFn: () => fetchLeads(filters),
    initialData: isInitialFilters ? initialData : undefined,
    staleTime: LEADS_STALE_TIME_MS,
    placeholderData: (previous) => previous,
  });
}
