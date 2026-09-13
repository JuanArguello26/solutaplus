# Plan de Arquitectura — Landing Page Salud/Pensión/ARL

> **Nota (Fase 5):** este documento es el plan de arquitectura tal como se
> aprobó antes de empezar a construir — se mantiene sin editar como
> registro histórico de las decisiones originales. Las desviaciones reales
> que surgieron durante la implementación (Prisma 7, gate de admin,
> convenciones de código, etc.) están documentadas en
> [`CLAUDE.md`](../CLAUDE.md), que es la fuente de verdad sobre el **estado
> actual** del proyecto. Ante cualquier contradicción entre los dos,
> `CLAUDE.md` gana.

## Contexto

Se me pidió actuar como Arquitecto de Software / Tech Lead y producir **únicamente un documento de planificación técnica**, sin escribir código ni crear archivos del proyecto. Leí íntegramente los dos documentos fuente que están en esta carpeta:

- `SRS (Software Requirements Specification).docx` (10 partes, ~3.000 líneas de texto extraído)
- `Guía Operativa para Claude Code.docx` (Parte 10 — "Prompt Maestro", guía de forma de trabajo)

Este documento resume mi comprensión del proyecto, riesgos, mejoras, inconsistencias detectadas y la arquitectura/plan de fases que propongo antes de tocar código. No incluye implementación.

---

## 1-2. Objetivo del negocio

Una empresa colombiana de afiliación a **Salud, Pensión, ARL y Seguridad Social** necesita dejar de depender del contacto manual (llamadas/mensajes directos) para captar clientes. Hoy pierde leads, tarda en responder y no tiene trazabilidad ni métricas.

La solución es un **embudo de captación de leads**, no una tienda ni un sistema de venta directa:

`Google → Landing → Cotizador → Formulario → Lead guardado en BD → Redirección a WhatsApp con mensaje prellenado → Asesor humano cierra la venta`

Éxito = más formularios enviados, más conversaciones de WhatsApp iniciadas, 100% de leads registrados y trazabilidad completa vía panel administrativo.

## 3. Alcance del MVP

**Incluido:** Landing responsiva multi-sección (Hero, Beneficios, Servicios, Cómo Funciona, Cotizador, Formulario, Testimonios, FAQ, Footer), cotizador basado en reglas/constantes (no tarifas reales), captura de leads con validación (Zod), persistencia en PostgreSQL (Prisma/Supabase), construcción dinámica del mensaje de WhatsApp (`wa.me`), panel administrativo (CRUD de leads, búsqueda, filtros combinados, orden, paginación, historial de estados, dashboard con KPIs y gráficas, exportación CSV/Excel), base SEO (metadata, sitemap, robots, JSON-LD), despliegue en Vercel + Supabase.

**Explícitamente fuera de alcance:** Google Ads, CRM completo, automatizaciones con IA, apps móviles, integraciones distintas a WhatsApp, WhatsApp Business API real (solo enlaces `wa.me`), autenticación/roles completos, pasarela de pagos, reCAPTCHA/Turnstile activo, disparo real de eventos GA4/Meta Pixel, documentación Swagger/OpenAPI generada.

## 4. Riesgos técnicos

1. **Panel `/admin` sin autenticación es el mayor riesgo del MVP.** El SRS lo permite explícitamente ("el MVP no incluirá autenticación"), pero el panel almacena PII (nombre, teléfono, correo, ciudad, documento). Publicado en Vercel sin ninguna barrera, cualquiera que descubra la URL puede leer/exportar/eliminar todos los leads. Esto además choca con la **Ley 1581 de 2012 (Habeas Data, Colombia)**, que exige controles de acceso a datos personales. Lo trato como no negociable a resolver antes de producción (ver sección 7).
2. **Formulario sin captura de consentimiento.** El SRS pide enlace a "política de privacidad" en el footer, pero no un checkbox de consentimiento explícito en el propio formulario de leads, que es donde realmente se recolecta el dato personal.
3. **Prisma + Postgres serverless.** Vercel (funciones efímeras) + Supabase Postgres sin *connection pooling* agota conexiones rápidamente bajo carga concurrente. Hay que usar el *connection pooler* de Supabase (PgBouncer, `?pgbouncer=true`) desde el día 1, no como ajuste posterior.
4. **Rate limiting stateless.** El SRS pide "máximo 10 solicitudes por minuto por IP", pero en funciones serverless no hay memoria compartida entre invocaciones — un limitador en memoria no funciona. Se requiere un store externo (ej. Upstash Redis).
5. **Regla de duplicados ambigua.** "Dos leads idénticos creados en pocos minutos" no define una ventana concreta ni la combinación de campos exacta — debe convertirse en regla de negocio precisa antes de codificar (propongo: mismo teléfono + mismo servicio en ventana de 30 min).
6. **Dependencia de contenido del cliente.** Colores corporativos, testimonios, sellos/certificaciones y precios reales de planes están pendientes de que el cliente los entregue. Sin esto el proyecto puede quedar bloqueado en Fase 1/Fase 2.
7. **Metas de Lighthouse en conflicto con Framer Motion.** Se pide Performance ≥95-98 y a la vez animaciones en toda la navegación; hay que ser selectivo (evitar animar el Hero al cargar, usar animaciones ligeras basadas en CSS/transform).
8. **`wa.me` sin fallback.** En desktop sin WhatsApp instalado, el enlace debe degradar a `web.whatsapp.com`; el SRS no lo contempla explícitamente.
9. **Exportación a Excel** añade una dependencia (ej. `exceljs`) que genera archivos en memoria dentro de una función serverless — hay que vigilar límites de tamaño/tiempo de ejecución de Vercel.

