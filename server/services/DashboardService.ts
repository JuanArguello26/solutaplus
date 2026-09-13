import { LeadRepository } from "@/server/repositories/LeadRepository";

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfWeek(): Date {
  const today = startOfToday();
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1; // semana inicia en lunes
  return new Date(today.getTime() - diff * 24 * 60 * 60 * 1000);
}

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export const DashboardService = {
  async getStats() {
    const [total, today, week, month, byStatus, topService, topCity] =
      await Promise.all([
        LeadRepository.countTotal(),
        LeadRepository.countSince(startOfToday()),
        LeadRepository.countSince(startOfWeek()),
        LeadRepository.countSince(startOfMonth()),
        LeadRepository.groupByStatus(),
        LeadRepository.topServiceByCount(),
        LeadRepository.topCityByCount(),
      ]);

    return { total, today, week, month, byStatus, topService, topCity };
  },
};
