import { ServiceRepository } from "@/server/repositories/ServiceRepository";
import { PlanRepository } from "@/server/repositories/PlanRepository";
import { notFoundError, validationError } from "@/server/errors/AppError";

export const CatalogService = {
  async listServices() {
    const services = await ServiceRepository.findAllActive();
    return services.map((service) => ({
      id: service.id,
      name: service.name,
      slug: service.slug,
      description: service.description,
      icon: service.icon,
    }));
  },

  async listPlansByServiceSlug(slug: string) {
    const service = await CatalogService.resolveServiceBySlug(slug);
    const plans = await PlanRepository.findActiveByServiceId(service.id);
    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      estimatedPrice: Number(plan.estimatedPrice),
      currency: plan.currency,
      benefits: plan.benefits,
    }));
  },

  /**
   * Resuelve un servicio activo por su slug o lanza NotFound.
   * Uso interno de otros servicios (Quotation, Lead) - devuelve la
   * entidad de Prisma, no un DTO de API.
   */
  async resolveServiceBySlug(slug: string) {
    const service = await ServiceRepository.findActiveBySlug(slug);
    if (!service) {
      throw notFoundError("El servicio solicitado no existe.");
    }
    return service;
  },

  /**
   * Resuelve un plan activo que pertenezca al servicio indicado o
   * lanza un error de validación. Uso interno de otros servicios.
   */
  async resolvePlanForService(planId: string, serviceId: string) {
    const plan = await PlanRepository.findActiveById(planId);
    if (!plan || plan.serviceId !== serviceId) {
      throw validationError("El plan no pertenece al servicio seleccionado.");
    }
    return plan;
  },
};