## 5. Mejoras posibles

- Checkbox de consentimiento + enlace a política de privacidad directamente en el formulario de leads (cumplimiento legal, no solo estético).
- Gate de acceso mínimo a `/admin` desde el día 1 (contraseña compartida vía variable de entorno + cookie firmada) — barato de construir, elimina el riesgo #1 sin requerir un sistema de usuarios completo.
- Honeypot + rate limiting reales desde el MVP (no solo "dejar preparado"), evita spam obvio sin costo de reCAPTCHA.
- Regla explícita de detección de duplicados.
- `TanStack Query` usado ya en el panel (no solo "preparado para el futuro") — simplifica muchísimo el fetching/caché/optimistic updates del dashboard con poco costo adicional.
- Server Components para las vistas de solo lectura del panel (listado/detalle de leads), reservando Client Components para las islas interactivas (filtros, formularios) — menos JS enviado al cliente, mejor Lighthouse.
- Generar documentación OpenAPI casi gratis a partir de los mismos schemas de Zod (`zod-to-openapi`), en vez de dejarlo como tarea manual futura.
- Observabilidad (Sentry + logs estructurados) desde el inicio, no al final — el SRS ya exige registrar errores sin datos sensibles; hacerlo bien desde el principio evita reescritura.

## 6. Inconsistencias detectadas

- **Autenticación vs. auditoría:** el SRS pide registrar "usuario responsable" en la auditoría del panel, pero el MVP no tiene modelo de usuarios. No hay a quién atribuir la acción. Resuelto en la arquitectura propuesta con un gate de admin único (ver sección 7) que deja el slot listo para usuarios reales.
- **Metas de Lighthouse distintas entre partes:** Parte 4 pide ">95" en las 4 categorías; Parte 9 pide "98+ / 98+ / 100 / 100"; Parte 10 pide "95+ / 100 / 95+ / 100". Recomiendo fijar un único objetivo oficial: **Performance ≥95, Accessibility ≥95, Best Practices 100, SEO 100**, documentando cualquier desviación real en vez de perseguir tres metas distintas.
- **Modelo Prisma "conceptual" incompleto respecto al texto:** el texto exige *soft delete* (`deletedAt`) y enum de estados, pero el `model Lead` de ejemplo en el SRS no incluye `deletedAt`, y `LeadStatusHistory` no tiene relación con un `User` pese a que "Users" está listado como tabla futura. Hay que completar el esquema antes de generar migraciones reales.
- **Dos convenciones distintas para exportación:** Parte 5 define `/api/leads/export/csv` y `/api/leads/export/excel`; Parte 7 los redefine como `/api/export/csv` y `/api/export/excel`. Propongo unificar en `/api/leads/export/:format` (mantiene el recurso `leads` como raíz, coherente con REST).
- **Nombre de variable de entorno inconsistente:** Parte 3 usa `NEXT_PUBLIC_BASE_URL`; Partes 7 y 9 usan `NEXT_PUBLIC_SITE_URL`. Unificar en `NEXT_PUBLIC_SITE_URL`.
- **Dos "backends" en el mismo documento:** Parte 3 dibuja `landing-salud/app` (estilo Next.js App Router) mientras que Parte 5 dibuja una carpeta `backend/` independiente con `controllers/services/repositories/routes/` como si fuera una app aparte. En un monolito Next.js esto no puede coexistir literalmente. Lo resuelvo en la sección 7/8: la lógica de Parte 5 vive en `server/` en la raíz del mismo proyecto Next.js, y `app/api/*/route.ts` es solo el punto de entrada delgado.
- La Guía Operativa (Parte 10) repite casi textualmente principios de arquitectura, SEO y testing ya presentes en el SRS. La trato como guía de **proceso y tono de colaboración** (cómo trabajar conmigo), no como una segunda fuente de requerimientos — evita mantener dos listas de "verdad" que puedan divergir.

## 7. Mejoras de arquitectura propuestas

