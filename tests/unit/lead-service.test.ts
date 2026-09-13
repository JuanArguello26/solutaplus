import { describe, it, expect, vi, beforeEach } from "vitest";
import { LeadService } from "@/server/services/LeadService";
import { CatalogService } from "@/server/services/CatalogService";
import { LeadRepository } from "@/server/repositories/LeadRepository";

vi.mock("@/server/services/CatalogService");
vi.mock("@/server/repositories/LeadRepository");

const SERVICE = { id: "srv_1", name: "Salud", slug: "salud" };
const PLAN = {
  id: "plan_1",
  serviceId: "srv_1",
  name: "Básico",
  estimatedPrice: 120000,
  currency: "COP",
};

function buildInput(overrides: Record<string, unknown> = {}) {
  return {
    fullName: "Juan Pérez",
    phone: "3001234567",
    email: "juan@example.com",
    city: "Pereira",
    serviceSlug: "salud",
    planId: "plan_1",
    consentAccepted: true,
    website: "",
    ...overrides,
  } as Parameters<typeof LeadService.createLead>[0];
}

/** Devuelve lo que la capa de repositorio entregaría tras insertar. */
function createdLead(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead_1",
    fullName: "Juan Pérez",
    city: "Pereira",
    status: "NEW",
    ...overrides,
  } as never;
}

describe("LeadService.createLead", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(CatalogService.resolveServiceBySlug).mockResolvedValue(
      SERVICE as never,
    );
    vi.mocked(CatalogService.resolvePlanForService).mockResolvedValue(
      PLAN as never,
    );
    vi.mocked(LeadRepository.findRecentDuplicate).mockResolvedValue(null);
    vi.mocked(LeadRepository.createWithInitialStatus).mockResolvedValue(
      createdLead(),
    );
  });

  it("persiste el lead y devuelve el enlace de WhatsApp", async () => {
    const result = await LeadService.createLead(buildInput(), {});

    expect(LeadRepository.createWithInitialStatus).toHaveBeenCalledTimes(1);
    expect(result.lead.id).toBe("lead_1");
    expect(result.whatsappUrl).toContain("https://wa.me/");
    expect(result.whatsappUrl).toContain("Juan%20P%C3%A9rez");
  });

  it("toma el precio del plan en base de datos y nunca del cliente", async () => {
    // El atacante intenta inyectar un precio de 1 peso en el payload.
    await LeadService.createLead(
      buildInput({ estimatedPrice: 1 } as Record<string, unknown>),
      {},
    );

    const persisted = vi.mocked(LeadRepository.createWithInitialStatus).mock
      .calls[0][0];
    expect(persisted.estimatedPrice).toBe(120000);
  });

  it("guarda la fecha del consentimiento cuando el titular lo acepta", async () => {
    await LeadService.createLead(buildInput(), {});

    const persisted = vi.mocked(LeadRepository.createWithInitialStatus).mock
      .calls[0][0];
    expect(persisted.consentAcceptedAt).toBeInstanceOf(Date);
  });

  it("no guarda fecha de consentimiento si no fue aceptado", async () => {
    await LeadService.createLead(buildInput({ consentAccepted: false }), {});

    const persisted = vi.mocked(LeadRepository.createWithInitialStatus).mock
      .calls[0][0];
    expect(persisted.consentAcceptedAt).toBeNull();
  });

  it("registra IP y user agent recibidos del route handler", async () => {
    await LeadService.createLead(buildInput(), {
      ipAddress: "203.0.113.10",
      userAgent: "Mozilla/5.0",
    });

    const persisted = vi.mocked(LeadRepository.createWithInitialStatus).mock
      .calls[0][0];
    expect(persisted.ipAddress).toBe("203.0.113.10");
    expect(persisted.userAgent).toBe("Mozilla/5.0");
  });

  it("rechaza un duplicado reciente sin volver a insertar", async () => {
    vi.mocked(LeadRepository.findRecentDuplicate).mockResolvedValue({
      id: "lead_previo",
    } as never);

    await expect(
      LeadService.createLead(buildInput(), {}),
    ).rejects.toMatchObject({ code: "DUPLICATE_LEAD", status: 409 });
    expect(LeadRepository.createWithInitialStatus).not.toHaveBeenCalled();
  });

  it("busca duplicados por teléfono y servicio antes de insertar", async () => {
    await LeadService.createLead(buildInput(), {});

    expect(LeadRepository.findRecentDuplicate).toHaveBeenCalledWith(
      "3001234567",
      "srv_1",
      30,
    );
  });

  it("propaga el error cuando el servicio solicitado no existe", async () => {
    vi.mocked(CatalogService.resolveServiceBySlug).mockRejectedValue(
      new Error("El servicio solicitado no existe."),
    );

    await expect(LeadService.createLead(buildInput(), {})).rejects.toThrow(
      "El servicio solicitado no existe.",
    );
    expect(LeadRepository.createWithInitialStatus).not.toHaveBeenCalled();
  });

  it("propaga el fallo de base de datos sin dejar el lead a medias", async () => {
    vi.mocked(LeadRepository.createWithInitialStatus).mockRejectedValue(
      new Error("Connection terminated unexpectedly"),
    );

    await expect(LeadService.createLead(buildInput(), {})).rejects.toThrow(
      "Connection terminated unexpectedly",
    );
  });

  it("permite crear el lead sin plan seleccionado", async () => {
    await LeadService.createLead(buildInput({ planId: undefined }), {});

    expect(CatalogService.resolvePlanForService).not.toHaveBeenCalled();
    const persisted = vi.mocked(LeadRepository.createWithInitialStatus).mock
      .calls[0][0];
    expect(persisted.estimatedPrice).toBeNull();
  });
});
