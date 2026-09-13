import { prisma } from "@/lib/prisma";

export const PlanRepository = {
  findActiveByServiceId(serviceId: string) {
    return prisma.plan.findMany({
      where: { serviceId, isActive: true, deletedAt: null },
      orderBy: { displayOrder: "asc" },
    });
  },

  findActiveById(id: string) {
    return prisma.plan.findFirst({
      where: { id, isActive: true, deletedAt: null },
    });
  },
};
