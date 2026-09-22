# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SolutaPLUS — Guía operativa para Claude Code

> **Contexto de esta carpeta (leer primero):** esta carpeta es una **copia**
> del proyecto original `landinsalud` (marca "IntegraSocial"), hecha para
> el proyecto de la universidad, que además integrará cosas con AppSheet.
> La marca aquí es **SolutaPLUS**. **Trabajar únicamente dentro de esta
> carpeta; nunca modificar, editar ni ejecutar nada sobre el proyecto
> original**, ni hacer push a su repo de GitHub
> (`JuanArguello26/landing-salud`). Todo lo que este documento cuenta de
> módulos, auditorías e iteraciones se heredó del original.
>
> ⚠️ **`.env` todavía apunta al MISMO Supabase del proyecto original**
> (ref `ujphuzgsrivdeskimmnb`). Mientras sea así, cualquier escritura
> (`prisma:migrate`, `prisma:seed`, enviar el formulario de leads, cambiar
> estados en el admin, scripts de verificación) modifica los datos del
> original. No escribir en la BD hasta que esta copia tenga su propio
> proyecto de Supabase.

## Proyecto final de la U — Sistemas Expertos (fuente: `Requisitos Proyecto Final.pdf`)

Objetivo del semestre: cumplir el 100 % de la rúbrica del PDF (AppSheet +
Google Sheets + n8n + Telegram + agente IA + PDF + dashboard + sistema
experto con ≥10 reglas SI-ENTONCES, ≥3 niveles, explicación trazable,
≥5 tablas, ≥3 roles). Lo que más pesa: base de conocimiento 0.8, motor de
inferencia 0.7, AppSheet 0.7.

**Decisiones tomadas por el usuario (2026-09-13), no volver a discutir:**

- **Dominio**: "Sistema experto para evaluación de solicitudes de afiliación
  a Seguridad Social". Niveles: Viable / Requiere revisión / Crítica-Bloqueada.
  Roles: Administrador, Asesor, Supervisor.
- **n8n Cloud** (HTTPS público, necesario para el webhook de Telegram).
- **Agente IA: Google Gemini** (nodo nativo de n8n).
- **Landing → Google Sheets vía webhook de n8n**. Esto desconecta la copia
  del Supabase del original; AppSheet reemplaza al panel admin web como
  interfaz principal. Hasta que ese módulo esté hecho, sigue vigente la
  advertencia de no escribir en la BD.
- **Base de conocimiento configurable**: reglas, condiciones, acciones y
  parámetros viven como filas en Sheets (editables por el Administrador en
  AppSheet), no escritas a mano en el código. El motor es genérico y lee
  esas tablas.
- **Parámetros normativos** (salario mínimo, % de IBC, topes, tarifas): se
  verifican en fuentes oficiales y se marcan con su fuente/vigencia. Si
  algo no se puede verificar, queda "por validar", sin inventarlo.

Roadmap (un módulo a la vez, con auditoría al terminar cada uno):
7 Base de conocimiento + modelo de datos (.xlsx para Sheets) →
8 Motor de inferencia + explicación (JS puro con tests, reutilizado en el
nodo Code de n8n) → 9 AppSheet (guía + expresiones) → 10 Workflows n8n →
11 Telegram + agente Gemini → 12 PDF + dashboard → 13 Guion de sustentación.

Límites: AppSheet no tiene API para crear apps (se entrega `.xlsx` + guía
paso a paso). Las cuentas (Google, n8n, @BotFather) y las API keys las crea
el usuario; nunca introducir credenciales.

### Módulo 7 — Base de conocimiento ✅ (hecho + auditado, 2026-09-13)

- Fuente única en `sistema-experto/base-conocimiento/`: `esquema.ts` (20
  tablas, enums, contrato del motor), `reglas.ts` (27 hechos, 12 parámetros,
  29 reglas anidadas → se aplanan a Reglas/Condiciones_Regla/Acciones_Regla),
  `semilla.ts` (catálogos + 7 casos demo ficticios con `esperado`),
  `validacion.ts` (integridad estructural + semántica de la base).
- `npm run sistema-experto:generar` valida y escribe
  `sistema-experto/salida/SolutaPLUS_BaseDatos.xlsx` +
  `docs/proyecto-final/modelo-datos.md` y `catalogo-reglas.md` (generados,
  en `.prettierignore`; nunca editarlos a mano). Resumen humano en
  `docs/proyecto-final/README.md`.
- Tests: `tests/unit/base-conocimiento.test.ts` (integridad, mínimos de la
  rúbrica y que el validador detecte cada tipo de error).
- **Contrato del motor** (asumido por las reglas; implementado y
  verificado en el Módulo 8, incluidos los `esperado.reglas` de los casos
  demo):
  encadenamiento hacia adelante por `Prioridad` ascendente, cada regla una
  vez; comparar contra hecho vacío = falso (salvo NO_EXISTE); aplicar
  `Valor_Por_Defecto` de Hechos a entradas vacías (`autoriza_datos`→NO,
  `costos_deducibles`→0); normalizar Yes/No de Sheets (TRUE/FALSE) a SI/NO;
  incrementar `num_reglas_criticas`/`num_reglas_advertencia` al disparar;
  renderizar la explicación de una regla **antes** de sumar su propio
  impacto al contador (si no, R25 diría una crítica de más); nivel final =
  Crítica si hubo alguna crítica, Requiere revisión si hubo advertencia,
  si no Viable. Los `esperado.reglas` de los casos demo se calcularon a
  mano: el Módulo 8 debe confirmarlos con tests (y corregir el caso, no
  forzar el motor, si el error está en la expectativa).
- Solo `estado_sugerido` lo escriben las reglas de Consolidación (R25-R29);
  las críticas (R01, R02) no asignan estado a propósito, para que una
  regla posterior no lo pise.
- Respaldo normativo verificado en fuentes oficiales/concordantes (UGPP
  ABC contratistas 2026, Decreto 1469/2025 SMMLV $1.750.905, Decreto
  1772/1994, Decreto 768/2022). R04/R05 (Decreto 0379/2026) y R12 quedan
  "Por validar". Nada depende de la reforma pensional (Ley 2381/2024, en
  disputa). No se modelaron pensionados ni régimen subsidiado (no
  verificados): no agregarlos sin fuente.
- `npm run format:check` ya fallaba en 24 archivos heredados del proyecto
  original (tablas Markdown sin alinear, etc.); no es del Módulo 7.

### Módulo 8 — Motor de inferencia ✅ (hecho + auditado, 2026-09-13)

- `sistema-experto/motor/motor.ts` implementa el contrato de arriba:
  `compilarBase` → `evaluar` (o `evaluarSolicitud`, que además arma los
  hechos con `hechosDesdeTablas`) → `filasResultado` (filas para
  Evaluaciones/Reglas_Activadas) y `resumenTexto` (Telegram, PDF, IA).
- **El motor NO puede tener imports en tiempo de ejecución** (solo
  `import type`), ni usar Node, Intl o `instanceof Date`:
  `scripts/motor-n8n.ts` lo transpila con `ts.transpileModule` a
  `sistema-experto/salida/motor-n8n.js` (global `SolutaPLUSMotor`) para
  el nodo Code de n8n. Un test lo ejecuta en un `vm` aislado y exige el
  mismo resultado que el motor original.
- El contrato (`HECHOS_DEL_MOTOR`, `FORMATOS_PLANTILLA`, `SEPARADOR_LISTA`)
  se movió de `esquema.ts` al motor, y `validacion.ts` usa su analizador
  de expresiones y plantillas: lo que se valida es lo que se ejecuta.
- **Fechas en "hora de pared":** los Date y los textos sin zona de las
  tablas son hora local de la hoja; `ahora` (Date real) se convierte con
  `zonaHorariaMinutos` (por defecto −300, Colombia). Si
  `Fecha_Ultima_Gestion` no se puede leer (ej. "13/09/2026"), queda
  aviso en `errores` en vez de fallar en silencio.
- **Robustez:** una regla mal configurada se descarta con aviso; un error
  de cálculo deja sin efecto solo esa regla (sus acciones se ejecutan
  sobre una copia de los hechos).
- **No hay redondeo PILA:** los aportes son exactos y `filasResultado`
  redondea al peso. No implementar el redondeo oficial sin verificar su
  norma.
- `npm run sistema-experto:generar` también escribe `motor-n8n.js` y
  `docs/proyecto-final/evaluaciones-demo.md` (salida real del motor con
  fecha fija, marcada ✅/❌ contra el resultado esperado).
- Tests: `tests/unit/motor.test.ts`; helper compartido `conCambio` en
  `tests/unit/utilidades/semilla.ts`.

### Preparación para AppSheet (2026-09-13)

- **Equipo (3 integrantes, un rol cada uno):** Juan Argüello = ADMIN
  (dueño de la hoja y de la app), Brayan Alexander Osorio Morales =
  SUPERVISOR, Brandon José Guerrero Rey = ASESOR. Los correos de Brayan y
  Brandon están pendientes: mientras tanto se usan alias `+supervisor` /
  `+asesor` del correo de Juan (sirven para "preview as" en AppSheet).
