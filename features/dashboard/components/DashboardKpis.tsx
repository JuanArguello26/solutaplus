"use client";

import { KpiCard } from "@/components/shared/KpiCard";
import { useDashboard } from "../hooks/useDashboard";
import type { DashboardStats } from "../types/dashboard";

interface DashboardKpisProps {
  initialData: DashboardStats;
}

export function DashboardKpis({ initialData }: DashboardKpisProps) {
  const { data } = useDashboard(initialData);

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <KpiCard label="Total leads" value={data.total} />
      <KpiCard label="Hoy" value={data.today} />
      <KpiCard label="Esta semana" value={data.week} />
      <KpiCard label="Este mes" value={data.month} />
      <KpiCard label="Servicio top" value={data.topService?.name ?? "—"} />
      <KpiCard label="Ciudad top" value={data.topCity?.city ?? "—"} />
    </div>
  );
}
