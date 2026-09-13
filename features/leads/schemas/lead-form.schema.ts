import { z } from "zod";
import { leadBaseSchema } from "@/server/validators/lead.schema";

// Subconjunto de leadBaseSchema para el formulario del cliente: omite
// serviceSlug/planId/city/source porque esos ya se conocen del paso
// del cotizador (no se le vuelven a pedir al usuario). Las reglas de
// cada campo (formato de teléfono, sanitización, etc.) vienen del
// mismo schema base que usa el servidor - una sola fuente de verdad.
export const leadFormSchema = leadBaseSchema
  .omit({ serviceSlug: true, planId: true, city: true, source: true })
  .refine((data) => data.consentAccepted === true, {
    message: "Debes aceptar la política de privacidad para continuar.",
    path: ["consentAccepted"],
  });

export type LeadFormValues = z.infer<typeof leadFormSchema>;