- **Datos personales fuera del repo (es público):** las cuentas reales
  viven en `sistema-experto/usuarios.local.json` (gitignored; plantilla en
  `usuarios.example.json`). `semilla.ts` solo tiene usuarios `@example.com`.
  `SolutaPLUS_BaseDatos.xlsx` también está gitignored porque se genera con
  esas cuentas. Nunca escribir correos o nombres del equipo en archivos
  versionados.
- `scripts/preparar-datos.ts`: `conEvaluacionesDemo` agrega al `.xlsx` la
  salida real del motor (Evaluaciones, Reglas_Activadas, Estado,
  Nivel_Resultado e Historial_Estados) con origen "Carga inicial (demo)";
  `conUsuariosLocales` aplica el JSON local (Zod) y asigna las solicitudes
  al primer asesor activo. Tests en `tests/unit/preparar-datos.test.ts`.

### Módulo 9 — AppSheet ✅ (hecho + auditado, 2026-09-22)

- **App creada**: "SolutaPLUS Sistema Experto", appId
  `e0049feb-5216-49ed-a27d-98f7f66d4f41`, en la cuenta de Google del
  administrador (la del `usuarios.local.json`; el repo es público, no
  escribir el correo aquí).
  Fuente: la Hoja de Google `1O2zZNprQexe7myH7oqBAufvWNw9ze0LV4Ke2EGD7G0U`
  (conversión del .xlsx). Las 20 tablas están cargadas y guardadas.
- ⚠️ **El .xlsx subido a Drive quedó renombrado a
  `NO_USAR_original_SolutaPLUS.xlsx`**: en el primer intento AppSheet se
  conectó a él en vez de a la Hoja (n8n no puede leer .xlsx), hubo que
  borrar la app y rehacerla. Conectar SIEMPRE la Hoja, no el Excel.
- **Refs: completos** (verificados tras recargar el editor). Solicitudes →
  Solicitantes / Servicios / Planes / Usuarios (Asesor) /
  Actividades_Economicas; Usuarios → Roles; Evaluaciones → Solicitudes;
  Reglas_Activadas → Evaluaciones y Reglas; Condiciones_Regla y
  Acciones_Regla → Reglas (*is a part of*) y Hechos; Documentos_Solicitud →
  Solicitudes (*part of*) y Documentos_Requeridos; Historial_Estados →
  Solicitudes (*part of*) y Usuarios; Actividades_Economicas →
  Clases_Riesgo; Plan_Servicios → Planes (*part of*) y Servicios;
  Notificaciones → Solicitudes.
- **Tipos mal detectados por AppSheet, ya corregidos** (revisar esto
  siempre que se recargue el esquema): `Reglas.ID_Regla`,
  `Condiciones_Regla.ID_Regla` y `Acciones_Regla.ID_Regla` llegaron como
  **`Price`** (los mostraba como "$R01"); `Usuarios.Nombre` llegó como
  `Ref`; `Solicitantes.Numero_Documento` y `Telefono` como `Number`.
- **Enums: las 27 columnas cargadas con sus valores exactos de
  `esquema.ts`** (Estado, Nivel_Resultado, Tipo_Vinculacion, Operador,
  Tipo de acción, Categoría, Nivel_Impacto, Estado_Verificacion, Ciudad,
  etc.), verificadas reabriendo cada columna.
- **Seguridad por rol** (Table settings → Security):
  - `Solicitudes`, *Security filter*:
    `AND(LOOKUP(USEREMAIL(),"Usuarios","Correo","Estado")="Activo",
    OR(IN(LOOKUP(USEREMAIL(),"Usuarios","Correo","ID_Rol"),
    LIST("ADMIN","SUPERVISOR")), [Asesor]=USEREMAIL()))`.
    Probado con *Preview app as*: el asesor ve las suyas y el usuario
    `+inactivo` **no ve ninguna**.
  - Base de conocimiento (`Reglas`, `Condiciones_Regla`, `Acciones_Regla`,
    `Hechos`, `Parametros`) y `Usuarios`, *Are updates allowed?*:
    `IF(LOOKUP(USEREMAIL(),"Usuarios","Correo","ID_Rol")="ADMIN",
    "ALL_CHANGES","READ_ONLY")` → solo el Administrador edita las reglas.
  - **No poner un Security filter en `Usuarios`**: se consultaría a sí
    misma con LOOKUP (circular). El control de esa tabla es por permiso de
    edición, no por filtro de filas.
  - AppSheet avisa que los filtros de seguridad **desactivan "Quick sync"**.
    Es informativo y esperado, no un error que haya que arreglar.
- **Vistas creadas**: `Solicitudes` (tabla, primaria, agrupada por
  `Nivel_Resultado`), `Base de conocimiento` (tabla de Reglas), y el
  `Tablero` (dashboard) con 3 gráficas: *Solicitudes por nivel*,
  *Solicitudes por estado* y *Reglas activadas por impacto* (esta última
  quedó en posición `menu`, ver más abajo).
- **Trazabilidad (probada en la app real, no solo en el emulador):**
  `Solicitudes` → SOL-0001 → `Related Evaluaciones` → EVA-0001 →
  `Related Reglas_Activadas` muestra las 7 reglas en orden de disparo con
  su explicación y su impacto (R03 → R06 → R08 → R13 → R17 → R18 → R27).
  Para lograrlo se ajustaron las vistas *inline* que genera AppSheet:
  - `Solicitudes_Detail`: *Header columns* = `Nivel_Resultado` y `Estado`.
  - `Evaluaciones_Inline`: tipo **deck**, primary `Nivel_Resultado`,
    secondary `Estado_Sugerido`, summary `Total_Aportes_Cliente` (en vez de
    una tabla con las 21 columnas).
  - `Reglas_Activadas_Inline`: tipo **deck**, primary `ID_Regla`,
    secondary `Explicacion_Generada`, summary `Nivel_Impacto`, ordenada por
    `Orden_Disparo`.
  - ⚠️ **El botón *Expand* de una lista relacionada abre la vista de
    referencia (`ref`) de esa tabla.** Como la gráfica *Reglas activadas por
    impacto* era la única vista `ref` de `Reglas_Activadas`, *Expand* abría
    la gráfica en vez de la lista. Se pasó la gráfica a posición `menu` y
    el *Expand* volvió a la lista. Si se crea una gráfica de referencia
    sobre una tabla que también se expande, dejarla en `menu`.
- **Más tipos corregidos** (AppSheet vuelve a equivocarse en cada recarga
  del esquema): `Solicitudes.Ingreso_Mensual` y `Costos_Deducibles`, y en
  `Evaluaciones` `IBC`, `Aporte_Salud`, `Aporte_Pension`, `Aporte_ARL` y
  `Total_Aportes_Cliente` debían ser **`Price`** (llegaron como `Number`);
  `Explicacion_IA` y `Hechos_Finales_JSON` debían ser **`LongText`**
  (llegaron como `Text` y `File`).
- **Validaciones del formulario de Solicitudes** (Data → columna → *Data
  Validity* / *Auto Compute*), alineadas con las reglas del motor:
  - `Ingreso_Mensual`: *Require?* `[Tipo_Vinculacion] <> "Empleador"`;
    *Valid If* `OR(ISBLANK([Ingreso_Mensual]), [Ingreso_Mensual] > 0)`.
  - `Duracion_Contrato_Dias`: *Require?* `[Tipo_Vinculacion] =
    "Contratista"` (regla R16); *Valid If* `> 0`.
  - `Numero_Trabajadores`: *Require?* `[Tipo_Vinculacion] = "Empleador"`;
    *Valid If* `>= 1`.
  - `Costos_Deducibles`: *Valid If* no negativo y menor que el ingreso.
  - `Estado`: *Initial value* `"Nueva"`. `Fecha_Creacion` y
    `Fecha_Ultima_Gestion` ya traían `NOW()` de fábrica.
- **Acción de cambio de estado** (Behavior → Actions, tabla Solicitudes),
  en tres piezas porque el orden importa:
  1. `Registrar cambio de estado` (*add a new row to another table*) →
     `Historial_Estados`: `ID_Historial = UNIQUEID()`, `ID_Solicitud`,
     `Estado_Anterior = [Estado]` (se lee **antes** de cambiarlo),
     `Estado_Nuevo = "Aprobada"`, `Usuario = USEREMAIL()`, `Fecha = NOW()`,
     `Comentario`. Position `Hide`.
  2. `Marcar aprobada` (*set the values of some columns*): `Estado =
     "Aprobada"`, `Fecha_Ultima_Gestion = NOW()`. Position `Hide`.
  3. `Aprobar solicitud` (*Grouped*): ejecuta 1 y luego 2. Condición
     `AND([Estado] <> "Aprobada", IN(LOOKUP(USEREMAIL(),"Usuarios",
     "Correo","ID_Rol"), LIST("ADMIN","SUPERVISOR")))`.
  **Probado en la app real** con SOL-0002: pasó de "En revisión" a
  "Aprobada" y se creó la fila de historial con usuario, fecha y ambos
  estados. Para otros estados (Bloqueada, En revisión…) se duplican las
  piezas 1 y 2 cambiando el literal.
