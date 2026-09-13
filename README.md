# SolutaPLUS

> Copia del proyecto original (`landinsalud`) adaptada para el proyecto de
> la universidad (integración con AppSheet). El proyecto original vive en
> otra carpeta y no se modifica desde aquí.

Landing page + panel administrativo para una empresa colombiana de
afiliación a Salud, Pensión, ARL y Seguridad Social. Captura leads desde
Google, cotiza en línea y redirige a WhatsApp Business para el cierre
comercial; el panel administrativo permite gestionar esos leads.

## Stack

- **Next.js 15** (App Router, Turbopack) + **React 19** + TypeScript
  estricto + Tailwind CSS 4
- **Prisma 7** (driver adapters) + **PostgreSQL** vía Supabase
- React Hook Form + Zod (schemas compartidos cliente/servidor)
- TanStack Query, Framer Motion, Recharts
- Upstash Redis (rate limiting, opcional)
- Vitest (unit tests)

Ver [`docs/architecture.md`](docs/architecture.md) para el diseño completo
(frontend, backend, base de datos, APIs, flujos) y
[`CLAUDE.md`](CLAUDE.md) para el estado actual del proyecto y las
decisiones que se desviaron del plan original durante la construcción.

## Requisitos

- Node.js 20+
- Un proyecto de Supabase (Postgres) — no hay soporte para Postgres local
  en este repo (ver `CLAUDE.md`, sección de notas operativas)

## Configuración local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env` y completar los valores reales
   (credenciales de Supabase, número de WhatsApp, contraseña del panel
   admin, etc.). Todas las variables están validadas por `lib/env.ts` —
   si falta alguna, la app falla al arrancar con un mensaje claro.

3. Aplicar migraciones y sembrar datos de catálogo (servicios/planes de
   ejemplo):

   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```

4. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   La landing queda en `http://localhost:3000` y el panel admin en
   `http://localhost:3000/admin/login`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build de producción |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (con orden de clases Tailwind) |
| `npm test` | Tests unitarios (Vitest) |
| `npm run prisma:migrate` | Aplica migraciones de Prisma |
| `npm run prisma:seed` | Siembra servicios/planes de ejemplo |
| `npm run prisma:studio` | Explorador visual de la base de datos |

## Estructura del proyecto

```
app/            Rutas (App Router): landing pública, panel admin, API
components/     Design system (ui/) y composición de dominio (shared/, layout/)
features/       Módulos autocontenidos (landing, quotation, leads, dashboard)
server/         Backend: services, repositories, validators, middleware, errors
lib/            Infraestructura transversal (prisma, env, auth admin, logger...)
prisma/         Schema, migraciones, seed
docs/           Documentación (arquitectura, manual del panel admin)
tests/unit/     Tests con Vitest
```

Reglas de capas y convenciones detalladas en `CLAUDE.md`.

## Panel administrativo

Ver [`docs/admin-manual.md`](docs/admin-manual.md) para la guía de uso
(login, dashboard, gestión de leads, exportación).

## Antes de desplegar a producción

Checklist de variables/valores que hoy están en modo desarrollo y deben
cambiarse:

- [ ] `ADMIN_PASSWORD` — cambiar la contraseña de desarrollo por una real
- [ ] `ADMIN_SESSION_SECRET` — generar un secreto nuevo (`openssl rand -base64 48`)
- [ ] `NEXT_PUBLIC_SITE_URL` — apuntar al dominio real (afecta sitemap,
      robots.txt, metadata Open Graph y la política CSP)
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` — número real de WhatsApp Business
- [ ] `NEXT_PUBLIC_COMPANY_NAME` / `NEXT_PUBLIC_PHONE` / `NEXT_PUBLIC_EMAIL`
      — datos reales de la empresa (aparecen en el footer y en el JSON-LD)
- [ ] Contenido de ejemplo en `constants/*.ts` (servicios, testimonios,
      FAQ) y textos legales provisionales en `politica-de-privacidad` /
      `terminos-y-condiciones` — reemplazar por los definitivos del cliente
- [ ] `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — configurar
      para que el rate limiting sea real (hoy hace no-op si están vacías)
- [ ] `SENTRY_DSN` — opcional; ver la nota en `lib/env.ts` sobre por qué
      no se instaló `@sentry/nextjs` todavía
- [ ] `npm audit` — revisar vulnerabilidades transitivas conocidas
      (`postcss`/`sharp` vía Next 15, `uuid` vía `exceljs`); documentadas
      como riesgo aceptado en `CLAUDE.md`
- [ ] Inicializar git en esta copia — el repo de GitHub
      [`JuanArguello26/landing-salud`](https://github.com/JuanArguello26/landing-salud)
      pertenece al **proyecto original**, no a SolutaPLUS; no hacer push ahí
- [ ] Conectar el repo de GitHub a Vercel — pendiente, requiere una
      decisión explícita del dueño del proyecto sobre hosting/dominio
