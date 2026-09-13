import { prisma } from "@/lib/prisma";

export const ServiceRepository = {
  findAllActive() {
    return prisma.service.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { displayOrder: "asc" },
    });
  },

  findActiveBySlug(slug: string) {
    return prisma.service.findFirst({
      where: { slug, isActive: true, deletedAt: null },
    });
  },
};