- ⚠️ **Las descripciones de columna se ven feas en la app**: el `.xlsx` se
  generaba con notas en la fila de encabezado (`cabecera.note` en
  `scripts/generar.ts`) y al convertirlo a Hoja de Google se volvieron
  *comentarios con hilo*; AppSheet los toma como Description y en los
  formularios sale "[Threaded comment] Your version of Excel…". Pendiente:
  quitar esas notas del generador y limpiar la Description de las columnas
  visibles.
- **Cómo automatizar el editor de AppSheet (aprendido a la mala):**
  - El **selector de archivos de Drive va en un iframe**: no se puede
    escribir ni desplazar desde la automatización (llegó a congelar el
    renderer). Esa selección la hace el usuario a mano.
  - El complemento de Sheets (**Extensiones → AppSheet → Crear una
    aplicación**) aparece **deshabilitado**; no sirve como atajo.
  - **Agregar tablas**: botón `+` junto a "Data" → el diálogo "Add data"
    sugiere chips *Add Table 'X' from …* (no vuelve a pedir el archivo) →
    clic en el chip → botón **Add to app**. Localizar el chip con `find`,
    no por coordenadas: el diálogo reflowea.
  - **Cambiar el tipo de una columna**: clic en el `select` de TYPE (es
    nativo) → tecla `r` + Enter = `Ref` → aparece el panel con **Source
    table** (otro select nativo: se escribe el nombre completo + Enter) →
    botón **Done** arriba a la derecha. Verificar con screenshot: si el
    panel no alcanzó a abrir, las teclas caen en la página y cambian el
    tipo de otra columna (pasó: dejó una columna en `Price`).
  - Esperar ~5 s tras abrir una tabla antes de tocar sus columnas, y
    guardar con **SAVE** (arriba a la derecha) después de cada bloque.
  - La extensión de Chrome se desconecta de vez en cuando a mitad de un
    lote: esperar unos segundos, tomar screenshot y retomar desde donde
    quedó (no repetir el lote a ciegas).
  - **`form_input` sobre el `select` de TYPE es mucho más confiable que
    teclear** (`r` + Enter). Con `find` se obtiene el `ref` del combobox y
    se le pasa el valor exacto (`Ref`, `Enum`, `EnumList`, `LongText`…);
    luego `find` devuelve **Source table**, **Is a part of?** y **Done**.
  - **La grilla de columnas está virtualizada** (`ReactVirtualized__Grid`):
    las columnas que no se ven **no existen en el DOM**. En tablas grandes
    (Solicitudes tiene 22) hay que desplazar el contenedor hasta que la
    fila aparezca; si no, la automatización cree que la columna no existe.
  - **Navegar entre tablas**: basta con `location.hash =
    "#Data.Columns.<Tabla>"`; la app reacciona sin recargar.
  - ⚠️ **La pestaña tiene que estar visible.** Si `document.hidden` es
    `true` (otra pestaña al frente o ventana minimizada), Chrome frena los
    temporizadores y el editor **pierde los cambios en silencio**: al
    escribir varios valores de un Enum, su *debounce* los agrupa y **solo
    guarda el último** (la lista queda vacía salvo el último valor).
    Comprobarlo con `document.hidden` + un `setInterval` de prueba antes de
    automatizar. Si no se puede traer la pestaña al frente, hay que dejar
    **~4 s entre valor y valor** y **verificar reabriendo la columna**
    después de escribirla; sin esa verificación el log miente.
  - Los valores de un Enum se escriben en la lista **Values** (botón `Add`
    por cada valor). Nada de `eval`/atajos: poner el valor, `blur`, esperar
    y releer.
#### Auditoría del Módulo 9 (2026-09-22)

Se comparó la app contra `esquema.ts` de forma automática (un script
temporal volcó tabla→columna→tipo y se cruzó con lo que reporta el editor).
Hallazgos y correcciones aplicadas:

1. **Clave primaria equivocada en `Reglas`** (lo más grave): AppSheet la
   había puesto en `Nombre` porque `ID_Regla` llegó como `Price`; al
   corregir el tipo, la clave se quedó donde estaba. Todas las referencias
   a reglas colgaban del nombre y no del código. Corregido: `ID_Regla` es
   la clave y `Nombre` queda como *label* (efecto lateral bueno: las
   listas de reglas activadas ahora muestran "Cálculo del IBC" en vez de
   "R08"). Las otras 19 tablas tenían su clave correcta.
2. **11 tipos que no coincidían con el esquema**, corregidos:
   `Servicios.Descripcion`, `Planes.Ideal_Para`,
   `Documentos_Requeridos.Fuente`, `Historial_Estados.Comentario`,
   `Hechos.Descripcion`, `Acciones_Regla.Valor` y
   `Reglas_Activadas.Hechos_Usados` → `LongText`;
   `Solicitantes.Nombre_Completo` → `Name`;
   `Solicitudes.Firma_Solicitante` → `Signature`;
   `Documentos_Solicitud.Archivo` → `File`; y
   **`Hechos.Valor_Por_Defecto`, que estaba como `Yes/No`** cuando el motor
   guarda ahí texto (`NO`, `0`) → `Text`.
3. **Vistas `Roles` y `Usuarios` visibles para todos**: se les puso
   *Show if* `LOOKUP(USEREMAIL(),"Usuarios","Correo","ID_Rol") = "ADMIN"`.
   Verificado con *Preview app as* `+asesor`: solo ve Solicitudes, Base de
   conocimiento y Tablero, y la base de conocimiento le sale **sin botones
   de agregar/editar/borrar**.
4. **El ícono de "errores" de la barra superior era del estado sin
   guardar**: tras guardar queda solo el ✓. No confundirlo con un error
   real de la app.

Verificado además en la app publicada: cadena Solicitud → Evaluación →
Reglas activadas intacta después del cambio de clave, y el Tablero carga
sus 3 gráficas.

- **Estado al cerrar la sesión (2026-09-22):** todo guardado y verificado
  tras recargar el editor. Los avisos ⚠ del panel Data ya están resueltos.

Landing page + panel administrativo para una empresa colombiana de afiliación a
Salud, Pensión, ARL y Seguridad Social. Objetivo: captar leads desde Google,
cotizar en línea y redirigir a WhatsApp Business para el cierre comercial.

## Documentos fuente (no modificar, son el contrato del proyecto)

- `SRS (Software Requirements Specification).docx` — especificación funcional
  y técnica original del cliente.
- `Guía Operativa para Claude Code.docx` — "prompt maestro", guía de proceso.
- **`C:\Users\PC\.claude\plans\vamos-a-desarrollar-un-smooth-dijkstra.md`** —
  documento de arquitectura aprobado (Parte A: plan estratégico, riesgos,
  stack, fases; Parte B: arquitectura detallada — frontend, backend, BD,
  entidades, APIs, componentes, flujos). **Esta es la fuente de verdad
  arquitectónica.** Ante cualquier duda de diseño, revisar ahí primero.
  Existe una copia versionada dentro del repo en `docs/architecture.md`
  (úsala si la ruta de `~/.claude/plans` no existe en otra máquina). Ese
  documento es el plan *original*: ante contradicción con este CLAUDE.md,
  gana CLAUDE.md (estado real).

## Referencia rápida

### Comandos

```bash
npm run dev            # Next dev (Turbopack), http://localhost:3000 — admin en /admin/login
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint (flat config)
npm run format:check   # Prettier sin escribir (npm run format escribe)
npm test               # Vitest, solo tests/unit/**/*.test.ts
npm run build          # build de producción (con NODE_ENV=production exige env reales, ver guardas en lib/env.ts)
```

- Un solo archivo de test: `npx vitest run tests/unit/lead-schema.test.ts`
- Un solo caso por nombre: `npx vitest run -t "texto del it()"`
- `vitest.config.mts` carga `.env` (`dotenv/config`); los tests de services
  mockean repositorios con `vi.mock`, no tocan Supabase.
- Prisma: el cliente se genera en `generated/prisma` (gitignored, lo
  regenera `postinstall` o `npm run prisma:generate`) y se importa como
  `@/generated/prisma/client`, **no** `@prisma/client`. Tras cambiar
  `prisma/schema.prisma`: `npm run prisma:migrate` (usa `DIRECT_URL` vía
  `prisma.config.ts`). Modelos: `Service`, `Plan`, `Lead`,
  `LeadStatusHistory`, enum `LeadStatus`.

### Mapa de arquitectura

- **Rutas**: `app/(public)/` (landing + 3 páginas legales, estáticas),
  `app/admin/login` y `app/admin/(panel)/` (dashboard, leads, detalle),
  `app/api/*` (services, plans, quotation, leads, leads/export,
  leads/[id], dashboard, admin/login|logout).
- **Flujo de una petición API**: Route Handler delgado →
  `enforceRateLimit` (`server/middleware/rate-limit.ts`, en endpoints
  públicos) → validación Zod (`server/validators/`) → Service
  (`server/services/`) → Repository (`server/repositories/`, único acceso
  a Prisma) → `ok()`/`handleError()` de `lib/api-response.ts`.
