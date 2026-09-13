"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { BadgeTone } from "@/components/ui/Badge";
import { LEAD_STATUS_META } from "@/constants/lead-status";
import { useDashboard } from "../hooks/useDashboard";
import type { DashboardStats } from "../types/dashboard";

const TONE_HEX: Record<BadgeTone, string> = {
  gray: "#9ca3af",
  blue: "#3b82f6",
  yellow: "#eab308",
  green: "#22c55e",
  red: "#ef4444",
  purple: "#a855f7",
};

interface LeadsChartProps {
  initialData: DashboardStats;
}

export function LeadsChart({ initialData }: LeadsChartProps) {
  const { data } = useDashboard(initialData);

  const chartData = data.byStatus.map((entry) => ({
    name: LEAD_STATUS_META[entry.status].label,
    value: entry.count,
    color: TONE_HEX[LEAD_STATUS_META[entry.status].tone],
  }));

  const chartSummary = chartData
    .map((entry) => `${entry.name}: ${entry.value}`)
    .join(", ");

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Distribución por estado
      </h2>
      <div
        role="img"
        aria-label={`Gráfica de barras de leads por estado. ${chartSummary || "Sin datos."}`}
        className="h-72 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={50}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
