"use client";

import { useRouter } from "next/navigation";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { LEAD_STATUS_META } from "@/constants/lead-status";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import type { LeadListFilters, LeadListItem } from "../types/leads";

interface LeadsTableProps {
  leads: LeadListItem[];
  sortBy: LeadListFilters["sortBy"];
  sortDir: LeadListFilters["sortDir"];
  onSort: (key: LeadListFilters["sortBy"]) => void;
}

export function LeadsTable({ leads, sortBy, sortDir, onSort }: LeadsTableProps) {
  const router = useRouter();

  const columns: TableColumn<LeadListItem>[] = [
    {
      key: "fullName",
      header: "Nombre",
      sortable: true,
      render: (lead) => (
        <div>
          <p className="font-medium">{lead.fullName}</p>
          <p className="text-xs text-gray-500">{lead.phone}</p>
        </div>
      ),
    },
    { key: "service", header: "Servicio", render: (lead) => lead.service },
    { key: "city", header: "Ciudad", render: (lead) => lead.city },
    {
      key: "estimatedPrice",
      header: "Precio est.",
      render: (lead) =>
        lead.estimatedPrice ? formatCurrency(lead.estimatedPrice) : "—",
    },
    {
      key: "status",
      header: "Estado",
      sortable: true,
      render: (lead) => (
        <Badge tone={LEAD_STATUS_META[lead.status].tone}>
          {LEAD_STATUS_META[lead.status].label}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Fecha",
      sortable: true,
      render: (lead) => formatDate(lead.createdAt),
    },
  ];

  return (
    <Table
      columns={columns}
      data={leads}
      getRowKey={(lead) => lead.id}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={(key) => onSort(key as LeadListFilters["sortBy"])}
      onRowClick={(lead) => router.push(`/admin/leads/${lead.id}`)}
      emptyMessage="No hay leads que coincidan con los filtros."
    />
  );
}
