import { describe, it, expect } from "vitest";
import { buildLeadWhatsAppMessage, buildWhatsAppLink } from "@/lib/whatsapp";

describe("buildLeadWhatsAppMessage", () => {
  it("incluye nombre, servicio, plan, ciudad y teléfono", () => {
    const message = buildLeadWhatsAppMessage({
      fullName: "Juan Pérez",
      serviceName: "Salud",
      planName: "Premium",
      estimatedPrice: 185000,
      currency: "COP",
      city: "Pereira",
      phone: "3001234567",
    });

    expect(message).toContain("Juan Pérez");
    expect(message).toContain("Salud");
    expect(message).toContain("Plan: Premium.");
    expect(message).toContain("Pereira");
    expect(message).toContain("3001234567");
  });

  it("omite el valor mientras las tarifas no estén confirmadas", () => {
    // NEXT_PUBLIC_PRICES_CONFIRMED es "false" en este entorno: los precios
    // del catálogo son datos de ejemplo y no deben viajar al usuario.
    const message = buildLeadWhatsAppMessage({
      fullName: "Juan Pérez",
      serviceName: "Salud",
      planName: "Premium",
      estimatedPrice: 185000,
      currency: "COP",
      city: "Pereira",
      phone: "3001234567",
    });

    expect(message).not.toContain("Valor aproximado:");
    expect(message).not.toContain("185.000");
  });

  it("omite la línea de plan y precio cuando no hay plan seleccionado", () => {
    const message = buildLeadWhatsAppMessage({
      fullName: "Ana",
      serviceName: "ARL",
      city: "Bogotá",
      phone: "3009876543",
    });

    expect(message).not.toContain("Plan:");
    expect(message).not.toContain("Valor aproximado:");
  });
});

describe("buildWhatsAppLink", () => {
  it("normaliza el teléfono y codifica el mensaje", () => {
    const link = buildWhatsAppLink("+57 300 123 4567", "Hola mundo");

    expect(link).toBe("https://wa.me/573001234567?text=Hola%20mundo");
  });
});
