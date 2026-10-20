# Módulo 10 — Flujos de n8n

Dos flujos listos para importar en n8n Cloud. Se generan con
`npm run sistema-experto:generar` en `sistema-experto/salida/n8n/` (no editar a
mano: cambiar `sistema-experto/scripts/flujos-n8n.ts`).

| Archivo                  | Webhook (POST)        | Qué hace                                                                                                                       |
| ------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `evaluar-solicitud.json` | `/solutaplus-evaluar` | Lee la base de conocimiento y las tablas de operación, ejecuta el motor, guarda Evaluaciones, Reglas_Activadas y el historial. |
| `landing-a-sheets.json`  | `/solutaplus-landing` | Radica el formulario de la landing como Solicitante + Solicitud (estado «Nueva», origen «Landing»).                            |

## Cómo se prueba sin n8n

`tests/unit/flujos-n8n.test.ts` ejecuta el código real de los nodos Code (el
motor incluido) con una simulación de `$()`: los 7 casos demo producen las
reglas y el nivel esperados, la numeración (`EVA-`, `SOL-`, `CLI-`) continúa
la de la hoja, y la landing rechaza solicitudes sin consentimiento.

## Puesta en marcha (la hace el usuario)

1. En n8n Cloud: **Workflows → Import from file**, uno por archivo.
2. Crear dos credenciales y enlazarlas en los nodos:
   - **Google Sheets OAuth2** (cuenta dueña de la Hoja `SolutaPLUS_BaseDatos`) en
     todos los nodos de Google Sheets.
   - **Header Auth** (nombre y valor de cabecera a elección, p. ej.
     `X-SolutaPLUS-Key`) en el nodo Webhook de cada flujo.
3. Activar los flujos y copiar la URL de **producción** de cada Webhook.
4. Las credenciales y claves nunca se escriben en el repo ni en el JSON.

## Conexión con AppSheet (bot «Evaluar solicitud»)

Bot nuevo en AppSheet: evento _Adds_ sobre `Solicitudes`; paso **Call a webhook**
con la URL de `/solutaplus-evaluar`, la cabecera de la credencial Header Auth y
el cuerpo `{"idSolicitud": "<<[ID_Solicitud]>>", "origen": "AppSheet"}`.

## Decisiones de diseño

- **El estado solo cambia si la solicitud está «Nueva» o «En evaluación»**: una
  solicitud ya gestionada por una persona recibe el nuevo `Nivel_Resultado`
  pero conserva su estado. Si el estado cambia, se agrega una fila a
  `Historial_Estados` (usuario vacío = sistema).
- **`Fecha_Ultima_Gestion` no se toca**: evaluar no cuenta como gestión humana
  y reiniciaría el escalamiento por tiempo.
- **Landing → solo radica**: el formulario no captura tipo de vinculación ni
  ingresos, así que la solicitud queda «Nueva» sin evaluar. El agente de
  Telegram/Gemini (Módulo 11) completa esos datos desde `Descripcion_Libre`.

## Sin verificar (requiere una ejecución real en n8n)

- Formato en que el nodo de Google Sheets devuelve las fechas: si
  `Fecha_Ultima_Gestion` no se puede leer, el motor lo avisa en `errores`
  (respuesta del webhook) y no evalúa el escalamiento por tiempo. Si pasa,
  activar en los nodos de lectura _Output Formatting_ con fechas sin formato.
- Que Google Sheets guarde como fecha (y no como texto) los ISO que agrega
  el flujo, y que AppSheet las lea bien.
- Cableado de la landing: `POST /api/leads` aún escribe en Prisma. Falta
  decidir con el usuario el reemplazo por una llamada al webhook de landing
  (variable de entorno con la URL y la clave).
