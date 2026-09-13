"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LEAD_STATUS_META } from "@/constants/lead-status";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/date";
import { useLeadDetail } from "../hooks/useLeadDetail";
import { LeadStatusForm } from "./LeadStatusForm";
import { LeadStatusTimeline } from "./LeadStatusTimeline";
import type { LeadDetail } from "../types/leads";

interface LeadDetailViewProps {
  leadId: string;
  initialData: LeadDetail;
}

export function LeadDetailView({ leadId, initialData }: LeadDetailViewProps) {
  const { data: lead } = useLeadDetail(leadId, initialData);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/leads"
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a leads
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{lead.fullName}</h1>
              <p className="text-sm text-gray-500">
                {lead.service}
                {lead.plan ? ` · ${lead.plan}` : ""}
              </p>
            </div>
            <Badge tone={LEAD_STATUS_META[lead.status].tone}>
              {LEAD_STATUS_META[lead.status].label}
            </Badge>
          </div>

          <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500">Teléfono</dt>
              <dd className="text-sm text-gray-900">{lead.phone}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Correo</dt>
              <dd className="text-sm text-gray-900">{lead.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Ciudad</dt>
              <dd className="text-sm text-gray-900">{lead.city}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Documento</dt>
              <dd className="text-sm text-gray-900">{lead.document ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">
                Precio estimado
              </dt>
              <dd className="text-sm text-gray-900">
                {lead.estimatedPrice ? formatCurrency(lead.estimatedPrice) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Origen</dt>
              <dd className="text-sm text-gray-900">{lead.source ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">Creado</dt>
              <dd className="text-sm text-gray-900">
                {formatDateTime(lead.createdAt)}
              </dd>
            </div>
            {lead.observations && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-gray-500">
                  Observaciones
                </dt>
                <dd className="mt-1 text-sm text-gray-700">
                  {lead.observations}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Cambiar estado
          </h2>
          <LeadStatusForm leadId={lead.id} currentStatus={lead.status} />
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Historial de estados
        </h2>
        <LeadStatusTimeline history={lead.statusHistory} />
      </Card>
    </div>
  );
}
