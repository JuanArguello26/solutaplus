import { z } from "zod";
import { sanitizeText } from "./sanitize";

export const quotationSchema = z.object({
  serviceSlug: z
    .string({ error: "Debes seleccionar un servicio" })
    .min(1, "Debes seleccionar un servicio"),
  planId: z
    .string({ error: "Debes seleccionar un plan" })
    .min(1, "Debes seleccionar un plan"),
  city: z
    .string({ error: "La ciudad es obligatoria" })
    .min(1, "La ciudad es obligatoria")
    .max(100)
    .transform(sanitizeText),
});

export type QuotationInput = z.infer<typeof quotationSchema>;
