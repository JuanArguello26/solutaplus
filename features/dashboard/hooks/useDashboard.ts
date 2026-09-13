import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "../services/dashboard-client";
import type { DashboardStats } from "../types/dashboard";

const DASHBOARD_STALE_TIME_MS = 30_000;

export function useDashboard(initialData: DashboardStats) {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardStats,
    initialData,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });
}
