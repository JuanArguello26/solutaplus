/**
 * Logging estructurado sin PII, con un único punto de salida. Hoy escribe
 * a stdout/stderr (lo que Vercel ya captura y agrega); cuando exista un
 * `SENTRY_DSN` real, este es el único archivo que hay que tocar para
 * reenviar también a Sentry (`Sentry.captureException(error, { extra: context })`)
 * en vez de instalar y cablear `@sentry/nextjs` a ciegas sin poder
 * verificar que los eventos realmente lleguen a un proyecto real.
 */
interface LogContext {
  [key: string]: unknown;
}

export function logError(error: unknown, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      timestamp,
      message,
      context,
      stack,
    }),
  );
}
