import { CatalogService } from "@/server/services/CatalogService";
import type { QuotationInput } from "@/server/validators/quotation.schema";

export const QuotationService = {
  async getQuotation({ serviceSlug, planId }: QuotationInput) {
    const service = await CatalogService.resolveServiceBySlug(serviceSlug);
    const plan = await CatalogService.resolvePlanForService(planId, service.id);

    return {
      estimatedPrice: Number(plan.estimatedPrice),
      currency: plan.currency,
      plan: { id: plan.id, name: plan.name },
      service: { id: service.id, name: service.name },
      benefits: plan.benefits,
    };
  },
};
