import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Turbopack/webpack en dev necesitan 'unsafe-eval' para HMR; producción no.
// 'unsafe-inline' en script/style es necesario porque Next.js hidrata con
// payloads inline y varias libs (Framer Motion, Recharts) inyectan estilos
// inline en runtime — evitarlo requeriría CSP con nonce por request, que
// no aporta valor real a este MVP sin datos de pago/PII de alto riesgo.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self' https://www.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
];

const nextConfig: NextConfig = {
  // `pg` (usado por @prisma/adapter-pg) no debe empaquetarse: requiere
  // resolverse como dependencia nativa de Node en tiempo de ejecución.
  serverExternalPackages: ["pg"],

  // El indicador de modo desarrollo de Next.js (el logo "N") aparece por
  // defecto abajo a la izquierda, encima del botón flotante del chatbot
  // de preguntas frecuentes. Solo existe en dev (no sale en producción);
  // se reubica arriba a la derecha para no chocar con ningún botón
  // flotante de la landing.
  devIndicators: {
    position: "top-right",
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
