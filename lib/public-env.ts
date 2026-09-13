import { z } from "zod";

// Separado de lib/env.ts a proposito: este modulo es seguro de importar
// desde Client Components. lib/env.ts valida variables secretas
// (DATABASE_URL, ADMIN_PASSWORD, ...) que no existen en el bundle del
// navegador; importarlo desde un componente cliente rompe el build.
// "" (variable presente pero vacía) no es lo mismo que "ausente" para
// z.email().optional(); se normaliza antes de validar.
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

// Sin esto, un NEXT_PUBLIC_SITE_URL con "/" final (fácil de escribir mal
// en el .env de producción) generaría URLs con doble slash en
// sitemap.ts/robots.ts (ej. "https://sitio.com//politica-de-privacidad").
const stripTrailingSlash = (val: string) => val.replace(/\/+$/, "");

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().transform(stripTrailingSlash),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().min(10),
  NEXT_PUBLIC_COMPANY_NAME: z.string().min(1),
  NEXT_PUBLIC_PHONE: z.string().optional(),
  NEXT_PUBLIC_EMAIL: z.preprocess(emptyToUndefined, z.email().optional()),
  NEXT_PUBLIC_ADDRESS: z.string().optional(),
  NEXT_PUBLIC_ADDRESS_CITY: z.string().optional(),
  NEXT_PUBLIC_MAPS_EMBED_URL: z.preprocess(
    emptyToUndefined,
    z.url().optional(),
  ),
  NEXT_PUBLIC_MAPS_URL: z.preprocess(emptyToUndefined, z.url().optional()),
  // Los precios del catálogo son datos de ejemplo del seed hasta que el
  // cliente entregue las tarifas reales. Mientras esta bandera sea false,
  // el cotizador funciona igual pero NO muestra la cifra al usuario ni la
  // incluye en el mensaje de WhatsApp, para no presentar un valor de
  // ejemplo como si fuera un precio comercial. Poner "true" cuando los
  // precios de la base de datos estén confirmados.
  NEXT_PUBLIC_PRICES_CONFIRMED: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
  NEXT_PUBLIC_PHONE: process.env.NEXT_PUBLIC_PHONE,
  NEXT_PUBLIC_EMAIL: process.env.NEXT_PUBLIC_EMAIL,
  NEXT_PUBLIC_ADDRESS: process.env.NEXT_PUBLIC_ADDRESS,
  NEXT_PUBLIC_ADDRESS_CITY: process.env.NEXT_PUBLIC_ADDRESS_CITY,
  NEXT_PUBLIC_MAPS_EMBED_URL: process.env.NEXT_PUBLIC_MAPS_EMBED_URL,
  NEXT_PUBLIC_MAPS_URL: process.env.NEXT_PUBLIC_MAPS_URL,
  NEXT_PUBLIC_PRICES_CONFIRMED: process.env.NEXT_PUBLIC_PRICES_CONFIRMED,
});
