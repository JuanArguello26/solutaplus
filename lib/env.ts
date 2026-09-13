import { z } from "zod";

// z.url()/z.email() con .optional() solo aceptan la clave ausente o
// undefined; un .env con la variable presente pero vacía ("") no es
// ninguna de las dos cosas y falla la validación. Estos helpers tratan
// "" como "no configurado".
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);
const optionalUrl = () => z.preprocess(emptyToUndefined, z.url().optional());
const optionalEmail = () =>
  z.preprocess(emptyToUndefined, z.email().optional());

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Base de datos (Supabase Postgres)
  DATABASE_URL: z.url(), // conexión pooled (PgBouncer), usada en runtime
  DIRECT_URL: z.url(), // conexión directa, usada solo por Prisma Migrate/CLI

  // Sitio
  NEXT_PUBLIC_SITE_URL: z.url(),

  // WhatsApp Business
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().min(10),

  // Empresa
  NEXT_PUBLIC_COMPANY_NAME: z.string().min(1),
  NEXT_PUBLIC_PHONE: z.string().optional(),
  NEXT_PUBLIC_EMAIL: optionalEmail(),

  // Analítica (opcional, se activa en fases futuras)
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),

  // Panel administrativo (gate MVP sin usuarios)
  ADMIN_PASSWORD: z.string().min(8),
  ADMIN_SESSION_SECRET: z.string().min(32),

  // Rate limiting (Upstash Redis)
  UPSTASH_REDIS_REST_URL: optionalUrl(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Observabilidad: reservada para cuando exista un proyecto Sentry real.
  // Se decidió NO instalar @sentry/nextjs todavía (Fase 5) — el plugin de
  // build sube sourcemaps y requiere SENTRY_AUTH_TOKEN/ORG/PROJECT reales;
  // sin esas credenciales podría romper `next build` de forma no
  // verificable en este entorno. lib/logger.ts ya centraliza el logging
  // estructurado sin PII (requisito real del SRS); es el único archivo
  // que habría que tocar para reenviar también a Sentry el día que se
  // instale el SDK con credenciales reales.
  SENTRY_DSN: optionalUrl(),

  // Escotilla explícita para compilar/ejecutar con NODE_ENV=production en
  // local mientras las credenciales reales no existan (ver guardas abajo).
  // Nunca debe definirse en un despliegue real.
  ALLOW_INSECURE_ENV: z.string().optional(),
});

/**
 * Marcadores de los valores de ejemplo que trae `.env.example` y de los que
 * se usan en desarrollo. Sirven para detectar un despliegue mal configurado,
 * no para validar la fortaleza de la contraseña.
 */
const INSECURE_MARKERS = [
  "cambiar",
  "cambia-esta",
  "dev-password",
  "dev-secret",
  "genera-un-secreto",
];

function looksInsecure(value: string): boolean {
  const normalized = value.toLowerCase();
  return INSECURE_MARKERS.some((marker) => normalized.includes(marker));
}

function isLocalUrl(value: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(value);
}

/**
 * Guardas de producción: impiden que la aplicación arranque en producción
 * con las credenciales de ejemplo o apuntando todavía a localhost.
 *
 * Los mensajes nombran la variable pero NUNCA imprimen su valor, para no
 * filtrar secretos en logs de build o de arranque.
 */
const envSchemaWithProductionGuards = envSchema.superRefine((env, ctx) => {
  if (env.NODE_ENV !== "production" || env.ALLOW_INSECURE_ENV === "true") {
    return;
  }

  if (looksInsecure(env.ADMIN_PASSWORD)) {
    ctx.addIssue({
      code: "custom",
      path: ["ADMIN_PASSWORD"],
      message:
        "sigue teniendo un valor de ejemplo; genera una contraseña real antes de desplegar.",
    });
  }

  if (looksInsecure(env.ADMIN_SESSION_SECRET)) {
    ctx.addIssue({
      code: "custom",
      path: ["ADMIN_SESSION_SECRET"],
      message:
        "sigue teniendo un valor de ejemplo; genera un secreto aleatorio (openssl rand -base64 48) antes de desplegar.",
    });
  }

  if (isLocalUrl(env.NEXT_PUBLIC_SITE_URL)) {
    ctx.addIssue({
      code: "custom",
      path: ["NEXT_PUBLIC_SITE_URL"],
      message:
        "apunta a localhost; debe ser el dominio real (afecta sitemap, robots, canonical y Open Graph).",
    });
  }
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchemaWithProductionGuards.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Variables de entorno inválidas o faltantes:\n${issues}\n\nRevisa .env.example.`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
