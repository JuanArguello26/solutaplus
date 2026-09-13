import type { Prisma, LeadStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { LeadQueryInput } from "@/server/validators/lead-query.schema";

interface CreateLeadData {
  fullName: string;
  document?: string;
  phone: string;
  email: string;
  city: string;
  serviceId: string;
  planId?: string;
  estimatedPrice?: number | null;
  observations?: string;
  source?: string;
  ipAddress?: string;
  userAgent?: string;
  consentAcceptedAt?: Date | null;
}

export const LeadRepository = {
  findRecentDuplicate(phone: string, serviceId: string, withinMinutes: number) {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);
    return prisma.lead.findFirst({
      where: { phone, serviceId, deletedAt: null, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
    });
  },

  createWithInitialStatus(data: CreateLeadData) {
    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          fullName: data.fullName,
          document: data.document || null,
          phone: data.phone,
          email: data.email,
          city: data.city,
          serviceId: data.serviceId,
          planId: data.planId ?? null,
          estimatedPrice: data.estimatedPrice ?? null,
          observations: data.observations || null,
          source: data.source ?? null,
          ipAddress: data.ipAddress ?? null,
          userAgent: data.userAgent ?? null,
          consentAcceptedAt: data.consentAcceptedAt ?? null,
          status: "NEW",
        },
      });

      await tx.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          oldStatus: null,
          newStatus: "NEW",
        },
      });

      return lead;
    });
  },

  countTotal() {
    return prisma.lead.count({ where: { deletedAt: null } });
  },

  countSince(since: Date) {
    return prisma.lead.count({
      where: { deletedAt: null, createdAt: { gte: since } },
    });
  },

  async groupByStatus() {
    const groups = await prisma.lead.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true,
    });
    return groups.map((group) => ({
      status: group.status,
      count: group._count,
    }));
  },

  async topServiceByCount() {
    const [top] = await prisma.lead.groupBy({
      by: ["serviceId"],
      where: { deletedAt: null },
      _count: true,
      orderBy: { _count: { serviceId: "desc" } },
      take: 1,
    });
    if (!top) return null;

    const service = await prisma.service.findUnique({
      where: { id: top.serviceId },
      select: { name: true },
    });
    return { name: service?.name ?? "—", count: top._count };
  },

  async topCityByCount() {
    const [top] = await prisma.lead.groupBy({
      by: ["city"],
      where: { deletedAt: null },
      _count: true,
      orderBy: { _count: { city: "desc" } },
      take: 1,
    });
    if (!top) return null;
    return { city: top.city, count: top._count };
  },

  buildFilterWhere(
    filters: Pick<LeadQueryInput, "status" | "serviceId" | "city" | "search">,
  ): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = { deletedAt: null };

    if (filters.status) where.status = filters.status;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.city) where.city = { equals: filters.city, mode: "insensitive" };
    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  },

  findMany(query: LeadQueryInput) {
    const where = LeadRepository.buildFilterWhere(query);
    return prisma.lead.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { service: { select: { name: true } }, plan: { select: { name: true } } },
    });
  },

  count(
    filters: Pick<LeadQueryInput, "status" | "serviceId" | "city" | "search">,
  ) {
    return prisma.lead.count({ where: LeadRepository.buildFilterWhere(filters) });
  },

  findAllForExport(
    filters: Pick<
      LeadQueryInput,
      "status" | "serviceId" | "city" | "search" | "sortBy" | "sortDir"
    >,
  ) {
    return prisma.lead.findMany({
      where: LeadRepository.buildFilterWhere(filters),
      orderBy: { [filters.sortBy]: filters.sortDir },
      include: { service: { select: { name: true } }, plan: { select: { name: true } } },
    });
  },

  findByIdWithHistory(id: string) {
    return prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        service: { select: { name: true } },
        plan: { select: { name: true } },
        statusHistory: { orderBy: { changedAt: "desc" } },
      },
    });
  },

  updateStatus(id: string, newStatus: LeadStatus, comment: string | undefined) {
    return prisma.$transaction(async (tx) => {
      const lead = await tx.lead.findFirst({ where: { id, deletedAt: null } });
      if (!lead) return null;

      const updated = await tx.lead.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.leadStatusHistory.create({
        data: {
          leadId: id,
          oldStatus: lead.status,
          newStatus,
          comment: comment || null,
        },
      });

      return updated;
    });
  },
};
