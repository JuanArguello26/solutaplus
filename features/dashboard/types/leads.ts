import type { LeadStatus } from "@/generated/prisma/client";

export interface LeadListItem {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  service: string;
  plan?: string;
  estimatedPrice?: number;
  status: LeadStatus;
  createdAt: string;
}

export interface LeadListResult {
  items: LeadListItem[];
  total: number;
  page: number;
  pageCount: number;
}

export interface LeadStatusHistoryEntry {
  id: string;
  oldStatus: LeadStatus | null;
  newStatus: LeadStatus;
  comment: string | null;
  changedAt: string;
}

export interface LeadDetail {
  id: string;
  fullName: string;
  document: string | null;
  phone: string;
  email: string;
  city: string;
  service: string;
  plan?: string;
  estimatedPrice?: number;
  observations: string | null;
  status: LeadStatus;
  source: string | null;
  createdAt: string;
  statusHistory: LeadStatusHistoryEntry[];
}

export interface LeadListFilters {
  page: number;
  limit: number;
  status?: LeadStatus;
  serviceId?: string;
  city?: string;
  search?: string;
  sortBy: "createdAt" | "fullName" | "status";
  sortDir: "asc" | "desc";
}