- **Capas pragmáticas, sin over-engineering.** El SRS pide Clean Architecture + SOLID; mantengo la separación `Route Handler (delgado) → Service (lógica) → Repository (Prisma)` tal como se pide, pero **sin** una capa de interfaces/DI abstracta — a esta escala (una sola fuente de datos) añade fricción sin beneficio real. Se revisita si en el futuro aparece una segunda fuente de datos o se requiere testear con mocks pesados.
- **`server/` como carpeta de backend dentro del mismo proyecto Next.js**, resolviendo la inconsistencia de la sección 6: `server/services`, `server/repositories`, `server/validators`, `server/middleware`, `server/errors`. Los `route.ts` bajo `app/api/**` solo invocan servicios de `server/`.
- **Gate mínimo de administrador desde el MVP:** Next.js Middleware que protege todo `/admin/*` mediante una contraseña compartida (env var) + cookie firmada (HMAC), sin modelo de usuarios. Resuelve el riesgo #1 con costo mínimo y dado que el slot de middleware ya existe, migrar a Auth.js con usuarios/roles reales en v2 no requiere tocar el resto del sistema.
- **Contrato de respuesta y errores centralizado:** `lib/api-response.ts` (`ok()`, `fail()`) + `server/errors/AppError.ts`, en vez de repetir try/catch por endpoint (el propio SRS lo pide explícitamente: "nunca repetir bloques try/catch innecesarios").
- **`lib/env.ts` con Zod** como única fuente de variables de entorno, valida al arrancar y falla rápido si falta una variable — reemplaza el acceso disperso a `process.env`.
- **Rate limiting con Upstash Redis** (compatible con Edge/serverless, tier gratuito suficiente para el MVP) en vez de un limitador en memoria.
- **Testing real mínimo, no solo checklist manual:** Vitest para la lógica de `QuotationService` y el *builder* del mensaje de WhatsApp (son las piezas con reglas de negocio reales), y un puñado de pruebas e2e con Playwright para el camino feliz completo (cargar landing → cotizar → enviar formulario → verificar enlace de WhatsApp generado). Esto valida directamente los criterios de aceptación del SRS ("la cotización se genere sin errores", "WhatsApp se abra con el mensaje prellenado") sin gran inversión.
- **Observabilidad desde el día 1** (Sentry + logging estructurado sin PII), no relegada a "futuro" como sugiere el SRS.

## 8. Estructura de carpetas propuesta

```
landing-salud/
├── app/
│   ├── (public)/                    # Landing y futuras páginas SEO (/afiliacion-salud, /arl, /pension)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── admin/
│   │   ├── layout.tsx               # protegido por middleware.ts
│   │   ├── page.tsx                 # dashboard
│   │   ├── login/page.tsx           # gate de contraseña compartida (MVP)
│   │   └── leads/
│   │       ├── page.tsx             # listado, filtros, búsqueda, paginación
│   │       └── [id]/page.tsx        # detalle + historial de estados
│   ├── api/
│   │   ├── leads/
│   │   │   ├── route.ts             # GET (listar), POST (crear)
│   │   │   ├── [id]/route.ts        # GET, PUT, DELETE (soft delete)
│   │   │   ├── [id]/status/route.ts # PATCH
│   │   │   └── export/[format]/route.ts
│   │   ├── quotation/route.ts
│   │   ├── services/route.ts
│   │   ├── plans/route.ts
│   │   └── dashboard/route.ts
│   ├── sitemap.ts
│   ├── robots.ts
│   └── layout.tsx                   # metadata raíz, fuentes, providers
│
├── components/                      # Design System puro (sin lógica de negocio)
│   ├── ui/                          # Button, Input, Select, Textarea, Modal, Badge, Tooltip, Toast, Loader, Card, Table, Skeleton
│   ├── layout/                      # Navbar, Footer, WhatsAppButton
│   └── shared/                      # ServiceCard, BenefitCard, StepCard, PriceCard, Testimonial, FAQItem
│
├── features/                        # Un módulo = independiente y autocontenido
│   ├── landing/components/          # Hero, Benefits, Services, HowItWorks, Testimonials, FAQ
│   ├── quotation/{components,hooks,schemas,services,types}/
│   ├── leads/{components,hooks,schemas,services,types}/   # LeadForm, useLead
│   ├── whatsapp/{hooks,utils}/      # useWhatsApp, buildWhatsAppMessage
│   └── dashboard/{components,hooks,types}/  # KpiCard, LeadsTable, Charts, useLeadsQuery (TanStack Query)
│
├── server/                          # Backend real — nunca importado por Client Components
│   ├── services/                    # LeadService, QuotationService, DashboardService, ExportService
│   ├── repositories/                # LeadRepository, ServiceRepository, PlanRepository
│   ├── validators/                  # Zod schemas del lado servidor
│   ├── middleware/                  # rateLimit.ts, adminAuth.ts
│   └── errors/                      # AppError.ts, error codes
│
├── hooks/                           # Transversales: useDebounce, useLocalStorage, usePagination
├── lib/                             # prisma.ts, env.ts, metadata.ts, whatsapp.ts, api-response.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
├── types/                           # ILead, tipos compartidos front/back
├── constants/                       # services.ts, plans.ts, cities.ts, messages.ts, faq.ts
├── tests/
│   ├── unit/
│   └── e2e/
├── docs/                            # architecture.md, deployment.md, admin-manual.md
├── middleware.ts                    # gate de /admin
├── .env.example
└── package.json
```

## 9. Stack definitivo

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, Framer Motion (uso selectivo), React Hook Form + Zod, Lucide React, TanStack Query (panel admin, activo desde el MVP), Recharts.
- **Backend:** Next.js Route Handlers, Prisma ORM, Zod (validación compartida), Server Actions solo para mutaciones internas del panel donde simplifiquen sin romper el contrato REST público.
- **Base de datos:** PostgreSQL vía Supabase, con *connection pooling* (PgBouncer) habilitado desde el inicio.
- **Infraestructura:** Vercel (frontend + API), GitHub (repo + CI vía integración nativa de Vercel), Upstash Redis (rate limiting), Sentry (errores), ExcelJS (export .xlsx).
- **Calidad:** ESLint + Prettier + TypeScript `strict`, Vitest (unit), Playwright (e2e smoke).
- **Auth MVP-lite:** gate por contraseña compartida + cookie firmada vía Middleware; slot preparado para Auth.js/NextAuth en v2.

## 10. Estrategia de desarrollo por fases

