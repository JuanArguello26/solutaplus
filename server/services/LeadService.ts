import { CatalogService } from "@/server/services/CatalogService";
import { LeadRepository } from "@/server/repositories/LeadRepository";
import { conflictError, notFoundError } from "@/server/errors/AppError";
import { buildLeadWhatsAppMessage, buildWhatsAppLink } from "@/lib/whatsapp";
import { publicEnv } from "@/lib/public-env";
import type { CreateLeadInput } from "@/server/validators/lead.schema";
import type { LeadQueryInput } from "@/server/validators/lead-query.schema";
import type { LeadStatusUpdateInput } from "@/server/validators/lead-status-update.schema";

interface CreateLeadContext {
  ipAddress?: string;
  userAgent?: string;
}

const DUPLICATE_WINDOW_MINUTES = 30;

export const LeadService = {
  async createLead(input: CreateLeadInput, context: CreateLeadContext) {
    const service = await CatalogService.resolveServiceBySlug(
      input.serviceSlug,
    );

    const plan = input.planId
      ? await CatalogService.resolvePlanForService(input.planId, service.id)
      : null;

    // Nota: esta verificación no es atómica con la creación de abajo.
    // Dos envíos casi simultáneos (doble clic) podrían pasar ambos esta
    // comprobación antes de que cualquiera confirme su escritura, creando
    // 2 leads. Evitarlo requeriría locking a nivel de base de datos; se
    // acepta como limitación conocida (SRS lo pide como "recomendado",
    // no como invariante estricta) en vez de añadir esa complejidad.
    const duplicate = await LeadRepository.findRecentDuplicate(
      input.phone,
      service.id,
      DUPLICATE_WINDOW_MINUTES,
    );
    if (duplicate) {
      throw conflictError(
        "Ya recibimos tu solicitud. Un asesor se pondrá en contacto contigo pronto.",
        "DUPLICATE_LEAD",
      );
    }

    const estimatedPrice = plan ? Number(plan.estimatedPrice) : null;

    const lead = await LeadRepository.createWithInitialStatus({
      fullName: input.fullName,
      document: input.document,
      phone: input.phone,
      email: input.email,
      city: input.city,
      serviceId: service.id,
      planId: plan?.id,
      estimatedPrice,
      observations: input.observations,
      source: input.source ?? "Directo",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      consentAcceptedAt: input.consentAccepted ? new Date() : null,
    });

    const message = buildLeadWhatsAppMessage({
      fullName: input.fullName,
      serviceName: service.name,
      planName: plan?.name,
      estimatedPrice: estimatedPrice ?? undefined,
      currency: plan?.currency,
      city: input.city,
      phone: input.phone,
    });
    const whatsappUrl = buildWhatsAppLink(
      publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
      message,
    );

    return {
      lead: {
        id: lead.id,
        fullName: lead.fullName,
        service: service.name,
        plan: plan?.name,
        estimatedPrice: estimatedPrice ?? undefined,
        city: lead.city,
        status: lead.status,
      },
      whatsappUrl,
    };
  },

  async listLeads(query: LeadQueryInput) {
    const [leads, total] = await Promise.all([
      LeadRepository.findMany(query),
      LeadRepository.count(query),
    ]);

    return {
      items: leads.map((lead) => ({
        id: lead.id,
        fullName: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        service: lead.service.name,
        plan: lead.plan?.name,
        estimatedPrice: lead.estimatedPrice ? Number(lead.estimatedPrice) : undefined,
        status: lead.status,
        createdAt: lead.createdAt.toISOString(),
      })),
      total,
      page: query.page,
      pageCount: Math.max(1, Math.ceil(total / query.limit)),
    };
  },

  async getLeadDetail(id: string) {
    const lead = await LeadRepository.findByIdWithHistory(id);
    if (!lead) {
      throw notFoundError("El lead solicitado no existe.");
    }

    return {
      id: lead.id,
      fullName: lead.fullName,
      document: lead.document,
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      service: lead.service.name,
      plan: lead.plan?.name,
      estimatedPrice: lead.estimatedPrice ? Number(lead.estimatedPrice) : undefined,
      observations: lead.observations,
      status: lead.status,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
      statusHistory: lead.statusHistory.map((entry) => ({
        id: entry.id,
        oldStatus: entry.oldStatus,
        newStatus: entry.newStatus,
        comment: entry.comment,
        changedAt: entry.changedAt.toISOString(),
      })),
    };
  },

  async changeLeadStatus(id: string, input: LeadStatusUpdateInput) {
    const updated = await LeadRepository.updateStatus(
      id,
      input.newStatus,
      input.comment,
    );
    if (!updated) {
      throw notFoundError("El lead solicitado no existe.");
    }
    return LeadService.getLeadDetail(id);
  },
};
