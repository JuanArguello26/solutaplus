import type { LeadStatus } from "@/generated/prisma/client";
import type { BadgeTone } from "@/components/ui/Badge";

interface LeadStatusMeta {
  label: string;
  tone: BadgeTone;
}

export const LEAD_STATUS_META: Record<LeadStatus, LeadStatusMeta> = {
  NEW: { label: "Nuevo", tone: "blue" },
  IN_PROGRESS: { label: "En proceso", tone: "purple" },
  CONTACTED: { label: "Contactado", tone: "yellow" },
  PENDING: { label: "Pendiente", tone: "gray" },
  AFFILIATED: { label: "Afiliado", tone: "green" },
  NOT_INTERESTED: { label: "No interesado", tone: "red" },
  CANCELLED: { label: "Cancelado", tone: "red" },
};

export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = (
  Object.keys(LEAD_STATUS_META) as LeadStatus[]
).map((status) => ({ value: status, label: LEAD_STATUS_META[status].label }));
