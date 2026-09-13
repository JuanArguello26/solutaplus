import { apiPost } from "@/lib/api-client";
import type { LeadFormValues } from "@/features/leads/schemas/lead-form.schema";

export interface SubmitLeadInput extends LeadFormValues {
  serviceSlug: string;
  planId?: string;
  city: string;
  source?: string;
}

export interface CreateLeadResultDto {
  lead: {
    id: string;
    fullName: string;
    service: string;
    plan?: string;
    estimatedPrice?: number;
    city: string;
    status: string;
  };
  whatsappUrl: string;
}

export function submitLead(
  input: SubmitLeadInput,
): Promise<CreateLeadResultDto> {
  return apiPost<CreateLeadResultDto>("/api/leads", input);
}
