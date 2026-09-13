import { apiRequest } from "@/lib/api-client";
import type { DashboardStats } from "../types/dashboard";

export function fetchDashboardStats(): Promise<DashboardStats> {
  return apiRequest<DashboardStats>("/api/dashboard");
}
