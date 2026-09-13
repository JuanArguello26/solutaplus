"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LeadsFilters } from "./LeadsFilters";
import { LeadsTable } from "./LeadsTable";
import { ExportButton } from "./ExportButton";
import { Pagination } from "@/components/ui/Pagination";
import { buildSearchParams } from "@/lib/query-params";
import { useLeads } from "../hooks/useLeads";
import type { LeadListFilters, LeadListResult } from "../types/leads";

interface ServiceOption {
  id: string;
  name: string;
}

interface LeadsManagerProps {
  initialFilters: LeadListFilters;
  initialData: LeadListResult;
  services: ServiceOption[];
}

export function LeadsManager({
  initialFilters,
  initialData,
  services,
}: LeadsManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: LeadListFilters = {
    ...initialFilters,
    page: Number(searchParams.get("page") ?? initialFilters.page),
    status: (searchParams.get("status") as LeadListFilters["status"]) || undefined,
    serviceId: searchParams.get("serviceId") || undefined,
    city: searchParams.get("city") || undefined,
    search: searchParams.get("search") || undefined,
    sortBy:
      (searchParams.get("sortBy") as LeadListFilters["sortBy"]) ||
      initialFilters.sortBy,
    sortDir:
      (searchParams.get("sortDir") as LeadListFilters["sortDir"]) ||
      initialFilters.sortDir,
  };

  const { data } = useLeads(filters, initialData);

  function updateFilters(partial: Partial<LeadListFilters>) {
    const next = { ...filters, ...partial };
    const params = buildSearchParams(next);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSort(key: LeadListFilters["sortBy"]) {
    if (filters.sortBy === key) {
      updateFilters({ sortDir: filters.sortDir === "asc" ? "desc" : "asc" });
    } else {
      updateFilters({ sortBy: key, sortDir: "desc" });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <LeadsFilters filters={filters} services={services} onChange={updateFilters} />

      <div className="flex justify-end gap-2">
        <ExportButton filters={filters} format="csv" label="Exportar CSV" />
        <ExportButton filters={filters} format="xlsx" label="Exportar Excel" />
      </div>

      <LeadsTable
        leads={data?.items ?? []}
        sortBy={filters.sortBy}
        sortDir={filters.sortDir}
        onSort={handleSort}
      />

      <Pagination
        page={data?.page ?? filters.page}
        pageCount={data?.pageCount ?? 1}
        onPageChange={(page) => updateFilters({ page })}
      />
    </div>
  );
}
