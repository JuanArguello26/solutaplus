import type { LeadStatus } from "@/generated/prisma/client";

export interface DashboardStats {
  total: number;
  today: number;
  week: number;
  month: number;
  byStatus: { status: LeadStatus; count: number }[];
  topService: { name: string; count: number } | null;
  topCity: { city: string; count: number } | null;
}
