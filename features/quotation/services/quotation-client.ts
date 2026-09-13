import { apiPost } from "@/lib/api-client";
import type { QuotationInput } from "@/server/validators/quotation.schema";

export interface QuotationResultDto {
  estimatedPrice: number;
  currency: string;
  plan: { id: string; name: string };
  service: { id: string; name: string };
  benefits: string[];
}

export function requestQuotation(
  input: QuotationInput,
): Promise<QuotationResultDto> {
  return apiPost<QuotationResultDto>("/api/quotation", input);
}