- **Protección del admin**: `middleware.ts` cubre `/admin/*`,
  `/api/admin/*`, `/api/leads/*` y `/api/dashboard/*`, verificando la
  cookie HMAC de `lib/admin-auth.ts`. Excepciones públicas: `/admin/login`,
  `/api/admin/login|logout` y **`POST /api/leads`** (el formulario público).
  Cualquier endpoint nuevo bajo esos prefijos queda protegido por defecto;
  si debe ser público hay que añadirlo explícitamente ahí.
- **Frontend**: `components/ui` (primitivas del design system),
  `components/shared` y `components/layout` (composición), `features/*`
  (hooks/schemas/servicios cliente por dominio; `features/landing` es la
  única capa que compone varios features), `constants/` (contenido
  estático de la landing), `lib/` (infraestructura transversal).

## Reglas de trabajo obligatorias (dadas explícitamente por el usuario)

1. **Nunca implementar dos módulos al mismo tiempo.**
2. **Antes de empezar cada módulo**, explicar qué se va a construir (y si hay
   una mejor solución que la literal del SRS, explicarla antes de
   implementar).
3. **Al terminar cada módulo**, hacer una auditoría técnica completa
   cubriendo: arquitectura, duplicidad, SOLID, DRY, rendimiento,
   accesibilidad, SEO, seguridad, deuda técnica, código muerto, componentes
   innecesarios, oportunidades de simplificación.
4. **Corregir automáticamente** todo lo que la auditoría encuentre (sin
   pedir permiso para cada fix menor).
5. **No avanzar al siguiente módulo** hasta que el actual esté
   completamente funcional (verificado con pruebas reales, no solo
   build/typecheck).
6. **Mantener estrictamente la arquitectura aprobada** — cualquier
   desviación se explica y se documenta (ver "Decisiones de arquitectura"
   abajo).
7. Para cambios de frontend: **siempre probar en el navegador** antes de
   dar por terminado (no solo confiar en el build).
8. Para cambios de backend/API: probar contra la base de datos real
   (Supabase), no solo mocks.

## Estado actual — progreso por módulo

| Módulo | Fase | Contenido | Estado |
|---|---|---|---|
| 1 | Fase 0 — Fundamentos | Scaffolding Next.js 15, Prisma schema, migraciones, seed, tooling | ✅ Hecho + auditado |
| 2 | Fase 1 — Design System + Landing estática | Tokens, `components/ui` básicos, Navbar/Footer, secciones de landing con contenido de ejemplo | ✅ Hecho + auditado |
| 3 | Fase 2 — Backend y datos | APIs `/api/services`, `/api/plans`, `/api/quotation`, `/api/leads`; servicios, repositorios, rate limiting, sanitización | ✅ Hecho + auditado |
| 4 | Fase 3 — Integración | Cotizador y formulario de leads conectados a las APIs reales, redirección real a WhatsApp | ✅ Hecho + auditado |
| 5 | Fase 4 — Panel Administrativo | Gate de acceso, dashboard KPIs, gestión de leads (listar/filtrar/buscar/paginar/cambiar estado), exportación CSV/Excel | ✅ Hecho + auditado |
| 6 | Fase 5 — SEO, performance, hardening, deploy | sitemap/robots/JSON-LD, OG image dinámica, headers de seguridad, logging estructurado, documentación final | ✅ Hecho + auditado |

Todos los módulos del roadmap aprobado (1-6) están construidos. El
**despliegue real** (git init, repo remoto, Vercel, dominio) sigue
pendiente — es una decisión y acción manual del usuario, ver
"Antes de desplegar a producción" en `README.md`.

Cada módulo entregado (1-5) pasó por su auditoría de las 11 categorías
inmediatamente después de construirse, con correcciones aplicadas y
verificadas en vivo (no solo build). No repetir esas auditorías salvo que se
detecte algo nuevo relacionado.

### Iteración visual post-roadmap (landing pública)

Después de cerrar el Módulo 6, el usuario pidió varias rondas de
refinamiento visual sobre la landing (no forman parte del roadmap de fases,
son iteración directa de diseño). Todo probado en vivo en desktop/tablet/
mobile, `typecheck`/`lint`/`test`/`build` en verde en cada ronda:

- **Hero con imagen real**: `features/landing/components/Hero.tsx` usa
  `next/image` con la foto en `public/images/hero-family.jpg`. Esa imagen
  se generó recortando (con `sharp`) solo la mitad derecha de
  `images/heroimg1.png` (la referencia de diseño que dio el usuario) — el
  original trae un mockup completo con texto incrustado en los píxeles del
  lado izquierdo que **no debe usarse** (el texto/CTAs reales son HTML). Si
  se necesita re-recortar, `images/heroimg1.png` sigue en la raíz (fuera de
  `public/`, no se sirve al navegador).
- **Separador curvo + solape de imagen** entre Hero y Beneficios (SVG puro
  en `Hero.tsx`, sin JS): la imagen tiene `lg:-mb-10` + `z-10` para
  solaparse visualmente con la curva sin invadir la sección siguiente
  (verificado por medición: `imgBottom < benefitsTop` siempre).
- **Paleta de acentos por categoría**: además de `--primary` (azul) y
  `--secondary` (verde), hay `--accent-amber` y `--accent-violet` en
  `app/globals.css`. `constants/service-colors.ts` y
  `constants/step-colors.ts` asignan un acento fijo por slug/número
  (Salud=azul, Pensión=ámbar, ARL=violeta, Seguridad Social=verde) — mismo
  patrón para reusar en cualquier tarjeta futura que necesite diferenciarse
  por categoría, en vez de inventar colores sueltos.
- **`components/ui/Card.tsx` tiene una prop `bg`** (default `"bg-white"`)
  para poder cambiar el fondo de una card de forma confiable. No pasar un
  `bg-*` por `className`: como `Card` ya trae `bg-white` fijo en su string
  de clases, dos utilidades `bg-*` en conflicto no tienen un ganador
  predecible en Tailwind (el orden de cascada no sigue el orden en el
  string de clases).
- **`components/shared/SectionHeading.tsx`** (eyebrow + título + subtítulo
  opcional) y **`FadeInStagger`/`FadeInStaggerItem`** (en
  `components/shared/FadeIn.tsx`) reemplazan el bloque de encabezado
  duplicado y el `FadeIn` simple en Beneficios/Servicios/Proceso/
  Testimonios — las tarjetas ahora aparecen escalonadas al hacer scroll,
  no todas de golpe.
- **Flechas conectoras entre pasos** en "¿Cómo funciona?" (solo `lg:`):
  posicionadas con un offset fijo en píxeles anclado al padding interno de
  la tarjeta (no proporcional al ancho), por eso la alineación se mantiene
  igual en cualquier breakpoint ≥1024px — verificado en 1024/1112/1440px.
- **`components/layout/FAQFloatingButton.tsx`**: botón flotante estilo
  robot (ícono `Bot` de lucide, no relacionado con WhatsApp) abajo a la
  izquierda que abre un panel con las preguntas frecuentes (reusa
  `FAQItem`); la sección completa de FAQ en la página se mantiene intacta,
  el botón es un acceso rápido adicional.
- **`components/shared/WhatsAppIcon.tsx`**: SVG inline del logo real de
  WhatsApp — Lucide no trae logos de marca, `MessageCircle` (el ícono
  genérico que se usó al principio) se veía como un logo incompleto.
- **Navbar**: ya no tiene el botón "WhatsApp" a la derecha; el menú
  (Inicio/Servicios/Beneficios/FAQ/Contacto) se movió a ese extremo.
- **`next.config.ts`**: `devIndicators.position: "top-right"` — el
  indicador de dev de Next.js (el logo "N") por defecto sale abajo a la
  izquierda, encima del `FAQFloatingButton`.

### Sección "Ubicación" (mapa)

- **`features/landing/components/Location.tsx`**: entre Testimonios y FAQ.
  Hace `return null` si `NEXT_PUBLIC_ADDRESS` o `NEXT_PUBLIC_MAPS_EMBED_URL`
  no están seteadas — no inventa datos falsos (mismo criterio que ya tenía
  `lib/json-ld.ts`). Variables nuevas en `lib/public-env.ts`/`.env.example`:
  `NEXT_PUBLIC_ADDRESS`, `NEXT_PUBLIC_ADDRESS_CITY` (solo para
  `addressLocality` en JSON-LD), `NEXT_PUBLIC_MAPS_EMBED_URL` (URL de
  Google Maps "Compartir → Insertar un mapa", va al `src` del iframe),
  `NEXT_PUBLIC_MAPS_URL` (link normal, botón "Cómo llegar" + Footer). Ya
  están completas en `.env` real con la dirección de Pereira.
- **`next.config.ts`**: el CSP necesitó `frame-src 'self' https://www.google.com`
  (no existía la directiva, heredaba `default-src 'self'` y bloqueaba el
  iframe en silencio). `frame-ancestors 'none'` es una directiva distinta
  (anti-clickjacking de *este* sitio) y no tiene relación.
- **`lib/json-ld.ts`**: `address` ahora completa `streetAddress`/
  `addressLocality` condicionalmente desde las env vars de arriba.
