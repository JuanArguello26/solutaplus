import { z } from "zod";
import { sanitizeText, sanitizePhone, sanitizeEmail } from "./sanitize";

/**
 * Texto obligatorio que se sanea antes de validar que quede con contenido.
 *
 * El orden importa: `.max()` corre sobre la entrada cruda (corta payloads
 * grandes antes de procesarlos) y la comprobación de "no vacío" corre
 * DESPUÉS de `sanitizeText`. Hacerlo al revés —un `.min(1)` sobre el valor
 * crudo— dejaba pasar cadenas de solo espacios ("   "), que el saneamiento
 * convertía luego en "" y se guardaban como nombre/ciudad vacíos.
 */
function requiredText(max: number, message: string) {
  return z
    .string({ error: message })
    .max(max)
    .transform(sanitizeText)
    .refine((value) => value.length > 0, message);
}

// Schema base: reglas de cada campo. Se exporta sin el .refine() de
// consentimiento para que el cliente pueda derivar de aquí un schema
// más chico (sin serviceSlug/planId/city, que ya se conocen del paso
// previo del cotizador) sin duplicar las reglas de validación.
export const leadBaseSchema = z.object({
  fullName: requiredText(200, "El nombre es obligatorio"),
  document: z.string().max(50).transform(sanitizeText).optional(),
  phone: z
    .string({ error: "El teléfono es obligatorio" })
    .transform(sanitizePhone)
    .refine(
      (value) => /^\d{10,15}$/.test(value),
      "El teléfono debe tener entre 10 y 15 dígitos",
    ),
  email: z
    .string({ error: "El correo electrónico es obligatorio" })
    .transform(sanitizeEmail)
    .pipe(z.email("El correo electrónico no es válido")),
  city: requiredText(100, "La ciudad es obligatoria"),
  serviceSlug: z
    .string({ error: "Debes seleccionar un servicio" })
    .min(1, "Debes seleccionar un servicio"),
  planId: z.string().min(1).optional(),
  observations: z.string().max(1000).transform(sanitizeText).optional(),
  consentAccepted: z.boolean({
    error: "Debes aceptar la política de privacidad para continuar.",
  }),
  source: z.string().max(50).optional(),
  // Honeypot anti-spam: campo oculto vía CSS en el formulario real.
  // Se llama "website" (no "honeypot") a propósito: los bots más
  // sofisticados evitan específicamente campos con nombres reveladores.
  website: z.string().optional().default(""),
});

const CONSENT_REFINEMENT: { message: string; path: string[] } = {
  message: "Debes aceptar la política de privacidad para continuar.",
  path: ["consentAccepted"],
};

export const createLeadSchema = leadBaseSchema.refine(
  (data) => data.consentAccepted === true,
  CONSENT_REFINEMENT,
);

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
