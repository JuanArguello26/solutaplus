import { apiRequest } from "@/lib/api-client";

export interface ServiceDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

export interface PlanDto {
  id: string;
  name: string;
  description: string | null;
  estimatedPrice: number;
  currency: string;
  benefits: string[];
}

export function fetchServices(): Promise<ServiceDto[]> {
  return apiRequest<ServiceDto[]>("/api/services");
}

export function fetchPlansByService(serviceSlug: string): Promise<PlanDto[]> {
  return apiRequest<PlanDto[]>(
    `/api/plans?service=${encodeURIComponent(serviceSlug)}`,
  );
}
