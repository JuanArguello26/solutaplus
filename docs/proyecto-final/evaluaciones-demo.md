# Evaluaciones de los casos de demostración

> Generado por `npm run sistema-experto:generar`. No editar a mano.

Salida real del motor (`sistema-experto/motor/motor.ts`) sobre los datos semilla, evaluados el 2026-09-13 12:00:00 (hora de Colombia). Es la misma explicación que n8n guarda en las tablas Evaluaciones y Reglas_Activadas.

## SOL-0001 · Laura Restrepo

_Contratista · Plan Integral — «Soy contadora independiente, firmé un contrato de prestación de servicios por 10 meses y me pagan 5 millones al mes.»_

**Clasificación: Viable** · Estado sugerido: Aprobada · 7 reglas activadas (0 críticas, 0 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R03 · Ingreso neto de un contratista | Normal | A un contratista de prestación de servicios no se le deducen costos: el ingreso neto es el valor mensual del contrato sin IVA, $5.000.000. |
| 2 | R06 · Obligado a cotizar a Salud y Pensión | Normal | El ingreso neto ($5.000.000) es igual o superior a 1 SMMLV ($1.750.905), así que la afiliación a Salud y Pensión es obligatoria. |
| 3 | R08 · Cálculo del IBC | Normal | El IBC de un independiente es el 40 % del ingreso neto: $5.000.000 × 40 % = $2.000.000. |
| 4 | R13 · ARL obligatoria por duración del contrato | Normal | El contrato dura 300 días (más de 30) y la actividad es de clase 1: la afiliación a ARL es obligatoria y el pago corre por cuenta del contratista. |
| 5 | R17 · Liquidación de Salud y Pensión | Normal | Sobre un IBC de $2.000.000: Salud 12,5 % = $250.000; Pensión 16 % = $320.000. |
| 6 | R18 · Liquidación de ARL a cargo del contratista | Normal | ARL de clase 1 con tarifa de 0,522 %: $10.440. Total mensual estimado a cargo del solicitante: $580.440. |
| 7 | R27 · Solicitud viable | Normal | No se activó ninguna regla crítica ni de advertencia: la solicitud cumple todas las condiciones configuradas. Un asesor valida la decisión final. |

**Liquidación estimada:** IBC: $2.000.000 · Salud: $250.000 · Pensión: $320.000 · ARL: $10.440 · Total a cargo del solicitante: $580.440

**Conclusiones:**
- Obligado a cotizar a Salud (12,5 %) y Pensión (16 %).
- ARL obligatoria (contrato de 300 días); la paga el contratista.
- Solicitud viable según las reglas configuradas; un asesor valida la decisión final.

## SOL-0002 · Andrés Cardona

_Contratista · Plan Básico — «Me contrataron 6 meses como auxiliar administrativo por prestación de servicios y gano 2 millones. Solo quiero salud y ARL.»_

**Clasificación: Requiere revisión** · Estado sugerido: En revisión · 9 reglas activadas (0 críticas, 1 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R03 · Ingreso neto de un contratista | Normal | A un contratista de prestación de servicios no se le deducen costos: el ingreso neto es el valor mensual del contrato sin IVA, $2.000.000. |
| 2 | R06 · Obligado a cotizar a Salud y Pensión | Normal | El ingreso neto ($2.000.000) es igual o superior a 1 SMMLV ($1.750.905), así que la afiliación a Salud y Pensión es obligatoria. |
| 3 | R08 · Cálculo del IBC | Normal | El IBC de un independiente es el 40 % del ingreso neto: $2.000.000 × 40 % = $800.000. |
| 4 | R09 · IBC ajustado al mínimo legal | Normal | El 40 % del ingreso ($800.000) quedó por debajo del mínimo legal, así que se cotiza sobre 1 SMMLV: $1.750.905. |
| 5 | R13 · ARL obligatoria por duración del contrato | Normal | El contrato dura 180 días (más de 30) y la actividad es de clase 1: la afiliación a ARL es obligatoria y el pago corre por cuenta del contratista. |
| 6 | R17 · Liquidación de Salud y Pensión | Normal | Sobre un IBC de $1.750.905: Salud 12,5 % = $218.863; Pensión 16 % = $280.145. |
| 7 | R18 · Liquidación de ARL a cargo del contratista | Normal | ARL de clase 1 con tarifa de 0,522 %: $9.140. Total mensual estimado a cargo del solicitante: $508.148. |
| 8 | R20 · Plan Básico sin la Pensión obligatoria | Advertencia | El Plan Básico solo incluye Salud y ARL, pero el solicitante está obligado a cotizar Pensión. El plan que cubre su obligación es el Integral. |
| 9 | R29 · Solicitud que requiere revisión | Normal | La solicitud no es viable sin revisión, pero tampoco llega al umbral de bloqueo (2 críticas), así que un asesor debe revisarla. Advertencias: 1 · Críticas: 0. |

**Liquidación estimada:** IBC: $1.750.905 · Salud: $218.863 · Pensión: $280.145 · ARL: $9.140 · Total a cargo del solicitante: $508.148

**Conclusiones:**
- Obligado a cotizar a Salud (12,5 %) y Pensión (16 %).
- IBC ajustado al mínimo legal: $1.750.905.
- ARL obligatoria (contrato de 180 días); la paga el contratista.
- La solicitud requiere revisión de un asesor.

**Recomendaciones:**
- Sugerir el Plan Integral: incluye la Pensión obligatoria.

## SOL-0003 · Jorge Salazar

_Cuenta propia · Plan Integral — «Trabajo por mi cuenta en obras de construcción, a veces en alturas. No sé bien cuánto gano al mes.»_

**Clasificación: Crítica** · Estado sugerido: Bloqueada · 6 reglas activadas (3 críticas, 2 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R01 · Ingreso mensual no reportado | Crítico | La solicitud es de un trabajador «Cuenta propia», pero no registra ingreso mensual. Sin ese dato no se puede aplicar la regla de obligatoriedad (ingresos de 1 SMMLV o más). |
| 2 | R02 · Sin autorización de tratamiento de datos | Crítico | El solicitante no ha dado autorización previa para el tratamiento de sus datos personales; sin ella la solicitud no puede gestionarse. |
| 3 | R12 · Alto riesgo en un independiente por cuenta propia | Advertencia | La actividad es de clase de riesgo 5 (alto riesgo). La ley obliga a afiliar a ARL a los independientes en actividades de alto riesgo; para quien trabaja por cuenta propia, un asesor debe confirmar cómo se hace la afiliación y quién la paga. |
| 4 | R24 · Documentación incompleta | Advertencia | Solo está completo el 25 % de los documentos obligatorios (mínimo requerido: 100 %). |
| 5 | R25 · Bloqueo por múltiples condiciones críticas | Crítico | Se activaron 2 reglas críticas (umbral de bloqueo: 2); la solicitud queda bloqueada hasta que un asesor las resuelva. |
| 6 | R26 · Escalamiento de solicitud crítica sin gestión | Normal | La solicitud tiene condiciones críticas y lleva 243,9 horas sin gestión (límite: 24); se escala al supervisor. |

**Conclusiones:**
- Falta el ingreso mensual: no se puede determinar la obligación de cotizar.

**Recomendaciones:**
- Validar con un asesor la afiliación a ARL por actividad de alto riesgo (clase 5).
- Pedir los documentos obligatorios que faltan (25 % completo).

**Alertas:**
- Solicitud SOL-0003: el solicitante no ha autorizado el tratamiento de sus datos (Ley 1581 de 2012).
- Solicitud SOL-0003 bloqueada: 2 condiciones críticas.
- Escalamiento: la solicitud crítica SOL-0003 lleva 243,9 horas sin gestión.

## SOL-0004 · Empresa Demo S.A.S.

_Empleador · Plan Empresarial — «Somos una empresa con 12 empleados y necesitamos afiliarlos a todo.»_

**Clasificación: Viable** · Estado sugerido: Aprobada · 2 reglas activadas (0 críticas, 0 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R22 · Empresa apta para el Plan Empresarial | Normal | La empresa tiene 12 trabajadores (umbral: 5), así que le corresponde el Plan Empresarial con cotización por volumen. |
| 2 | R27 · Solicitud viable | Normal | No se activó ninguna regla crítica ni de advertencia: la solicitud cumple todas las condiciones configuradas. Un asesor valida la decisión final. |

**Conclusiones:**
- Solicitud viable según las reglas configuradas; un asesor valida la decisión final.

**Recomendaciones:**
- Ofrecer el Plan Empresarial para 12 trabajadores.

## SOL-0005 · Camilo Ospina

_Contratista · Plan Integral — «Soy conductor, me contrataron 20 días para hacer rutas y me pagan 3,5 millones.»_

**Clasificación: Requiere revisión** · Estado sugerido: En revisión · 8 reglas activadas (0 críticas, 1 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R03 · Ingreso neto de un contratista | Normal | A un contratista de prestación de servicios no se le deducen costos: el ingreso neto es el valor mensual del contrato sin IVA, $3.500.000. |
| 2 | R06 · Obligado a cotizar a Salud y Pensión | Normal | El ingreso neto ($3.500.000) es igual o superior a 1 SMMLV ($1.750.905), así que la afiliación a Salud y Pensión es obligatoria. |
| 3 | R08 · Cálculo del IBC | Normal | El IBC de un independiente es el 40 % del ingreso neto: $3.500.000 × 40 % = $1.400.000. |
| 4 | R09 · IBC ajustado al mínimo legal | Normal | El 40 % del ingreso ($1.400.000) quedó por debajo del mínimo legal, así que se cotiza sobre 1 SMMLV: $1.750.905. |
| 5 | R11 · ARL obligatoria por alto riesgo (contratista) | Advertencia | La actividad es de clase de riesgo 4. Un contratista en actividades de alto riesgo (clase 4 o superior) debe estar afiliado a ARL sin importar la duración del contrato, y el pago lo hace el contratante. |
| 6 | R17 · Liquidación de Salud y Pensión | Normal | Sobre un IBC de $1.750.905: Salud 12,5 % = $218.863; Pensión 16 % = $280.145. |
| 7 | R19 · Liquidación de ARL a cargo del contratante | Normal | ARL de clase 4 con tarifa de 4,35 %: $76.164. Lo paga el contratante, así que no se suma al total del solicitante ($499.008). |
| 8 | R29 · Solicitud que requiere revisión | Normal | La solicitud no es viable sin revisión, pero tampoco llega al umbral de bloqueo (2 críticas), así que un asesor debe revisarla. Advertencias: 1 · Críticas: 0. |

**Liquidación estimada:** IBC: $1.750.905 · Salud: $218.863 · Pensión: $280.145 · ARL: $76.164 · Total a cargo del solicitante: $499.008

**Conclusiones:**
- Obligado a cotizar a Salud (12,5 %) y Pensión (16 %).
- IBC ajustado al mínimo legal: $1.750.905.
- ARL obligatoria por alto riesgo (clase 4); la paga el contratante.
- Aporte de ARL a cargo del contratante: $76.164.
- La solicitud requiere revisión de un asesor.

## SOL-0006 · Valentina Muñoz

_Cuenta propia · Plan Básico — «Hago consultorías por mi cuenta, facturo unos 2,5 millones y tengo costos de 1 millón.»_

**Clasificación: Requiere revisión** · Estado sugerido: Pendiente documentos · 5 reglas activadas (0 críticas, 3 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R04 · Ingreso neto de un independiente por cuenta propia | Normal | Al ingreso de $2.500.000 se le restan costos deducibles por $1.000.000, lo que deja un ingreso neto de $1.500.000. |
| 2 | R05 · Costos deducidos que requieren soporte | Advertencia | Se dedujeron $1.000.000 de costos antes de calcular el IBC. Si no hay soportes, la UGPP puede aplicar costos presuntos y el aporte cambiaría. |
| 3 | R07 · No obligado a cotizar | Advertencia | El ingreso neto ($1.500.000) es menor a 1 SMMLV ($1.750.905): no hay obligación de cotizar, pero conviene ofrecer la cotización voluntaria para no perder cobertura. |
| 4 | R24 · Documentación incompleta | Advertencia | Solo está completo el 75 % de los documentos obligatorios (mínimo requerido: 100 %). |
| 5 | R28 · Solicitud pendiente de documentos | Normal | Faltan documentos obligatorios (75 % completo) y la solicitud no está bloqueada, así que queda pendiente de documentos. |

**Conclusiones:**
- Solicitud pendiente de documentos.

**Recomendaciones:**
- Pedir los soportes de los costos deducidos ($1.000.000).
- Ofrecer la cotización voluntaria sobre 1 SMMLV ($1.750.905).
- Pedir los documentos obligatorios que faltan (75 % completo).

## SOL-0007 · Diego Arango

_Cuenta propia · Plan Básico — «Soy transportador independiente, gano unos 6 millones al mes y quiero el plan más barato.»_

**Clasificación: Requiere revisión** · Estado sugerido: En revisión · 8 reglas activadas (0 críticas, 3 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R04 · Ingreso neto de un independiente por cuenta propia | Normal | Al ingreso de $6.000.000 se le restan costos deducibles por $0, lo que deja un ingreso neto de $6.000.000. |
| 2 | R06 · Obligado a cotizar a Salud y Pensión | Normal | El ingreso neto ($6.000.000) es igual o superior a 1 SMMLV ($1.750.905), así que la afiliación a Salud y Pensión es obligatoria. |
| 3 | R08 · Cálculo del IBC | Normal | El IBC de un independiente es el 40 % del ingreso neto: $6.000.000 × 40 % = $2.400.000. |
| 4 | R12 · Alto riesgo en un independiente por cuenta propia | Advertencia | La actividad es de clase de riesgo 4 (alto riesgo). La ley obliga a afiliar a ARL a los independientes en actividades de alto riesgo; para quien trabaja por cuenta propia, un asesor debe confirmar cómo se hace la afiliación y quién la paga. |
| 5 | R17 · Liquidación de Salud y Pensión | Normal | Sobre un IBC de $2.400.000: Salud 12,5 % = $300.000; Pensión 16 % = $384.000. |
| 6 | R20 · Plan Básico sin la Pensión obligatoria | Advertencia | El Plan Básico solo incluye Salud y ARL, pero el solicitante está obligado a cotizar Pensión. El plan que cubre su obligación es el Integral. |
| 7 | R21 · Plan Básico con riesgo superior a I | Advertencia | El Plan Básico cubre ARL solo en riesgo I y la actividad es de clase 4. El plan adecuado es el Integral. |
| 8 | R29 · Solicitud que requiere revisión | Normal | La solicitud no es viable sin revisión, pero tampoco llega al umbral de bloqueo (2 críticas), así que un asesor debe revisarla. Advertencias: 3 · Críticas: 0. |

**Liquidación estimada:** IBC: $2.400.000 · Salud: $300.000 · Pensión: $384.000 · Total a cargo del solicitante: $684.000

**Conclusiones:**
- Obligado a cotizar a Salud (12,5 %) y Pensión (16 %).
- La solicitud requiere revisión de un asesor.

**Recomendaciones:**
- Validar con un asesor la afiliación a ARL por actividad de alto riesgo (clase 4).
- Sugerir el Plan Integral: incluye la Pensión obligatoria.
- Sugerir el Plan Integral: cubre ARL para la clase de riesgo 4.

## SOL-0008 · Marcela Giraldo

_Contratista · Plan Integral — «Soy diseñadora, tengo un contrato de prestación de servicios por 6 meses y me pagan 3 millones mensuales.»_

**Clasificación: Viable** · Estado sugerido: Aprobada · 8 reglas activadas (0 críticas, 0 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R03 · Ingreso neto de un contratista | Normal | A un contratista de prestación de servicios no se le deducen costos: el ingreso neto es el valor mensual del contrato sin IVA, $3.000.000. |
| 2 | R06 · Obligado a cotizar a Salud y Pensión | Normal | El ingreso neto ($3.000.000) es igual o superior a 1 SMMLV ($1.750.905), así que la afiliación a Salud y Pensión es obligatoria. |
| 3 | R08 · Cálculo del IBC | Normal | El IBC de un independiente es el 40 % del ingreso neto: $3.000.000 × 40 % = $1.200.000. |
| 4 | R09 · IBC ajustado al mínimo legal | Normal | El 40 % del ingreso ($1.200.000) quedó por debajo del mínimo legal, así que se cotiza sobre 1 SMMLV: $1.750.905. |
| 5 | R13 · ARL obligatoria por duración del contrato | Normal | El contrato dura 180 días (más de 30) y la actividad es de clase 1: la afiliación a ARL es obligatoria y el pago corre por cuenta del contratista. |
| 6 | R17 · Liquidación de Salud y Pensión | Normal | Sobre un IBC de $1.750.905: Salud 12,5 % = $218.863; Pensión 16 % = $280.145. |
| 7 | R18 · Liquidación de ARL a cargo del contratista | Normal | ARL de clase 1 con tarifa de 0,522 %: $9.140. Total mensual estimado a cargo del solicitante: $508.148. |
| 8 | R27 · Solicitud viable | Normal | No se activó ninguna regla crítica ni de advertencia: la solicitud cumple todas las condiciones configuradas. Un asesor valida la decisión final. |

**Liquidación estimada:** IBC: $1.750.905 · Salud: $218.863 · Pensión: $280.145 · ARL: $9.140 · Total a cargo del solicitante: $508.148

**Conclusiones:**
- Obligado a cotizar a Salud (12,5 %) y Pensión (16 %).
- IBC ajustado al mínimo legal: $1.750.905.
- ARL obligatoria (contrato de 180 días); la paga el contratista.
- Solicitud viable según las reglas configuradas; un asesor valida la decisión final.

## SOL-0009 · Felipe Duque

_Cuenta propia · Plan Integral — «Vendo servicios de asesoría tributaria por mi cuenta, facturo unos 4 millones y tengo costos de 500 mil.»_

**Clasificación: Requiere revisión** · Estado sugerido: En revisión · 7 reglas activadas (0 críticas, 1 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R04 · Ingreso neto de un independiente por cuenta propia | Normal | Al ingreso de $4.000.000 se le restan costos deducibles por $500.000, lo que deja un ingreso neto de $3.500.000. |
| 2 | R05 · Costos deducidos que requieren soporte | Advertencia | Se dedujeron $500.000 de costos antes de calcular el IBC. Si no hay soportes, la UGPP puede aplicar costos presuntos y el aporte cambiaría. |
| 3 | R06 · Obligado a cotizar a Salud y Pensión | Normal | El ingreso neto ($3.500.000) es igual o superior a 1 SMMLV ($1.750.905), así que la afiliación a Salud y Pensión es obligatoria. |
| 4 | R08 · Cálculo del IBC | Normal | El IBC de un independiente es el 40 % del ingreso neto: $3.500.000 × 40 % = $1.400.000. |
| 5 | R09 · IBC ajustado al mínimo legal | Normal | El 40 % del ingreso ($1.400.000) quedó por debajo del mínimo legal, así que se cotiza sobre 1 SMMLV: $1.750.905. |
| 6 | R17 · Liquidación de Salud y Pensión | Normal | Sobre un IBC de $1.750.905: Salud 12,5 % = $218.863; Pensión 16 % = $280.145. |
| 7 | R29 · Solicitud que requiere revisión | Normal | La solicitud no es viable sin revisión, pero tampoco llega al umbral de bloqueo (2 críticas), así que un asesor debe revisarla. Advertencias: 1 · Críticas: 0. |

**Liquidación estimada:** IBC: $1.750.905 · Salud: $218.863 · Pensión: $280.145 · Total a cargo del solicitante: $499.008

**Conclusiones:**
- Obligado a cotizar a Salud (12,5 %) y Pensión (16 %).
- IBC ajustado al mínimo legal: $1.750.905.
- La solicitud requiere revisión de un asesor.

**Recomendaciones:**
- Pedir los soportes de los costos deducidos ($500.000).

## SOL-0010 · Café Montaña S.A.S.

_Empleador · Plan Empresarial — «Tenemos 3 empleados y queremos afiliarlos a seguridad social.»_

**Clasificación: Requiere revisión** · Estado sugerido: En revisión · 2 reglas activadas (0 críticas, 1 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R23 · Empleador por debajo del umbral empresarial | Advertencia | La empresa tiene 3 trabajadores, por debajo del umbral de 5 del Plan Empresarial; un asesor debe evaluar la afiliación individual. |
| 2 | R29 · Solicitud que requiere revisión | Normal | La solicitud no es viable sin revisión, pero tampoco llega al umbral de bloqueo (2 críticas), así que un asesor debe revisarla. Advertencias: 1 · Críticas: 0. |

**Conclusiones:**
- La solicitud requiere revisión de un asesor.

**Recomendaciones:**
- Evaluar la afiliación individual de los 3 trabajadores.

## SOL-0011 · Sofía Henao

_Contratista · Plan Básico — «Tengo un contrato por 3 meses como auxiliar y me pagan 1,2 millones.»_

**Clasificación: Requiere revisión** · Estado sugerido: Pendiente documentos · 5 reglas activadas (0 críticas, 2 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R03 · Ingreso neto de un contratista | Normal | A un contratista de prestación de servicios no se le deducen costos: el ingreso neto es el valor mensual del contrato sin IVA, $1.200.000. |
| 2 | R07 · No obligado a cotizar | Advertencia | El ingreso neto ($1.200.000) es menor a 1 SMMLV ($1.750.905): no hay obligación de cotizar, pero conviene ofrecer la cotización voluntaria para no perder cobertura. |
| 3 | R13 · ARL obligatoria por duración del contrato | Normal | El contrato dura 90 días (más de 30) y la actividad es de clase 1: la afiliación a ARL es obligatoria y el pago corre por cuenta del contratista. |
| 4 | R24 · Documentación incompleta | Advertencia | Solo está completo el 75 % de los documentos obligatorios (mínimo requerido: 100 %). |
| 5 | R28 · Solicitud pendiente de documentos | Normal | Faltan documentos obligatorios (75 % completo) y la solicitud no está bloqueada, así que queda pendiente de documentos. |

**Conclusiones:**
- ARL obligatoria (contrato de 90 días); la paga el contratista.
- Solicitud pendiente de documentos.

**Recomendaciones:**
- Ofrecer la cotización voluntaria sobre 1 SMMLV ($1.750.905).
- Pedir los documentos obligatorios que faltan (75 % completo).

## SOL-0012 · Ricardo Patiño

_Cuenta propia · Plan Básico — «Soy mensajero independiente, gano unos 2,8 millones. No he firmado la autorización de datos.»_

**Clasificación: Crítica** · Estado sugerido: Pendiente documentos · 12 reglas activadas (1 críticas, 5 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R02 · Sin autorización de tratamiento de datos | Crítico | El solicitante no ha dado autorización previa para el tratamiento de sus datos personales; sin ella la solicitud no puede gestionarse. |
| 2 | R04 · Ingreso neto de un independiente por cuenta propia | Normal | Al ingreso de $2.800.000 se le restan costos deducibles por $300.000, lo que deja un ingreso neto de $2.500.000. |
| 3 | R05 · Costos deducidos que requieren soporte | Advertencia | Se dedujeron $300.000 de costos antes de calcular el IBC. Si no hay soportes, la UGPP puede aplicar costos presuntos y el aporte cambiaría. |
| 4 | R06 · Obligado a cotizar a Salud y Pensión | Normal | El ingreso neto ($2.500.000) es igual o superior a 1 SMMLV ($1.750.905), así que la afiliación a Salud y Pensión es obligatoria. |
| 5 | R08 · Cálculo del IBC | Normal | El IBC de un independiente es el 40 % del ingreso neto: $2.500.000 × 40 % = $1.000.000. |
| 6 | R09 · IBC ajustado al mínimo legal | Normal | El 40 % del ingreso ($1.000.000) quedó por debajo del mínimo legal, así que se cotiza sobre 1 SMMLV: $1.750.905. |
| 7 | R12 · Alto riesgo en un independiente por cuenta propia | Advertencia | La actividad es de clase de riesgo 4 (alto riesgo). La ley obliga a afiliar a ARL a los independientes en actividades de alto riesgo; para quien trabaja por cuenta propia, un asesor debe confirmar cómo se hace la afiliación y quién la paga. |
| 8 | R17 · Liquidación de Salud y Pensión | Normal | Sobre un IBC de $1.750.905: Salud 12,5 % = $218.863; Pensión 16 % = $280.145. |
| 9 | R20 · Plan Básico sin la Pensión obligatoria | Advertencia | El Plan Básico solo incluye Salud y ARL, pero el solicitante está obligado a cotizar Pensión. El plan que cubre su obligación es el Integral. |
| 10 | R21 · Plan Básico con riesgo superior a I | Advertencia | El Plan Básico cubre ARL solo en riesgo I y la actividad es de clase 4. El plan adecuado es el Integral. |
| 11 | R24 · Documentación incompleta | Advertencia | Solo está completo el 25 % de los documentos obligatorios (mínimo requerido: 100 %). |
| 12 | R28 · Solicitud pendiente de documentos | Normal | Faltan documentos obligatorios (25 % completo) y la solicitud no está bloqueada, así que queda pendiente de documentos. |

**Liquidación estimada:** IBC: $1.750.905 · Salud: $218.863 · Pensión: $280.145 · Total a cargo del solicitante: $499.008

**Conclusiones:**
- Obligado a cotizar a Salud (12,5 %) y Pensión (16 %).
- IBC ajustado al mínimo legal: $1.750.905.
- Solicitud pendiente de documentos.

**Recomendaciones:**
- Pedir los soportes de los costos deducidos ($300.000).
- Validar con un asesor la afiliación a ARL por actividad de alto riesgo (clase 4).
- Sugerir el Plan Integral: incluye la Pensión obligatoria.
- Sugerir el Plan Integral: cubre ARL para la clase de riesgo 4.
- Pedir los documentos obligatorios que faltan (25 % completo).

**Alertas:**
- Solicitud SOL-0012: el solicitante no ha autorizado el tratamiento de sus datos (Ley 1581 de 2012).

## SOL-0013 · Natalia Ríos

_Contratista · Plan Integral — «Soy ingeniera de software, contrato de prestación de servicios por un año con honorarios de 8 millones.»_

**Clasificación: Viable** · Estado sugerido: Aprobada · 7 reglas activadas (0 críticas, 0 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R03 · Ingreso neto de un contratista | Normal | A un contratista de prestación de servicios no se le deducen costos: el ingreso neto es el valor mensual del contrato sin IVA, $8.000.000. |
| 2 | R06 · Obligado a cotizar a Salud y Pensión | Normal | El ingreso neto ($8.000.000) es igual o superior a 1 SMMLV ($1.750.905), así que la afiliación a Salud y Pensión es obligatoria. |
| 3 | R08 · Cálculo del IBC | Normal | El IBC de un independiente es el 40 % del ingreso neto: $8.000.000 × 40 % = $3.200.000. |
| 4 | R13 · ARL obligatoria por duración del contrato | Normal | El contrato dura 365 días (más de 30) y la actividad es de clase 1: la afiliación a ARL es obligatoria y el pago corre por cuenta del contratista. |
| 5 | R17 · Liquidación de Salud y Pensión | Normal | Sobre un IBC de $3.200.000: Salud 12,5 % = $400.000; Pensión 16 % = $512.000. |
| 6 | R18 · Liquidación de ARL a cargo del contratista | Normal | ARL de clase 1 con tarifa de 0,522 %: $16.704. Total mensual estimado a cargo del solicitante: $928.704. |
| 7 | R27 · Solicitud viable | Normal | No se activó ninguna regla crítica ni de advertencia: la solicitud cumple todas las condiciones configuradas. Un asesor valida la decisión final. |

**Liquidación estimada:** IBC: $3.200.000 · Salud: $400.000 · Pensión: $512.000 · ARL: $16.704 · Total a cargo del solicitante: $928.704

**Conclusiones:**
- Obligado a cotizar a Salud (12,5 %) y Pensión (16 %).
- ARL obligatoria (contrato de 365 días); la paga el contratista.
- Solicitud viable según las reglas configuradas; un asesor valida la decisión final.

## SOL-0014 · Héctor Zapata

_Cuenta propia · Plan Integral — «Trabajo en obras de construcción por mi cuenta y gano alrededor de 1,5 millones.»_

**Clasificación: Requiere revisión** · Estado sugerido: Pendiente documentos · 6 reglas activadas (0 críticas, 4 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R04 · Ingreso neto de un independiente por cuenta propia | Normal | Al ingreso de $1.500.000 se le restan costos deducibles por $200.000, lo que deja un ingreso neto de $1.300.000. |
| 2 | R05 · Costos deducidos que requieren soporte | Advertencia | Se dedujeron $200.000 de costos antes de calcular el IBC. Si no hay soportes, la UGPP puede aplicar costos presuntos y el aporte cambiaría. |
| 3 | R07 · No obligado a cotizar | Advertencia | El ingreso neto ($1.300.000) es menor a 1 SMMLV ($1.750.905): no hay obligación de cotizar, pero conviene ofrecer la cotización voluntaria para no perder cobertura. |
| 4 | R12 · Alto riesgo en un independiente por cuenta propia | Advertencia | La actividad es de clase de riesgo 5 (alto riesgo). La ley obliga a afiliar a ARL a los independientes en actividades de alto riesgo; para quien trabaja por cuenta propia, un asesor debe confirmar cómo se hace la afiliación y quién la paga. |
| 5 | R24 · Documentación incompleta | Advertencia | Solo está completo el 75 % de los documentos obligatorios (mínimo requerido: 100 %). |
| 6 | R28 · Solicitud pendiente de documentos | Normal | Faltan documentos obligatorios (75 % completo) y la solicitud no está bloqueada, así que queda pendiente de documentos. |

**Conclusiones:**
- Solicitud pendiente de documentos.

**Recomendaciones:**
- Pedir los soportes de los costos deducidos ($200.000).
- Ofrecer la cotización voluntaria sobre 1 SMMLV ($1.750.905).
- Validar con un asesor la afiliación a ARL por actividad de alto riesgo (clase 5).
- Pedir los documentos obligatorios que faltan (75 % completo).

## SOL-0015 · Ferretería El Tornillo S.A.S.

_Empleador · Plan Empresarial — «Somos una ferretería con 7 empleados y queremos afiliarlos.»_

**Clasificación: Requiere revisión** · Estado sugerido: Pendiente documentos · 3 reglas activadas (0 críticas, 1 advertencias) · ✅ coincide con el resultado esperado

| # | Regla | Impacto | Por qué se activó |
|---|---|---|---|
| 1 | R22 · Empresa apta para el Plan Empresarial | Normal | La empresa tiene 7 trabajadores (umbral: 5), así que le corresponde el Plan Empresarial con cotización por volumen. |
| 2 | R24 · Documentación incompleta | Advertencia | Solo está completo el 66,67 % de los documentos obligatorios (mínimo requerido: 100 %). |
| 3 | R28 · Solicitud pendiente de documentos | Normal | Faltan documentos obligatorios (66,67 % completo) y la solicitud no está bloqueada, así que queda pendiente de documentos. |

**Conclusiones:**
- Solicitud pendiente de documentos.

**Recomendaciones:**
- Ofrecer el Plan Empresarial para 7 trabajadores.
- Pedir los documentos obligatorios que faltan (66,67 % completo).