- Fondo con dos manchas de color (`blur-3xl`, estáticas) + un pequeño
  `animate-ping` en el ícono `MapPin` (estilo "punto de ubicación en
  vivo") — únicos elementos animados de la sección, respetan
  `motion-reduce`.

### Mascota de marca "Foxy"

- **Solo se usa `foxy2.png`** (la pose con el clipboard "Salud/Pensión/
  ARL") — se probó con las 3 poses originales y con tamaños/posiciones
  distintos por sección, pero el usuario pidió simplificar a una sola
  pose repetida como firma de marca consistente. `components/shared/
  Mascot.tsx` ya **no tiene prop `pose`** (se quitó esa indirección al
  quedar un solo asset) y `constants/mascot.ts` exporta un único
  `FOXY_MASCOT` (`src`, `width`, `height` reales del asset ya recortado).
- Asset servido: `public/images/foxy-2.png` (PNG con canal alfa real,
  fondo removido — verificado componiéndolo sobre un color sólido de
  prueba). Generado desde `images/foxy2.png` (que sigue en la raíz, sin
  tocar) con `sharp().trim().resize({width:560})`, sin recorte extra
  porque el personaje ya toca los bordes del encuadre en varias zonas.
  Si se regenera el asset, **volver a leer el ancho/alto real que
  imprime el script** — no asumir que sigue siendo 560×1003.
- **Apariciones actuales: Hero, Servicios y "¿Cómo funciona?"** — mismo
  tamaño (128px) y mismo estilo de posición (badge `absolute`, esquina,
  `hidden lg:block`, `z-index` explícito). **NO aparece en el Cotizador**
  ni ocultando ninguna imagen — se probó ahí dos veces (encima de la
  tarjeta del formulario, luego encima de la foto) y en ambos casos
  tapaba algo (texto o la foto), así que se descartó por decisión
  explícita del usuario en vez de forzar un hueco que no existía.
- **Lección de espacio**: antes de anclar un badge decorativo cerca de
  contenido real, medir el hueco disponible con `getBoundingClientRect()`
  en vivo — "se ve que hay espacio" a simple vista no es suficiente
  (pasó varias veces que un badge que cabía en una pose/tamaño dejaba de
  caber al cambiar el aspect ratio de la imagen).

### Título del Hero con efecto "máquina de escribir"

- **`components/shared/TypewriterText.tsx`** (Client Component aislado,
  el resto del Hero sigue siendo Server Component): revela
  "Protege lo que más importa" letra por letra (~55ms/char, ~1.4s total)
  y al terminar aparece un ícono `Heart` (lucide) en rojo con fade.
- El `<h1>` en `Hero.tsx` lleva `aria-label` con el texto completo
  (siempre, desde el primer render) y el contenido animado va
  `aria-hidden` — un lector de pantalla nunca espera a la animación.
  `min-h-[2lh]` en el `<h1>` reserva el alto de 2 líneas desde el inicio
  para no generar layout shift mientras el texto crece.
  `prefers-reduced-motion` muestra el texto completo + corazón de
  inmediato, sin animar. Keyframe del cursor (`caret-blink`, parpadeo
  binario) en `app/globals.css`.
- Es un tradeoff consciente de LCP (el H1 es el candidato a LCP de la
  página): se aceptó explícitamente porque es corto (~1.4s) y fue un
  pedido directo del usuario, no una decisión unilateral.

### Rebranding a "IntegraSocial" + sección "Planes"

- **El nombre de marca es 100% env-driven**: `NEXT_PUBLIC_COMPANY_NAME`
  (`lib/public-env.ts`) alimenta Navbar, Footer, `app/layout.tsx`
  (title/OG/Twitter) y `lib/json-ld.ts`. El rebranding de "Landing Salud" a
  "IntegraSocial" fue solo cambiar el valor en `.env` — cero cambios de
  código para el texto de la marca. **En esta copia el valor es
  `SolutaPLUS`.** Al hacer ese cambio se encontraron 3 textos que tenían
  "IntegraSocial" escrito a mano (`constants/pricing-plans.ts`,
  `constants/steps.ts`, título de `Benefits.tsx`); ahora también leen
  `publicEnv`. No volver a escribir el nombre de marca literal en código.
- **Logo real**: `images/logointegrasalud.jpeg` (fuente, sin tocar) es un
  escudo azul/verde con familia + cruz de salud, más el wordmark
  "IntegraSocial" debajo. Se decidió **no** usar el logo completo como una
  sola imagen en el Navbar (perdería el texto real de accesibilidad/SEO);
  en su lugar, `public/images/logo-icon.png` es solo el escudo (recortado
  del logo original localizando por análisis de píxeles la fila de
  transición entre el gráfico y el wordmark — no una coordenada fija a
  ojo, para que sea reproducible si el logo cambia), usado como ícono de
  32px junto al texto real en `Navbar.tsx`.
- **Favicon** (`app/favicon.ico`) generado del mismo recorte del escudo, en
  3 tamaños (16/32/48) empaquetados a mano en un `.ico` multi-resolución
  (header + directorio + PNGs, formato válido desde Windows Vista — sin
  librería nueva). **Gotcha real que costó una vuelta**: el optimizador de
  imágenes de Next.js (`next/image`, usado internamente para el ícono de
  metadata) exige que cada PNG embebido en el `.ico` sea **RGBA**; un PNG
  sin canal alfa explícito (`sharp` sin `.ensureAlpha()`) rompe el build en
  dev con "The PNG is not in RGBA format!" sin afectar el favicon estático
  servido directamente — solo se ve el error en los logs del dev server.
  Cualquier regeneración futura del favicon debe forzar `.ensureAlpha()` +
  `.png({force: true})` antes de meterlo en el `.ico`.
- **Sección "Planes" (`features/landing/components/Plans.tsx`, entre
  Servicios y "¿Cómo funciona?")**: es **puramente estática/informativa**,
  con contenido en `constants/pricing-plans.ts` y tarjetas en
  `components/shared/PriceCard.tsx` (el único componente que la
  arquitectura original ya tenía inventariado en la sección 19 del
  documento de arquitectura y nunca se había construido). **No está
  conectada a la base de datos ni al cotizador real** — los 3 "planes"
  (Básico, Integral, Empresarial) agrupan varios `Service` a la vez bajo
  un paquete comercial con precio no fijo ("costo de ley + tarifa
  administrativa", sin cifra porque el cliente aún no la define), mientras
  que el modelo `Plan` de Prisma pertenece a un único `Service` y ya
  alimenta `/api/quotation` de verdad. **Una futura sesión no debe intentar
  "conectar" esta sección al cotizador sin repensar el modelo de datos** —
  son dos conceptos distintos a propósito. El CTA de cada `PriceCard` abre
  WhatsApp directo (`buildWhatsAppLink()`) con un mensaje distinto por
  plan, no pasa por el flujo de leads.
- **Copy de Beneficios y "¿Cómo funciona?"** actualizado con palabras clave
  SEO locales (Pereira/Eje Cafetero) provistas por el cliente en
  `Contexto título, palabrs claves y planes.docx` (nombre real del archivo,
  con el typo "palabrs"). En Beneficios se mantuvo el mapeo ícono↔tarjeta
  original (pedido explícito del cliente); en "¿Cómo funciona?" se
  reasignaron los mismos 4 íconos a los nuevos textos por afinidad
  semántica (sin agregar íconos nuevos).
- `app/layout.tsx` (`keywords`) y `lib/json-ld.ts` (`description`) también
  se ampliaron con esas palabras clave locales/de intención/generales.

### Documentos legales (Ley 1581/2012)

- **Fuente**: `DOCUMENTO_BASE_LEGAL_INTEGRASOCIAL.docx` en la raíz (ojo: es
  `.docx`, aunque el usuario lo llamó `.doc`). Trae los 3 documentos, el
  texto de autorización del formulario y el aviso legal del footer.
- **`lib/legal.ts`** concentra el contenido de los 3 documentos como datos
  estructurados (`LegalSection[]` con bloques `text`/`subheading`/`list`/
  `note`), no como JSX. Vive en `lib/` y no en `constants/` por el mismo
  motivo que `lib/json-ld.ts`: **construye el texto desde las env vars**
  (nombre, correo, WhatsApp, ciudad), así que cambiar un dato de contacto
  no obliga a editar tres documentos a mano. `LEGAL_DOCUMENTS` es la
  lista única de documentos y **alimenta a la vez** el Footer, los enlaces
  cruzados entre documentos y `app/sitemap.ts` — agregar un documento
  legal nuevo no requiere acordarse de tocar el sitemap.
- **`components/shared/LegalDocument.tsx`** renderiza cualquiera de los 3
  (encabezado + versión/vigencia + secciones + navegación cruzada). Las
  3 páginas son de ~15 líneas cada una y salen **estáticas** en el build
  (`○`, 0 B de JS propio).
- **El contenido se ajustó a lo que el código realmente hace**, no a lo
  que el documento base asumía. Verificado con grep/en vivo:
  - **No hay Google Analytics, Google Ads ni Meta Pixel.**
    `NEXT_PUBLIC_GA_ID`/`NEXT_PUBLIC_META_PIXEL_ID` existen en el esquema
    de `lib/env.ts` pero **ningún componente las lee** (cero `gtag`,
    `googletagmanager`, `fbq` en todo el repo). El documento base los
    mencionaba en condicional ("podrá utilizar"), así que la política los
    declara como *no activos* y condiciona su activación futura a
    actualizar la política y pedir consentimiento previo.
  - **Única cookie propia**: la de sesión del admin (`httpOnly`, 8 h),
    que solo se crea al iniciar sesión en `/admin`; nunca para visitantes.
    Es estrictamente necesaria → exenta de consentimiento.
  - **Sin `localStorage`/`sessionStorage`** en ningún componente.
  - **Único tercero que carga en el navegador**: el iframe de Google Maps
    de la sección Ubicación (declarado explícitamente en la Política de
    Cookies). Las fuentes (`next/font/google`) se auto-hospedan en build,
    no hay petición a Google en runtime.
- **Por eso NO se implementó banner de cookies**: no se instala ninguna
  cookie no esencial para el visitante. Un banner que declarara cookies
  analíticas sería una afirmación falsa. **Si algún día se activa GA/Ads/
  Pixel, el banner pasa a ser obligatorio** y hay que actualizar la
  Política de Cookies y la sección 14 de la de Privacidad.
- **El dominio no aparece en ningún documento**: se habla de "esta Landing
  Page" a propósito, porque aún no está definido. No inventar una URL.
- **`lib/phone.ts`** (`toInternationalPhone` / `formatPhoneForDisplay`)
  centraliza el indicativo `+57`, que antes estaba duplicado en el Footer
  y en `lib/json-ld.ts` y habría quedado triplicado con los documentos
  legales. `NEXT_PUBLIC_PHONE` se guarda **sin** indicativo.
- **Consentimiento**: la casilla del `LeadForm` ya existía y ya era
  obligatoria (`.refine()` en `lead.schema.ts` + `consentAcceptedAt` en
  BD como evidencia); lo que se cambió fue el **texto**, que ahora enuncia
  la finalidad concreta y cita la Ley 1581 (una autorización debe ser
  *informada*, no un "acepto los términos" genérico). El cotizador **no
  pide ni guarda datos personales** (solo servicio/plan/ciudad, y
  `QuotationService` no escribe en BD), por eso no lleva consentimiento
  — no agregar uno ahí "por si acaso".
- **Transmisión internacional declarada como hecho**: la BD está en
  `sa-east-1` (São Paulo, Brasil), así que la Política de Privacidad lo
  afirma —no lo insinúa— y lo califica como *transmisión* internacional a
  un encargado (Decreto 1377), no como *transferencia*. `DATABASE_LOCATION`
  en `lib/legal.ts` es la fuente única de ese dato: **si se migra la región
  de Supabase hay que actualizarlo**.
- **`BUSINESS_HOURS`** (en `lib/legal.ts`) es la fuente única del horario;
  lo consumen los documentos legales y el Footer. La ciudad sale de
  `NEXT_PUBLIC_ADDRESS_CITY` y solo se le concatena ", Colombia" — **no
  hardcodear el departamento**, se rompía si la ciudad cambiaba.

#### Pendientes legales (no bloquean el desarrollo, no inventar)

1. **Razón social y NIT** — hoy solo se declara "Nombre comercial". No hay
   ninguna afirmación de razón social ni NIT en los documentos.
2. **Dominio definitivo** → `NEXT_PUBLIC_SITE_URL`. Los documentos dicen
   "esta Landing Page" a propósito.
3. **Dirección para efectos legales** — el documento base solo da ciudad.
4. **Soporte documental de la transmisión internacional a Brasil**
   (contrato de transmisión / DPA con el proveedor). El documento declara
   el hecho pero **no afirma que exista contrato**: verificarlo antes de
   producción.
5. **Upstash**: `enforceRateLimit` se invoca en `/api/leads`,
   `/api/quotation` y `/api/admin/login`, y usa la **IP** como clave. Hoy
   las variables están vacías → `checkRateLimit` retorna `success` sin
   tocar la IP, por eso los documentos **no** declaran a Upstash como
   encargado (sería falso). **Si se activa Upstash en producción**, un
   tercero pasará a recibir IPs —incluidas las de quien solo usa el
   cotizador— y habrá que declararlo en la Política de Privacidad como
   encargado, con su finalidad y su transmisión internacional.
6. **Responsable operativo de solicitudes de titulares**: `/api/leads/[id]`
   **solo implementa GET** (el borrado se descopó en el Módulo 5), así que
   ejecutar una supresión o revocación hoy exige tocar la BD a mano. Los
   documentos no prometen autoservicio, pero alguien debe hacerse cargo
   del procedimiento por correo.
7. **Verificar si aplica registro en el RNBD** ante la SIC.
8. **Estatus regulatorio**: se eliminó a propósito la frase "no es una EPS,
   un fondo de pensiones ni una ARL" (Términos y Footer) porque no está
   sustentada en el documento base. **No reintroducirla** sin documento del
   cliente que la acredite.
9. **Google Maps se contacta durante la carga inicial**, pese al
   `loading="lazy"`. Medido con `performance.getEntriesByType('resource')`
   en pestañas limpias de Chrome/Brave: la petición a `www.google.com/maps`
   (`initiatorType=iframe`) aparece a ~540 ms, con `scrollY=0` y el iframe
   a ~3.700 px por debajo del pliegue. **La herramienta de red del panel da
   falsos negativos** (solo captura desde que se la invoca); usar la API
   `performance` para medir esto. Los documentos legales están redactados
   en consecuencia: dicen que el momento de la petición lo decide el
   navegador y **puede** ocurrir en la carga inicial. **No escribir que el
   mapa "no se carga al abrir la página": es falso.** Si se quiere evitar
   de verdad ese contacto, la única vía es la carga bajo clic (opción B),
   que hoy está descartada por decisión explícita del usuario.

### Correcciones de la auditoría integral (fase post-legal)

Tras la auditoría integral read-only se aplicaron estas correcciones. Lo
importante para una sesión futura es **por qué** están así:

- **Precios: `NEXT_PUBLIC_PRICES_CONFIRMED`** (en `lib/public-env.ts`,
  default `false`). Los precios de `prisma/seed.ts` son **datos de
  ejemplo**. Mientras la bandera sea `false`, el cotizador funciona
  completo (servicio → plan → ciudad → lead → WhatsApp) pero **no muestra
  la cifra** ni la incluye en el mensaje de WhatsApp; el lead **sí** guarda
  `estimatedPrice` en BD para el asesor. Al recibir las tarifas reales:
  cargarlas en la BD y poner la bandera en `"true"`. **No publicar los
  precios del seed como si fueran comerciales.**
- **Copy del paso 3** (`constants/steps.ts`) ya no dice "cotización exacta
  … sin costos ocultos" sino "estimación orientativa … un asesor valida el
  valor final". El SRS (línea 435) exige justamente esa aclaración.
- **Testimonios: `constants/testimonials.ts` está VACÍO a propósito.**
  `Testimonials.tsx` hace `return null` con array vacío, igual que
  `Location.tsx`. Publicar reseñas inventadas sería publicidad engañosa
  (Ley 1480 de 2011). **No rellenar con ejemplos**: al llegar testimonios
  reales basta con poblar el array.
- **Servicios: fuente única.** `constants/services.ts` es la definición
  canónica y `prisma/seed.ts` la **importa** para poblar la tabla
  `Service`. Antes había dos listas que podían divergir en silencio. La
  landing sigue renderizando desde la constante a propósito: mantiene la
  home **estática** y no la tumba una pausa de Supabase (ya ocurrió). Los
  `benefits` de la constante son solo para las tarjetas — el modelo
  `Service` de Prisma no tiene ese campo.
- **Validación de texto obligatorio** (`server/validators/lead.schema.ts`):
  el helper `requiredText()` corre `.max()` sobre el valor crudo y la
  comprobación de "no vacío" **después** de sanear. Antes `.min(1)` iba
  sobre el crudo y `"   "` pasaba, quedando el nombre/ciudad en `""`.
  **No reordenar**: hay tests de regresión en `tests/unit/lead-schema.test.ts`.
- **JSON inválido → 400 `INVALID_JSON`** (centralizado en `handleError`,
  `lib/api-response.ts`). Antes era 500 y ensuciaba el log de errores
  internos.
- **Guardas de producción** en `lib/env.ts`: con `NODE_ENV=production` la
  app **no arranca** si `ADMIN_PASSWORD`/`ADMIN_SESSION_SECRET` conservan
  valores de ejemplo o si `NEXT_PUBLIC_SITE_URL` apunta a localhost. Los
  mensajes nombran la variable pero **nunca imprimen su valor**. Para
  compilar en local con `NODE_ENV=production` mientras no existan
  credenciales reales: `ALLOW_INSECURE_ENV=true npm run build`. **Esa
  variable jamás debe definirse en un despliegue real.**
- **Contraste**: el crédito del footer pasó de `text-gray-400` a
  `text-gray-500` (2.49:1 → sobre 4.5:1, WCAG AA que el SRS exige).

#### Rate limiting (Upstash) — estado real

`server/middleware/rate-limit.ts` **ya está implementado y no necesita
cambios**. `enforceRateLimit(request, key)` se invoca en `/api/leads`
(POST), `/api/quotation` y `/api/admin/login`, y usa la IP como clave.

- Variables necesarias: `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
- Con ambas configuradas: ventana deslizante de **10 peticiones / 60 s por
  IP**, y respuesta `429` al excederla (el SRS pide exactamente eso).
- **Hoy están vacías** → `checkRateLimit` devuelve `success` sin tocar la
  IP y loguea una advertencia una sola vez. Es decir: **el rate limiting
  está inactivo y los endpoints públicos no tienen protección contra
  inundación.**
- No se implementó un limitador en memoria como sustituto: en serverless
  cada invocación tiene su propio proceso, así que no limitaría nada real
  y daría una falsa sensación de cumplimiento.
- **Al activarlo**: Upstash pasa a recibir IPs (incluidas las de quien solo
  usa el cotizador) y hay que declararlo como encargado del tratamiento en
  la Política de Privacidad. Mientras esté inactivo **no debe aparecer** en
  los documentos legales.

#### E2E (Playwright) — bloqueado a propósito

El plan aprobado contemplaba Playwright para el camino feliz, pero **no se
instaló**, por decisión razonada y no por olvido:

- El camino feliz **termina escribiendo un lead real** en la base de datos.
- El proyecto **no tiene base de datos de test ni entorno de staging**:
  `.env` apunta al mismo Supabase que se usa para desarrollo, y el seed
  escribe sobre él.
- Un E2E sin aislamiento contaminaría los mismos datos que esta auditoría
  acaba de limpiar (había quedado un "Prueba Auditoria QA").

Para desbloquearlo hace falta primero **una BD de test** (otro proyecto de
Supabase o Postgres local) y un `.env.test`. Mientras tanto la lógica
crítica está cubierta por tests unitarios con mocks
(`tests/unit/lead-service.test.ts`).

#### Oportunidad de rendimiento (no ejecutada)

`components/shared/FadeIn.tsx` usa Framer Motion para los fades de todas
las secciones. `app/globals.css` ya tiene `animate-fade-in-up`, que hace lo
mismo sin JS. Migrarlo quitaría la mayor dependencia de la landing (First
Load JS de `/`: **270 kB**). **No es un defecto** y no se tocó a propósito:
es una mejora futura que exige re-verificar las animaciones sección por
sección.

### Pendientes comerciales (bloquean producción, no son deuda técnica)

**No inventarlos bajo ninguna circunstancia.**

1. **Precios definitivos** → del cliente. Cargar en BD y poner
   `NEXT_PUBLIC_PRICES_CONFIRMED="true"`.
2. **Testimonios reales** → del cliente, con su autorización para publicar
   nombre y ciudad. Poblar `constants/testimonials.ts`.
3. **Dominio definitivo** → fijar `NEXT_PUBLIC_SITE_URL` (la guarda de
   producción ya impide desplegar con localhost).
4. **Razón social y NIT**, dirección para efectos legales y verificación
   del RNBD → ver "Pendientes legales" arriba.

## Stack técnico real (tal como quedó instalado, no solo lo "aprobado" en el plan)

- **Next.js 15.5.23** (App Router, Turbopack) + **React 19.1.0** + TypeScript
  strict + TailwindCSS 4.
- **Prisma 7.9.1** — ⚠️ versión reciente con cambios de arquitectura
  importantes respecto a Prisma 5/6 (ver más abajo).
- PostgreSQL vía **Supabase** (proyecto `landing-salud`, región `sa-east-1`
  São Paulo). Credenciales reales ya están en `.env` (gitignored).
- React Hook Form + Zod (`@hookform/resolvers`) — **un solo schema Zod
  compartido entre cliente y servidor** (ver `server/validators/`).
- TanStack Query (`@tanstack/react-query`) para estado de servidor en el
  cliente.
- Framer Motion (animaciones puntuales, respeta `prefers-reduced-motion`).
- Upstash Redis (`@upstash/ratelimit`, `@upstash/redis`) para rate
  limiting — **no configurado todavía** (variables vacías en `.env`); el
  middleware hace *no-op* seguro y loguea una advertencia una vez.
- Vitest + `vite-tsconfig-paths` nativo (`resolve.tsconfigPaths: true`) para
  tests unitarios (`tests/unit/`).
- ESLint (flat config) + Prettier (con `prettier-plugin-tailwindcss`).

Comandos: ver "Referencia rápida" al inicio de este archivo.

**Repositorio git de esta copia: `https://github.com/JuanArguello26/solutaplus`**
(rama `main`, **público**), creado el 2026-09-13 a pedido del usuario. El
repo `JuanArguello26/landing-salud` es del **proyecto original**: nunca
hacer push ahí. Commit/push solo cuando el usuario lo pida. `.env` y
`DOCUMENTO_BASE_LEGAL_INTEGRASOCIAL.docx` están en `.gitignore`; al ser
público, nunca versionar credenciales. `.gitattributes` fuerza LF.

## Decisiones de arquitectura que se desviaron del SRS/plan original (y por qué)

Estas ya están decididas y verificadas — no volver a discutirlas salvo que
el usuario pida cambiarlas:

1. **Prisma 7 usa driver adapters, no el cliente clásico.** El schema ya no
   lleva `url` en el bloque `datasource`; `lib/prisma.ts` instancia
   `PrismaClient` con `@prisma/adapter-pg` (`PrismaPg`) usando
   `DATABASE_URL`. La URL para migraciones vive en `prisma.config.ts`
   (usa `DIRECT_URL`).
2. **`DIRECT_URL` en realidad usa el "Session pooler" de Supabase, no la
   conexión directa real.** La conexión directa de Supabase es IPv6-only por
   defecto y falla en redes IPv4-only; el Session pooler (puerto 5432, mismo
   host `*.pooler.supabase.com`) se comporta como directa pero es compatible
   con IPv4.
3. **`lib/env.ts` vs `lib/public-env.ts`**: `env.ts` valida *todas* las
   variables (incluidas secretas) y solo debe importarse desde código
   server-only. `public-env.ts` valida solo las `NEXT_PUBLIC_*` y es seguro
   de importar desde Client Components. Nunca importar `lib/env.ts` desde un
   archivo `"use client"`.
4. **`lib/whatsapp.ts` y `lib/currency.ts`**, no `features/whatsapp/utils` ni
   una carpeta `utils/` separada. Se consolidaron ahí las funciones puras
   transversales (generador de enlaces/mensajes de WhatsApp, formato de
   moneda). `features/whatsapp/hooks` sigue reservado para un futuro hook de
   cliente si hace falta.
5. **`CatalogService`** (no cada servicio por separado) posee
   `resolveServiceBySlug()` y `resolvePlanForService()` — `QuotationService`
   y `LeadService` los reutilizan en vez de duplicar la validación
   "servicio existe + plan pertenece al servicio".
6. **Los features nunca se importan entre sí directamente.**
   `features/quotation` no debe importar `features/leads` (ni viceversa). La
   orquestación de flujos que cruzan varios features (ej. cotizador →
   formulario de lead) vive en `features/landing`, que sí puede componer
   varios features (es la capa de ensamblaje de página).
7. **Honeypot anti-spam se llama `website`, no `honeypot`** (los bots
   sofisticados evitan campos con nombres reveladores). Campo oculto vía
   CSS + `tabIndex={-1}` + `aria-hidden`, con `autoComplete="off"`.
8. **El flujo de cotización es de dos pasos**, no un formulario único: 1)
   Cotizador (`POST /api/quotation`, sin datos personales) → 2) Formulario
   de contacto (`POST /api/leads`, ya con el precio calculado) → redirección
   a WhatsApp con el `whatsappUrl` que devuelve la API. Esto reduce fricción
   (el usuario ve un precio antes de dar sus datos).
9. **Sin autenticación real en el MVP del panel admin** (aprobado en el
   plan): gate por contraseña compartida (`ADMIN_PASSWORD`) + cookie firmada
   HMAC vía `middleware.ts` (Módulo 5). La firma/verificación vive en
   `lib/admin-auth.ts` usando **Web Crypto (`crypto.subtle`)**, no una
   librería como `jose`: es nativa tanto en el runtime Edge del middleware
   como en Node, y lee `process.env` directamente (no `lib/env.ts`) para no
   arrastrar la validación de variables no relacionadas (DB, etc.) al bundle
   de Edge. El logout solo borra la cookie en el navegador — el token no
   tiene revocación server-side, sigue siendo válido hasta su expiración
   (8h) si alguien lo reenvía manualmente; limitación aceptada de un gate
   MVP sin modelo de usuarios.
10. **Sin edición ni borrado de leads en el panel admin (Módulo 5)**: la
    arquitectura aprobada (sección 20 del plan) lista `PUT`/`DELETE
    /api/leads/:id`, pero se acotó el alcance a listar/filtrar/buscar/
    paginar/cambiar estado + exportar, que es lo que de verdad necesita un
    asesor gestionando leads. Fácil de añadir después si se pide.

## Riesgos/limitaciones aceptadas y documentadas (no son bugs pendientes)

- **`npm audit`**: 3 vulnerabilidades "high" en `postcss`/`sharp`
  (dependencias transitivas de `next@15.5.23`). El único fix salta a Next 16,
  lo que rompería el stack aprobado. Riesgo bajo en la práctica (no
  procesamos CSS/imágenes de usuarios no confiables). Revisar en Fase 5.
- **Condición de carrera en detección de duplicados de leads**
  (`server/services/LeadService.ts`, comentado en el código): dos envíos
  casi simultáneos (doble clic) podrían crear 2 leads. Arreglarlo bien
  requiere *locking* a nivel de BD — se aceptó como limitación conocida
  porque el SRS lo pide como "recomendado", no como invariante estricta.
- **`loading.tsx` (Suspense fallback) rompe el panel admin en dev con
  Turbopack**: confirmado en el Módulo 5 — con un `loading.tsx` presente en
  una ruta de Server Component, si el fetch resuelve muy rápido (típico en
  local), Next.js 15.5.23 + Turbopack nunca ejecuta el script de "reveal"
  (`$RC`) que reemplaza el fallback por el contenido real; la página queda
  congelada mostrando solo el fallback (o en blanco), con el contenido real
  atrapado en un `<div id="S:n" style="display:none">` de streaming.
  Reproducido incluso con un `loading.tsx` trivial de una sola línea, en
  tab nuevo y servidor recién reiniciado — no es causado por componentes
  propios. **No usar `loading.tsx` en `app/admin/**` (ni en general) hasta
  confirmar que este bug esté resuelto en una versión más nueva de
  Next/Turbopack.** El build de producción sí compila limpio; el bug es
  específico del dev server.
- **Animar `height: 0 → auto` no funciona en este entorno, ni con Framer
  Motion ni con CSS puro**: se probó primero `motion.div` con
  `animate={{height:"auto"}}` (quedaba en `height:0px` aunque
  `aria-expanded` fuera `true`) y después la técnica CSS
  `grid-template-rows: 0fr → 1fr` (documentada como robusta en general, y
  aun así falló igual — incluso forzando el estilo con `!important` vía
  JS). No se encontró la causa raíz. **Para cualquier acordeón/colapsable
  nuevo, usar render condicional simple (`{isOpen && <p>...}`) con
  `animate-fade-in-up` en el contenido revelado**, como quedó en
  `components/shared/FAQItem.tsx` — funciona de forma confiable, solo se
  pierde la animación de alto.

## Convenciones establecidas

- **Contrato de API uniforme**: `lib/api-response.ts` (`ok()`/`fail()`/
  `handleError()`) + `server/errors/AppError.ts` en el servidor;
  `lib/api-client.ts` (`apiRequest()`/`apiPost()`) en el cliente — ambos
  espejo uno del otro.
- **Capas backend estrictas**: Route Handler (delgado) → Service (lógica de
  negocio) → Repository (único acceso a Prisma). Nunca saltarse capas.
- **Server Components por defecto**; `"use client"` solo donde hay estado o
  interactividad real (formularios, menú móvil, acordeón FAQ, animaciones).
- **Schemas Zod compartidos cliente/servidor**: `server/validators/*.schema.ts`
  exporta un schema "base" (reglas de cada campo) separado del schema
  completo (con `.refine()`), para que el cliente pueda derivar un
  subconjunto (`.omit()`) sin duplicar reglas de validación. Ver
  `features/leads/schemas/lead-form.schema.ts` como ejemplo.
- **RHF + Zod con transforms**: cuando el schema tiene `.transform()`, usar
  `useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>` para
  que los tipos de entrada/salida no choquen.
- **Precios**: siempre `Decimal` de Prisma convertido explícitamente con
  `Number(...)` antes de responder en la API (nunca confiar en el precio
  que mande el cliente).
- **Tokens de diseño** en `app/globals.css` (`--primary`, `--secondary`,
  etc.) — nunca colores hardcodeados tipo `blue-600` en componentes.
- **`.gitkeep`** en carpetas de la estructura aprobada que aún no tienen
  contenido (ej. `features/dashboard/*`, `hooks/`) — se eliminan cuando se
  agrega el primer archivo real de esa carpeta.

## Notas operativas del entorno (para no perder tiempo repitiendo errores ya resueltos)

- **Windows + Git Bash**, proyecto dentro de una carpeta OneDrive: a veces
  OneDrive bloquea archivos momentáneamente (`EBUSY`) justo después de
  escribir — reintentar tras `rm -rf .next` suele resolverlo.
- **`curl.exe` en Git Bash corrompe tildes/ñ** al pasar argumentos con
  acentos (bug de la capa MSYS↔Windows, no de la app). Para probar
  endpoints con texto en español, usar un script Node con `fetch()` nativo
  (`node script.mjs`), nunca `curl` con acentos inline.
- **Docker Desktop no pudo levantar el daemon** en esta máquina (se probó en
  el Módulo 1) — por eso se usa Supabase real para todo, incluyendo
  desarrollo local. No reintentar Docker salvo que el usuario lo pida.
- **El panel de navegador del sandbox (`mcp__Claude_Browser__*`) no
  compone frames en esta sesión** ("Browser pane is not displayed"). Esto
  no es solo cosmético — afecta cualquier cosa ligada al pipeline de
  render/compositing del navegador, confirmado en 3 casos concretos
  distintos: (1) `<img loading="lazy">` nativo nunca dispara la carga
  (hay que forzar `img.loading = 'eager'` vía JS para poder verificar que
  una imagen carga bien), (2) los timers de reintento de TanStack Query
  (`setInterval`/`setTimeout` internos) no avanzan a su ritmo normal —
  llegan a tardar >10x más de lo esperado en resolver, (3)
  `getComputedStyle(el).opacity` puede quedar congelado en un valor
  viejo (ej. `0`) aunque la clase CSS correcta ya esté aplicada y la
  regla exista sin conflictos — hasta forzar `opacity` inline con
  `!important` fue ignorado. **Para verificar UI**: `get_page_text`,
  `read_page` (árbol de accesibilidad) y `javascript_tool` (DOM, clases
  CSS aplicadas, `getBoundingClientRect()` para overlaps/overflow) siguen
  siendo confiables para estructura/posición/funcionalidad. Pero para
  **confirmar visualmente algo que depende de opacity/transiciones/
  timers** (fades, animaciones, contenido que carga con delay), no
  confiar en este panel — usar **Claude in Chrome**
  (`mcp__claude-in-chrome__*`, navegador real del usuario) y tomar un
  screenshot real. Ya se usó así con éxito para confirmar el efecto de
  escritura + corazón del H1.
- **Scripts temporales de verificación** (`_verify*.ts`, `_test*.mjs`,
  `_cleanup.ts`) van en la raíz del proyecto (para heredar `node_modules` y
  paths), se ejecutan con `npx tsx` o `node`, y **siempre se borran** al
  terminar junto con los datos de prueba que hayan creado en Supabase.
- `.claude/launch.json` ya está configurado para `preview_start` con el
  nombre `"solutaplus"` (`npm run dev`, puerto 3000).
- **El servidor de preview se cae entre turnos** (normal, no es un bug):
  antes de navegar, verificar con un `fetch` rápido a `/api/services`; si
  falla, `preview_start` de nuevo y esperar ~4s antes de navegar.
- **Si `/api/services` o `/api/quotation` devuelven 500 con un error tipo
  `(ENOTFOUND) tenant/user ... not found`**: no asumir que el proyecto de
  Supabase está pausado sin comprobarlo — ya pasó una vez que era solo un
  blip transitorio del pooler (Supavisor) con el proyecto realmente
  "Healthy" (0% CPU/RAM). Para comprobar el estado real: pedirle al
  usuario que inicie sesión en el dashboard de Supabase, y revisar con
  **Claude in Chrome** (no el panel sandbox — requiere su sesión logueada
  real) en `https://supabase.com/dashboard/project/<ref>` — el `<ref>` es
  el subdominio en `DATABASE_URL` (ej. `ujphuzgsrivdeskimmnb`). Un
  proyecto pausado muestra explícitamente "Project is paused" en la
  tarjeta del proyecto; si no dice eso, está activo y el 500 es
  transitorio — simplemente reintentar.

## Próximo paso

**Módulo 10 — Workflows en n8n.** El Módulo 9 (AppSheet) quedó hecho y
auditado: detalle en su sección al inicio de este archivo.

Antes de arrancar, dos cosas menores que quedaron del Módulo 9:

- Las Description de las columnas salen con basura ("[Threaded comment]
  Your version of Excel…") heredada de las notas del `.xlsx`. Quitar
  `cabecera.note` de `scripts/generar.ts` y limpiar las columnas visibles.
- `SOL-0002` quedó en estado "Aprobada" por la prueba real de la acción de
  cambio de estado (con su registro en `Historial_Estados`). Si se quiere
  volver al estado de demostración, cambiarla a "En revisión".

La landing (Módulos 1-6) está completa. Su despliegue es una acción
manual del usuario (checklist en `README.md`) y no debe iniciarse sin que
lo pida explícitamente.
