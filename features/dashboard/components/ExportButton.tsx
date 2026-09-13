import { Download } from "lucide-react";
import { buildSearchParams } from "@/lib/query-params";
import type { LeadListFilters } from "../types/leads";

interface ExportButtonProps {
  filters: LeadListFilters;
  format: "csv" | "xlsx";
  label: string;
}

export function ExportButton({ filters, format, label }: ExportButtonProps) {
  const params = buildSearchParams(filters, ["page", "limit"]);

  return (
    <a
      href={`/api/leads/export/${format}?${params.toString()}`}
      className="focus-visible:ring-primary flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}