| Fase | Contenido |
|---|---|
| **0 — Fundamentos** | Scaffolding del repo, tooling (ESLint/Prettier/TS strict), tokens de diseño, `schema.prisma` definitivo + migraciones + seed, `lib/env.ts`, esqueleto de CI. |
| **1 — Design System + Landing estática** | Componentes reutilizables de `components/ui`, secciones de la landing con contenido de ejemplo, layout responsive, animaciones, metadata SEO base. |
| **2 — Backend y datos** | Rutas API (leads, quotation, services, plans, dashboard), `server/services` y `server/repositories`, validación, *builder* del mensaje de WhatsApp, contrato de error/respuesta, rate limiting. |
| **3 — Integración** | Conectar el formulario y el cotizador de la landing a la API real, redirección a WhatsApp de extremo a extremo, estados de carga/éxito/error, toasts. |
| **4 — Panel administrativo** | Gate de acceso, dashboard con KPIs y gráficas, tabla de leads (filtros/búsqueda/orden/paginación), detalle + historial de estados, exportación CSV/Excel. |
| **5 — SEO, performance, hardening y despliegue** | sitemap/robots/JSON-LD, ajuste de Lighthouse, auditoría de accesibilidad, headers de seguridad, Sentry/logging, pase de pruebas manuales del checklist pre-producción, despliegue y documentación final. |

Cada fase se cierra completamente (funcional y probada) antes de iniciar la siguiente, tal como exige la Guía Operativa.

## 11. Orden exacto de implementación

1. `schema.prisma` definitivo (con correcciones de la sección 6) + migración inicial + seed de servicios/planes/ciudades.
2. `lib/env.ts`, `lib/prisma.ts`, `lib/api-response.ts`, `server/errors/AppError.ts`.
3. `components/ui/*` (Button, Input, Select, Textarea, Card, Modal, Badge, Toast, Loader, Table, Skeleton).
4. Landing estática: Navbar, Hero, Benefits, Services, HowItWorks, Footer, WhatsAppButton (con contenido de ejemplo, sin backend aún).
5. `server/services/QuotationService` + `POST /api/quotation` + integración del cotizador en la UI.
6. `server/services/LeadService` + `server/repositories/LeadRepository` + `POST /api/leads` + `LeadForm` (React Hook Form + Zod) conectado.
7. `features/whatsapp` (builder del mensaje) + redirección real al enviar el lead.
8. Rate limiting (Upstash) + honeypot + sanitización de entradas en las rutas públicas.
9. `middleware.ts` (gate de `/admin`) + `admin/login`.
10. `GET /api/leads` (filtros/búsqueda/orden/paginación) + `admin/leads` (tabla) + `admin/leads/[id]` (detalle + historial).
11. `PATCH /api/leads/:id/status` + `LeadStatusHistory` + UI de cambio de estado.
12. `GET /api/dashboard` + KPIs + gráficas (Recharts) + Skeletons.
13. Exportación CSV/Excel (`/api/leads/export/:format`).
14. SEO: metadata por página, `sitemap.ts`, `robots.ts`, JSON-LD, Open Graph/Twitter Cards.
15. Auditoría de performance/accesibilidad (Lighthouse), ajuste de animaciones e imágenes.
16. Sentry + logging estructurado, headers de seguridad, revisión de variables de entorno de producción.
17. Pruebas e2e (Playwright) del camino feliz + smoke tests manuales del checklist pre-producción.
18. Despliegue a Vercel/Supabase + documentación final (README, manual de admin, `.env.example`, documento de arquitectura).

## 12. Estimación de tiempos por módulo

