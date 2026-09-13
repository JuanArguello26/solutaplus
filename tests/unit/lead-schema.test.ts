import { describe, it, expect } from "vitest";
import { leadBaseSchema } from "@/server/validators/lead.schema";
import { handleError } from "@/lib/api-response";

function parse(overrides: Record<string, unknown>) {
  return leadBaseSchema.safeParse({
    fullName: "Juan Pérez",
    phone: "3001234567",
    email: "juan@example.com",
    city: "Pereira",
    serviceSlug: "salud",
    consentAccepted: true,
    ...overrides,
  });
}

describe("leadBaseSchema — texto obligatorio tras saneamiento", () => {
  // Regresión: `.min(1)` corría sobre el valor crudo, así que "   " pasaba
  // la validación y `sanitizeText` lo dejaba luego en "", guardando leads
  // sin nombre ni ciudad.
  it.each([
    ["cadena vacía", ""],
    ["solo espacios", "      "],
    ["solo tabulación", "\t"],
    ["solo saltos de línea", "\n\n"],
    ["solo etiquetas HTML", "<span></span>"],
  ])("rechaza un nombre con %s", (_caso, valor) => {
    const result = parse({ fullName: valor });
    expect(result.success).toBe(false);
  });

  it.each([
    ["cadena vacía", ""],
    ["solo espacios", "     "],
  ])("rechaza una ciudad con %s", (_caso, valor) => {
    const result = parse({ city: valor });
    expect(result.success).toBe(false);
  });

  it("acepta un nombre válido y lo normaliza", () => {
    const result = parse({ fullName: "  Juan   Pérez  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fullName).toBe("Juan Pérez");
  });

  it("sigue rechazando un nombre más largo que el máximo", () => {
    expect(parse({ fullName: "a".repeat(201) }).success).toBe(false);
  });

  it("elimina etiquetas HTML pero conserva el texto", () => {
    const result = parse({ fullName: "<b>Juan</b> Pérez" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fullName).toBe("Juan Pérez");
  });
});

describe("handleError — JSON inválido", () => {
  it("devuelve 400 INVALID_JSON en vez de 500", async () => {
    // Es el error que lanza `await request.json()` con un cuerpo corrupto.
    const response = handleError(new SyntaxError("Unexpected token n in JSON"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("INVALID_JSON");
    expect(body.success).toBe(false);
  });

  it("no filtra detalles internos en un error inesperado", async () => {
    const response = handleError(new Error("connect ECONNREFUSED 10.0.0.1"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain("ECONNREFUSED");
  });
});
