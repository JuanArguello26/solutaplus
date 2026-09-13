import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuotationService } from "@/server/services/QuotationService";
import { ServiceRepository } from "@/server/repositories/ServiceRepository";
import { PlanRepository } from "@/server/repositories/PlanRepository";

vi.mock("@/server/repositories/ServiceRepository");
vi.mock("@/server/repositories/PlanRepository");

describe("QuotationService.getQuotation", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("retorna precio, moneda y beneficios cuando el plan pertenece al servicio", async () => {
    vi.mocked(ServiceRepository.findActiveBySlug).mockResolvedValue({
      id: "srv_1",
      name: "Salud",
      slug: "salud",
    } as never);

    vi.mocked(PlanRepository.findActiveById).mockResolvedValue({
      id: "plan_1",
      serviceId: "srv_1",
      name: "Premium",
      estimatedPrice: 185000,
      currency: "COP",
      benefits: ["Atención personalizada"],
    } as never);

    const result = await QuotationService.getQuotation({
      serviceSlug: "salud",
      planId: "plan_1",
      city: "Pereira",
    });

    expect(result.estimatedPrice).toBe(185000);
    expect(result.currency).toBe("COP");
    expect(result.plan).toEqual({ id: "plan_1", name: "Premium" });
    expect(result.benefits).toEqual(["Atención personalizada"]);
  });

  it("lanza un error cuando el servicio no existe", async () => {
    vi.mocked(ServiceRepository.findActiveBySlug).mockResolvedValue(null);

    await expect(
      QuotationService.getQuotation({
        serviceSlug: "inexistente",
        planId: "plan_1",
        city: "Bogotá",
      }),
    ).rejects.toThrow("El servicio solicitado no existe.");
  });

  it("lanza un error cuando el plan no pertenece al servicio", async () => {
    vi.mocked(ServiceRepository.findActiveBySlug).mockResolvedValue({
      id: "srv_1",
      name: "Salud",
      slug: "salud",
    } as never);

    vi.mocked(PlanRepository.findActiveById).mockResolvedValue({
      id: "plan_2",
      serviceId: "srv_OTRO",
      name: "Básico",
      estimatedPrice: 45000,
      currency: "COP",
      benefits: [],
    } as never);

    await expect(
      QuotationService.getQuotation({
        serviceSlug: "salud",
        planId: "plan_2",
        city: "Bogotá",
      }),
    ).rejects.toThrow("El plan no pertenece al servicio seleccionado.");
  });
});