Supuesto explícito: **1 desarrollador senior full-stack trabajando con asistencia de Claude Code**, jornadas efectivas de desarrollo (no calendario). Son rangos de trabajo, no una fecha comprometida — dependen fuertemente de que el cliente entregue contenido/branding/precios a tiempo (riesgo #6).

| Módulo | Estimado |
|---|---|
| Fase 0 — Fundamentos | 1 – 1.5 días |
| Fase 1 — Design System + Landing estática | 4 – 5 días |
| Fase 2 — Backend y datos | 3 – 4 días |
| Fase 3 — Integración | 1.5 – 2 días |
| Fase 4 — Panel administrativo | 4 – 5 días |
| Fase 5 — SEO/Performance/Hardening/Deploy | 2 – 3 días |
| Buffer (QA, ajustes de contenido, imprevistos) | 1 – 2 días |
| **Total estimado** | **≈ 17 – 22 días de trabajo (3.5 – 4.5 semanas)** |

## 13. Partes del SRS que podrían simplificarse en el MVP

- La ceremonia completa de Clean Architecture/DI (interfaces abstractas, inyección de dependencias) — usar la capa pragmática Service/Repository descrita en la sección 7 hasta que exista una razón concreta para más abstracción.
- Exportación a Excel el día 1 — se puede lanzar solo con CSV en la Fase 4 (cubre el criterio de aceptación "exportar información") y mover Excel a un fast-follow, ya que agrega una dependencia y complejidad de formato sin valor adicional inmediato.
- Atribución de auditoría por usuario (`changedBy`) — con un único admin compartido en el MVP, basta un log de auditoría a nivel de sistema; la atribución por usuario real llega junto con Auth.js en v2.
- Los eventos de Business Intelligence "futuros" (comparativos por período, rendimiento por asesor, origen de tráfico detallado) — el propio SRS ya los marca como futuros; mantener el dashboard del MVP limitado a los KPIs explícitamente requeridos (total/hoy/semana/mes, servicio top, ciudad top, distribución por estado).
- Documentación OpenAPI/Swagger generada automáticamente, reCAPTCHA/Turnstile, disparo real de eventos GA4/Meta Pixel, multiempresa/roles — el SRS ya los difiere a futuro; solo confirmo que no deben colarse en el alcance del MVP.
- La Guía Operativa (Parte 10) no aporta requerimientos nuevos frente al SRS — se usa como guía de proceso/tono, no como checklist adicional a mantener sincronizada.

---

# PARTE B — ARQUITECTURA DETALLADA

Diseño completo de la solución sobre la base de la Parte A (ya aprobada). Sigue siendo un documento de diseño — no contiene código, solo contratos, esquemas y diagramas en texto que luego se traducirán a implementación fase por fase.

## 14. Arquitectura Frontend

**Modelo de renderizado:** Next.js 15 App Router con **Server Components por defecto**; un componente solo se marca `"use client"` cuando necesita interactividad real (formularios, animaciones con estado, hooks de React). Esto aplica en ambos lados:

- **Landing pública:** prácticamente todo Server Component (Hero, Benefits, Services, HowItWorks, Testimonials, FAQ son estáticos/basados en `constants/`). Islas cliente: `LeadForm`, `QuotationWidget`, `Navbar` (menú hamburguesa), `WhatsAppFloatingButton`, animaciones Framer Motion puntuales.
- **Panel admin:** listado y detalle de leads se renderizan como Server Component en la carga inicial (fetch directo a `server/services` desde el Server Component, sin pasar por HTTP) e hidratan con **TanStack Query** en cliente para filtros, orden, paginación y refetch tras mutaciones — evita el "loading" inicial en blanco y minimiza JS enviado.

**Composición:** cada sección de la landing es un componente pequeño y autocontenido que solo compone componentes de `components/ui` y `components/shared`; nunca contiene fetch ni lógica de negocio (esto reproduce literalmente la jerarquía `ServiceCard → Icon → Title → Description → Button` que pide el SRS).

**Gestión de estado:**
- Estado de formularios: `react-hook-form` + resolver de `zod` (sin estado manual, sin validación a mano).
- Estado de servidor (leads, dashboard): `TanStack Query` — cache, invalidación tras mutaciones, estados `isLoading/isError` ya resueltos, sin `useEffect` + `fetch` manual.
- Estado de UI efímero (modal abierto, tab activo, drawer de filtros): `useState`/`useReducer` local al componente, nunca global.
- No se usa Redux/Zustand: el alcance del MVP no lo justifica: dos árboles de estado (formularios + server-state) cubren el 100% de los casos.

**Capa de servicios de cliente (`features/*/services`):** única capa autorizada para llamar `fetch`. Ningún componente llama `fetch`/`axios` directamente (regla explícita del SRS). Ejemplo de contrato: `LeadService.create(payload): Promise<ApiResponse<Lead>>`.

**Diseño visual:** tokens centralizados en `tailwind.config` (colores, espaciado en escala de 8px, tipografía) — cero valores mágicos en componentes. Animaciones Framer Motion limitadas a *fade-in*, *slide-up*, *scale* y *hover*, 200-300ms, nunca en el Hero durante la carga inicial (protege LCP).

## 15. Arquitectura Backend

Cadena de responsabilidad estricta, unidireccional:

```
Request HTTP
   │
   ▼
Middleware (rate limit / admin auth)      server/middleware
   │
   ▼
Route Handler (app/api/**/route.ts)       parseo, delega, formatea respuesta
   │
   ▼
Validación (Zod)                          server/validators
   │
   ▼
Service (lógica de negocio)               server/services
   │
   ▼
Repository (acceso a datos)               server/repositories
   │
   ▼
Prisma Client                             lib/prisma.ts
   │
   ▼
PostgreSQL (Supabase, pooled)
```

- **Route Handler:** solo parsea `req`, llama **un** método de servicio y devuelve `ok()`/`fail()` desde `lib/api-response.ts`. Cero lógica de negocio, cero acceso a Prisma directo (regla explícita del SRS: "nunca consultar Prisma directamente desde la API").
- **Service:** dueño de las reglas de negocio (cálculo de cotización, construcción del mensaje de WhatsApp, detección de duplicados, transición de estados válida, agregaciones del dashboard). Es la única capa que puede lanzar `AppError` con código de negocio.
- **Repository:** únicamente queries Prisma (`findMany`, `create`, `update`, agregaciones `groupBy`/`count`). Sin reglas de negocio, sin validación.
- **Manejo de errores:** un único punto de captura por Route Handler (`try { ... } catch (e) { return handleError(e) }`, donde `handleError` vive en `lib/api-response.ts` y traduce `AppError` → `{success:false, message, code}` con el status HTTP correcto; errores no controlados se registran (Sentry/log) y se devuelven como `500` genérico sin stack trace al cliente.
- **Transacciones:** creación de `Lead` + primer registro de `LeadStatusHistory` (`NEW`) ocurre en una única `prisma.$transaction` para garantizar que nunca exista un lead sin historial.
- **Idempotencia/duplicados:** `LeadService.create` verifica, antes de insertar, si existe un lead con el mismo `phone` + `serviceId` creado en los últimos 30 minutos; si existe, responde `409 CONFLICT` con `code: "DUPLICATE_LEAD"` en vez de crear un registro nuevo.

## 16. Arquitectura de Base de Datos

**Motor:** PostgreSQL (Supabase) con *connection pooling* (PgBouncer, modo *transaction*) para el `DATABASE_URL` usado en runtime serverless, y una `DIRECT_URL` sin pool reservada solo para migraciones (patrón estándar de Prisma + Supabase).

**Diagrama entidad-relación:**

```
Service (1) ──< (N) Plan
Service (1) ──< (N) Lead
Plan    (1) ──< (N) Lead        [planId es opcional: un lead puede cotizar sin plan elegido aún]
Lead    (1) ──< (N) LeadStatusHistory
```

**Reglas de integridad** (heredadas del SRS, ya resueltas frente a la inconsistencia detectada en la sección 6):
- Un `Lead` siempre pertenece a un `Service` (`serviceId` obligatorio, `onDelete: Restrict`).
- Un `Plan` siempre pertenece a un único `Service`.
- Ningún registro se borra físicamente: todas las tablas de negocio (`Service`, `Plan`, `Lead`) tienen `deletedAt DateTime?`; "borrar" = setear `deletedAt`. Los repositorios filtran `deletedAt: null` por defecto.
- Los estados de `Lead` viven exclusivamente en el enum `LeadStatus` (nunca texto libre).

**Índices:** `Lead.phone`, `Lead.email`, `Lead.createdAt`, `Lead.serviceId`, `Lead.status`, `Lead.city`, y un índice compuesto `(phone, serviceId, createdAt)` específicamente para la verificación de duplicados en `O(log n)` en vez de escanear.

Ver detalle de campos por entidad en la sección 18 (Entidades).

## 17. Estructura de Carpetas (confirmada)

Se mantiene tal como quedó definida y aprobada en la Parte A, sección 8 — no hay cambios; esta arquitectura detallada se construye dentro de esa misma estructura (`app/`, `components/`, `features/`, `server/`, `lib/`, `prisma/`, `types/`, `constants/`, `tests/`, `docs/`).

## 18. Entidades (modelo de datos completo)

### `Service`
| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | PK |
| name | String | "Salud", "Pensión", "ARL"... |
| slug | String | único, usado en URLs amigables |
| description | String? | |
| icon | String? | nombre de ícono Lucide, desacopla el ícono del código |
| displayOrder | Int | default 0, controla orden visual sin tocar código |
| isActive | Boolean | default true |
| deletedAt | DateTime? | soft delete |
| createdAt / updatedAt | DateTime | |

Relaciones: `plans: Plan[]`, `leads: Lead[]`

### `Plan`
| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | PK |
| serviceId | String | FK → Service |
| name | String | "Básico", "Premium"... |
| description | String? | |
| estimatedPrice | Decimal | nunca se recibe del Frontend, siempre se lee de aquí |
| currency | String | default "COP" |
| benefits | String[] | lista de beneficios incluidos |
| displayOrder | Int | |
| isActive | Boolean | |
| deletedAt | DateTime? | |
| createdAt / updatedAt | DateTime | |

Relaciones: `service: Service`, `leads: Lead[]`

### `Lead` (tabla principal)
| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | PK |
| fullName | String | obligatorio |
| document | String? | opcional (según SRS) |
| phone | String | obligatorio, normalizado (solo dígitos, 10-15) |
| email | String | obligatorio, formato válido |
| city | String | obligatorio |
| serviceId | String | FK → Service, obligatorio |
| planId | String? | FK → Plan, opcional |
| estimatedPrice | Decimal? | calculado en backend a partir del plan |
| observations | String? | |
| status | LeadStatus (enum) | default `NEW` |
| source | String? | "Google", "Directo", etc. |
| ipAddress | String? | auditoría, nunca expuesta en UI |
| userAgent | String? | auditoría |
| consentAcceptedAt | DateTime? | **añadido sobre el SRS** — evidencia de aceptación de política de datos (Ley 1581/2012) |
| deletedAt | DateTime? | soft delete |
| createdAt / updatedAt | DateTime | |

Relaciones: `service: Service`, `plan: Plan?`, `statusHistory: LeadStatusHistory[]`

### `LeadStatusHistory`
| Campo | Tipo | Notas |
|---|---|---|
| id | String (cuid) | PK |
| leadId | String | FK → Lead |
| oldStatus | LeadStatus? | null en el primer registro (creación) |
| newStatus | LeadStatus | |
| comment | String? | nota del asesor al cambiar estado |
| changedBy | String? | nulo en MVP (sin usuarios); listo para poblarse cuando exista Auth.js |
| changedAt | DateTime | default now() |

### `enum LeadStatus`
`NEW · IN_PROGRESS · CONTACTED · PENDING · AFFILIATED · NOT_INTERESTED · CANCELLED`

### Entidades futuras (no se crean en el MVP, solo se reserva el nombre en el dominio)
`User, Role, Permission, Appointment, Note, Attachment, Notification, Task, ActivityLog, AuditLog, Campaign, Analytics` — mencionadas explícitamente para que ningún nombre de tabla del MVP colisione con ellas.

## 19. Componentes (inventario)

**`components/ui` (Design System — sin lógica de negocio, 100% reutilizables):**
`Button` (variants: primary/secondary/outline/ghost; estados: default/hover/focus/disabled/loading) · `Input` · `Textarea` · `Select` · `Checkbox` (para el consentimiento) · `Card` · `Badge` (mapea `LeadStatus` → color) · `Modal` · `Tooltip` · `Toast` · `Loader` · `Skeleton` · `Table` (cabeceras ordenables) · `Pagination`.

**`components/layout`:** `Navbar` (sticky, logo, links, CTA WhatsApp, hamburguesa en mobile) · `Footer` · `WhatsAppFloatingButton` (persistente, visible siempre en mobile).

**`components/shared` (composición de dominio, aún sin fetch):** `ServiceCard` · `BenefitCard` · `StepCard` · `PriceCard` · `TestimonialCard` · `FAQItem` (acordeón) · `KpiCard` · `StatusBadge`.

**`features/landing/components`:** `Hero` · `Benefits` · `Services` (grid de `ServiceCard`) · `HowItWorks` (4 `StepCard`) · `Testimonials` · `FAQSection`.

**`features/quotation/components`:** `QuotationWidget` (Servicio → Plan → Calcular) · `QuotationResult` (`PriceCard` + botón WhatsApp).

**`features/leads/components`:** `LeadForm` (2 columnas desktop / 1 columna mobile, estados normal/focus/error/correcto/enviando/completado).

**`features/dashboard/components`:** `DashboardKpis` (fila de `KpiCard`) · `LeadsChart` (línea/barra/pastel vía Recharts) · `LeadsTable` · `LeadsFilters` · `LeadDetailPanel` · `LeadStatusTimeline` · `ExportButton` · `AdminLoginForm`.

Regla transversal: todo componente de `features/*` puede usar `components/ui` y `components/shared`, nunca al revés.

## 20. APIs (contrato completo)

Formato uniforme de respuesta (ya definido en la Parte A):
- Éxito: `{ "success": true, "message": string, "data": T }`
- Error: `{ "success": false, "message": string, "code": string }`

**Públicas (sin auth, protegidas por rate limit + honeypot):**

| Método | Ruta | Body / Query | Respuesta (`data`) |
|---|---|---|---|
| GET | `/api/services` | — | `Service[]` activos, ordenados por `displayOrder` |
| GET | `/api/plans?service={slug}` | query `service` | `Plan[]` activos del servicio |
| POST | `/api/quotation` | `{ serviceSlug, planId, city }` | `{ estimatedPrice, currency, plan, benefits }` |
| POST | `/api/leads` | `LeadForm` completo + `honeypot` + `consentAccepted:boolean` | `Lead` creado + `whatsappUrl` ya construido |

**Administrativas (protegidas por `middleware.ts`):**

| Método | Ruta | Body / Query | Respuesta |
|---|---|---|---|
| POST | `/api/admin/login` | `{ password }` | cookie firmada; `{ success:true }` |
| POST | `/api/admin/logout` | — | limpia cookie |
| GET | `/api/leads` | `?page&limit&status&service&city&search&sortBy&sortDir` | `{ items: Lead[], total, page, pageCount }` |
| GET | `/api/leads/:id` | — | `Lead` + `statusHistory[]` |
| PUT | `/api/leads/:id` | campos editables | `Lead` actualizado |
| PATCH | `/api/leads/:id/status` | `{ newStatus, comment? }` | `Lead` + nueva entrada de historial |
| DELETE | `/api/leads/:id` | — | soft delete, `204` |
| GET | `/api/leads/export/:format` | `format: csv\|xlsx` + mismos filtros que el listado | archivo descargable |
| GET | `/api/dashboard` | `?range=today\|week\|month` (opcional) | `{ totalLeads, today, week, month, topService, topCity, byStatus[] }` |

**Validaciones específicas por campo** (Zod, servidor — nunca solo cliente): `phone` solo dígitos 10-15 · `email` formato RFC · `serviceId`/`planId` deben existir y estar activos · `plan` debe pertenecer al `service` enviado · `estimatedPrice` **nunca** se acepta desde el body, siempre se recalcula en `QuotationService` a partir del `planId`.

**Códigos HTTP:** `200` consulta OK · `201` creado · `204` eliminado · `400` solicitud inválida · `401` no autenticado (admin) · `404` no encontrado · `409` conflicto (duplicado) · `422` validación fallida · `429` rate limit excedido · `500` error interno.

## 21. Flujo del Usuario (customer journey)

```
Google/Bing
   │  (búsqueda: "afiliación salud colombia")
   ▼
Landing (/)  ── < 10s para entender qué hace la empresa (Hero) ──
   │
   ▼
Beneficios ──► Servicios ──► "¿Cómo funciona?"
   │
   ▼
Cotizador: elige Servicio → Plan → Ciudad → Calcular
   │
   ├─(error de validación)──► mensaje inline, el usuario corrige y reintenta
   │
   ▼
Resultado de cotización (precio referencial + beneficios)
   │
   ▼
Formulario de contacto (nombre, teléfono, correo, ciudad, observaciones, ✔ consentimiento)
   │
   ├─(validación fallida)───► mensajes de error en tiempo real, no se envía
   ├─(duplicado detectado)──► aviso "ya recibimos tu solicitud, un asesor te contactará"
   │
   ▼
Lead guardado (POST /api/leads exitoso) → toast de confirmación
   │
   ▼
Redirección a WhatsApp (wa.me con mensaje prellenado)
   │            └─(sin WhatsApp instalado en desktop)──► fallback a web.whatsapp.com
   ▼
Asesor humano continúa la conversación y gestiona el Lead desde /admin
```

## 22. Flujo de Datos (por operación crítica)

**A. Alta de un Lead (write path):**
`LeadForm (RHF+Zod, validación cliente)` → `LeadService.create()` (cliente, `features/leads/services`) → `POST /api/leads` → `middleware` (rate limit + honeypot) → Route Handler → `Zod` (validación servidor, nunca confía en el cliente) → `server/services/LeadService` (sanitiza, verifica duplicado, resuelve `estimatedPrice` real desde `Plan`, arma el mensaje de WhatsApp) → `prisma.$transaction([crear Lead, crear LeadStatusHistory inicial])` → `LeadRepository` → PostgreSQL → respuesta uniforme → cliente actualiza UI (toast + `QuotationResult`) → `window.location` a la URL de WhatsApp.

**B. Dashboard (read path):**
Server Component de `/admin` (carga inicial, llama `DashboardService` directamente, sin HTTP) → hidrata cliente con `TanStack Query` apuntando a `GET /api/dashboard` para refrescos posteriores → `DashboardService` ejecuta `groupBy`/`count` vía `LeadRepository` → respuesta agregada → `KpiCard`/`LeadsChart` renderizan; **KPIs primero, gráficas después, tabla al final**, con `Skeleton` mientras cada bloque carga (según lo exige el SRS).

**C. Exportación:**
`LeadsFilters` (estado en URL/query params) → `ExportButton` → `GET /api/leads/export/:format?<mismos filtros que el listado>` → `ExportService` reutiliza el **mismo** método de filtrado de `LeadRepository` que usa el listado (garantiza que lo exportado sea exactamente lo filtrado) → genera CSV en streaming o buffer `.xlsx` (ExcelJS) → respuesta con `Content-Disposition: attachment`.

## 23. Diagrama de Responsabilidades

| Capa | Responsable de | Nunca debe |
|---|---|---|
| `app/(public)`, `app/admin` (páginas) | Componer secciones/features, layout, metadata | Contener lógica de negocio ni llamar Prisma |
| `features/*/components` | Presentación + estado de UI local | Hacer `fetch` directo ni acceder a Prisma |
| `features/*/services` (cliente) | Encapsular llamadas HTTP a `/api/*` | Contener reglas de negocio |
| `app/api/**/route.ts` | Parsear request, invocar un Service, formatear respuesta | Contener lógica de negocio ni acceder a Prisma directamente |
| `server/middleware` | Rate limiting, gate de admin, honeypot | Contener reglas de negocio del dominio |
| `server/services` | Toda la lógica de negocio (precios, duplicados, mensajes, agregaciones) | Conocer detalles de HTTP (`req`/`res`) ni SQL crudo |
| `server/repositories` | Único punto de acceso a Prisma | Contener validaciones o reglas de negocio |
| `server/validators` | Esquemas Zod del lado servidor | Contener lógica de negocio |
| `lib/*` | Configuración/infra (env, prisma client, respuestas uniformes) | Contener lógica de negocio |
| `prisma/schema.prisma` | Forma de los datos, constraints, índices | Contener lógica de aplicación |
| `constants/*` | Datos estáticos versionables (servicios, ciudades, mensajes, FAQ) | — (nunca quemar estos valores en componentes, regla explícita del SRS) |

Diagrama de capas (flujo permitido, de arriba hacia abajo, nunca al revés ni saltando capas):

```
┌───────────────────────────────┐
│  Pages (app/)                 │
├───────────────────────────────┤
│  Feature Components            │  ← usa ui/ y shared/
├───────────────────────────────┤
│  Feature Client Services       │  ← único que hace fetch
└──────────────┬─────────────────┘
               │ HTTP
┌──────────────▼─────────────────┐
│  Route Handlers (app/api)      │
├───────────────────────────────┤
│  Validators (Zod)              │
├───────────────────────────────┤
│  Server Services (negocio)     │
├───────────────────────────────┤
│  Repositories (Prisma)         │
├───────────────────────────────┤
│  PostgreSQL (Supabase)         │
└───────────────────────────────┘
```

---

## Preguntas pendientes para el cliente (no bloquean el inicio, pero sí ciertas fases)

- Colores corporativos, logo, testimonios y sellos/certificaciones reales (bloquea acabado visual de Fase 1).
- Número real de WhatsApp Business y plantilla final del mensaje.
- Precios/planes reales por servicio, o confirmación de que los del SRS son solo ejemplos (bloquea `constants/plans.ts`).
- Texto legal de política de privacidad y términos y condiciones (para el footer y el checkbox de consentimiento propuesto).
- Dominio definitivo para configurar en Vercel/DNS/SSL.

---

## Verificación

Este documento es 100% analítico — no hay código que ejecutar. La validación consiste en que el usuario revise y apruebe (o pida ajustes a):
- Parte A, secciones 6-11 (inconsistencias, mejoras de arquitectura, carpetas, stack, fases y orden de implementación).
- Parte B completa (secciones 14-23): arquitectura frontend/backend/BD, entidades, componentes, contrato de APIs y flujos.

Una vez aprobada la Parte B, el siguiente paso natural es iniciar la Fase 0 (scaffolding + `schema.prisma` real + migraciones + seed) descrita en la Parte A, sección 10-11.
