# Catálogo de la base de conocimiento

> Generado por `npm run sistema-experto:generar`. No editar a mano.

**29 reglas SI-ENTONCES**, 27 hechos y 12 parámetros.

- Por impacto: Normal: 15 · Advertencia: 11 · Crítico: 3
- Por categoría: Validación de datos: 2 · Ingreso base de cotización: 6 · Obligatoriedad: 2 · Riesgos laborales: 6 · Liquidación: 3 · Coherencia comercial: 4 · Documentación: 1 · Consolidación: 5
- Por respaldo: Verificado: 15 · Por validar: 3 · Política interna: 11

## Parámetros

| ID | Nombre | Valor | Estado | Fuente |
|---|---|---|---|---|
| `SMMLV` | Salario mínimo mensual legal vigente | $1.750.905 | Verificado | Decreto 1469 de 2025 (SMMLV 2026). Valor confirmado en fuentes secundarias concordantes (Holland & Knight, Alegra). |
| `PCT_IBC_INDEPENDIENTE` | Porcentaje del ingreso que forma el IBC de un independiente | 40 % | Verificado | UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89. |
| `IBC_MIN_SMMLV` | IBC mínimo | 1 SMMLV | Verificado | UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89. |
| `IBC_MAX_SMMLV` | IBC máximo (tope) | 25 SMMLV | Verificado | UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89. |
| `TARIFA_SALUD` | Tarifa de cotización a Salud del independiente | 12,5 % | Verificado | UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89. |
| `TARIFA_PENSION` | Tarifa de cotización a Pensión del independiente | 16 % | Verificado | UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89. |
| `DIAS_MIN_ARL_OBLIGATORIA` | Duración de contrato a partir de la cual la ARL es obligatoria | 30 días | Verificado | UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (2026); Decreto 723 de 2013; Ley 1562 de 2012, art. 2. |
| `CLASE_ALTO_RIESGO_MIN` | Clase de riesgo desde la que una actividad es de alto riesgo | 4 clase | Verificado | UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (2026); Decreto 723 de 2013; Ley 1562 de 2012, art. 2. |
| `UMBRAL_TRABAJADORES_EMPRESARIAL` | Trabajadores mínimos para el Plan Empresarial | 5 trabajadores | Política interna | Catálogo de planes SolutaPLUS (constants/pricing-plans.ts). |
| `PCT_MIN_DOCUMENTOS` | Documentación mínima para continuar el trámite | 100 % | Política interna | Política interna SolutaPLUS (definida para el ejercicio académico). |
| `NUM_CRITICAS_BLOQUEO` | Reglas críticas que bloquean una solicitud | 2 reglas | Política interna | Política interna SolutaPLUS (definida para el ejercicio académico). |
| `HORAS_ESCALAMIENTO_CRITICA` | Horas sin gestión antes de escalar una solicitud crítica | 24 horas | Política interna | Política interna SolutaPLUS (definida para el ejercicio académico). |

## Hechos

| Hecho | Tipo | Origen | Descripción / fuente del dato |
|---|---|---|---|
| `id_solicitud` | Texto | Entrada | Radicado de la solicitud evaluada. <br>_Solicitudes.ID_Solicitud_ |
| `tipo_vinculacion` | Texto | Entrada | Cómo trabaja el solicitante. <br>_Solicitudes.Tipo_Vinculacion_ |
| `ingreso_mensual` | Número | Entrada | Ingreso mensual bruto sin IVA. <br>_Solicitudes.Ingreso_Mensual_ |
| `costos_deducibles` | Número | Entrada | Costos de la actividad por cuenta propia. <br>_Solicitudes.Costos_Deducibles_ <br>Por defecto: `0` |
| `duracion_contrato_dias` | Número | Entrada | Duración del contrato de prestación de servicios, en días. <br>_Solicitudes.Duracion_Contrato_Dias_ |
| `clase_riesgo` | Número | Entrada | Clase de riesgo ARL (1 a 5) de la actividad económica. <br>_Actividades_Economicas.ID_Clase (vía Solicitudes.ID_Actividad)_ |
| `tarifa_arl` | Número | Entrada | Tarifa inicial de ARL (%) de la clase de riesgo. <br>_Clases_Riesgo.Tarifa_ARL_Pct (vía la actividad económica)_ |
| `numero_trabajadores` | Número | Entrada | Trabajadores que un empleador quiere afiliar. <br>_Solicitudes.Numero_Trabajadores_ |
| `autoriza_datos` | SI/NO | Entrada | Si el solicitante autorizó el tratamiento de sus datos. <br>_Solicitantes.Autoriza_Datos_ <br>Por defecto: `NO` |
| `plan_solicitado` | Texto | Entrada | Plan que eligió el solicitante. <br>_Solicitudes.ID_Plan_ |
| `porcentaje_documentos` | Número | Entrada | Porcentaje de documentos obligatorios recibidos para su tipo de vinculación. <br>_Calculado: Documentos_Solicitud en estado Recibido ÷ Documentos_Requeridos obligatorios que aplican × 100_ |
| `horas_sin_gestion` | Número | Entrada | Horas transcurridas desde la última gestión de la solicitud. <br>_Calculado: momento de la evaluación − Solicitudes.Fecha_Ultima_Gestion_ |
| `ingreso_neto` | Número | Derivado | Ingreso sobre el que se determina la obligación de cotizar. |
| `obligado_cotizar` | SI/NO | Derivado | Si está obligado a cotizar a Salud y Pensión. |
| `ibc_calculado` | Número | Derivado | IBC antes de aplicar el mínimo y el tope legales. |
| `ibc` | Número | Derivado | Ingreso base de cotización final. |
| `arl_obligatoria` | SI/NO | Derivado | Si la afiliación a ARL es obligatoria. |
| `arl_pagador` | Texto | Derivado | Quién paga la ARL. |
| `aporte_salud` | Número | Derivado | Aporte mensual a Salud. |
| `aporte_pension` | Número | Derivado | Aporte mensual a Pensión. |
| `aporte_arl` | Número | Derivado | Aporte mensual a ARL. |
| `total_aportes_cliente` | Número | Derivado | Total mensual estimado a cargo del solicitante. |
| `plan_sugerido` | Texto | Derivado | Plan que el sistema recomienda. |
| `estado_sugerido` | Texto | Derivado | Estado que el sistema sugiere para la solicitud. |
| `escalar_supervisor` | SI/NO | Derivado | Si la solicitud debe escalarse al supervisor. |
| `num_reglas_criticas` | Número | Motor | Reglas de impacto Crítico activadas hasta el momento. |
| `num_reglas_advertencia` | Número | Motor | Reglas de impacto Advertencia activadas hasta el momento. |

## Reglas

### R01 · Ingreso mensual no reportado

**Categoría:** Validación de datos · **Prioridad:** 10 · **Impacto:** Crítico · **Respaldo:** Verificado

> SI el solicitante es independiente (contratista o cuenta propia) Y no reportó ingreso mensual ENTONCES la solicitud es crítica, porque no se puede determinar si está obligado a cotizar.

**SI** (todas se cumplen):
- `tipo_vinculacion` está en «Contratista», «Cuenta propia»
- `ingreso_mensual` no tiene valor

**ENTONCES:**
- CONCLUIR: Falta el ingreso mensual: no se puede determinar la obligación de cotizar.

**Explicación:** La solicitud es de un trabajador «{tipo_vinculacion}», pero no registra ingreso mensual. Sin ese dato no se puede aplicar la regla de obligatoriedad (ingresos de 1 SMMLV o más).

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89.

### R02 · Sin autorización de tratamiento de datos

**Categoría:** Validación de datos · **Prioridad:** 11 · **Impacto:** Crítico · **Respaldo:** Verificado

> SI el solicitante no autorizó el tratamiento de sus datos personales ENTONCES la solicitud es crítica y se alerta al equipo.

**SI** (todas se cumplen):
- `autoriza_datos` ≠ «SI»

**ENTONCES:**
- ALERTAR: Solicitud {id_solicitud}: el solicitante no ha autorizado el tratamiento de sus datos (Ley 1581 de 2012).

**Explicación:** El solicitante no ha dado autorización previa para el tratamiento de sus datos personales; sin ella la solicitud no puede gestionarse.

**Fuente:** Ley 1581 de 2012, art. 9 (autorización previa del titular).

### R03 · Ingreso neto de un contratista

**Categoría:** Ingreso base de cotización · **Prioridad:** 20 · **Impacto:** Normal · **Respaldo:** Verificado

> SI es contratista de prestación de servicios Y reportó ingreso ENTONCES su ingreso neto es el valor mensual del contrato, sin deducir costos.

**SI** (todas se cumplen):
- `tipo_vinculacion` = «Contratista»
- `ingreso_mensual` tiene valor

**ENTONCES:**
- CALCULAR `ingreso_neto` ← `ingreso_mensual`

**Explicación:** A un contratista de prestación de servicios no se le deducen costos: el ingreso neto es el valor mensual del contrato sin IVA, {ingreso_neto|moneda}.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89.

### R04 · Ingreso neto de un independiente por cuenta propia

**Categoría:** Ingreso base de cotización · **Prioridad:** 21 · **Impacto:** Normal · **Respaldo:** Por validar

> SI es independiente por cuenta propia Y reportó ingreso ENTONCES su ingreso neto es el ingreso menos los costos deducibles.

**SI** (todas se cumplen):
- `tipo_vinculacion` = «Cuenta propia»
- `ingreso_mensual` tiene valor

**ENTONCES:**
- CALCULAR `ingreso_neto` ← `MAX(ingreso_mensual - costos_deducibles, 0)`

**Explicación:** Al ingreso de {ingreso_mensual|moneda} se le restan costos deducibles por {costos_deducibles|moneda}, lo que deja un ingreso neto de {ingreso_neto|moneda}.

**Fuente:** Decreto 0379 de 2026 (depuración de costos antes de aplicar el 40 %), según Portafolio (abril de 2026). Pendiente contrastar con el texto oficial.

### R05 · Costos deducidos que requieren soporte

**Categoría:** Ingreso base de cotización · **Prioridad:** 22 · **Impacto:** Advertencia · **Respaldo:** Por validar

> SI es independiente por cuenta propia Y dedujo costos ENTONCES se deben pedir los soportes de esos costos.

**SI** (todas se cumplen):
- `tipo_vinculacion` = «Cuenta propia»
- `costos_deducibles` > «0»

**ENTONCES:**
- RECOMENDAR: Pedir los soportes de los costos deducidos ({costos_deducibles|moneda}).

**Explicación:** Se dedujeron {costos_deducibles|moneda} de costos antes de calcular el IBC. Si no hay soportes, la UGPP puede aplicar costos presuntos y el aporte cambiaría.

**Fuente:** Decreto 0379 de 2026 (depuración de costos antes de aplicar el 40 %), según Portafolio (abril de 2026). Pendiente contrastar con el texto oficial.

### R06 · Obligado a cotizar a Salud y Pensión

**Categoría:** Obligatoriedad · **Prioridad:** 30 · **Impacto:** Normal · **Respaldo:** Verificado

> SI el ingreso neto es mayor o igual a 1 SMMLV ENTONCES está obligado a cotizar a Salud y Pensión.

**SI** (todas se cumplen):
- `ingreso_neto` ≥ `SMMLV`

**ENTONCES:**
- ASIGNAR `obligado_cotizar` ← `SI`
- CONCLUIR: Obligado a cotizar a Salud ({TARIFA_SALUD} %) y Pensión ({TARIFA_PENSION} %).

**Explicación:** El ingreso neto ({ingreso_neto|moneda}) es igual o superior a 1 SMMLV ({SMMLV|moneda}), así que la afiliación a Salud y Pensión es obligatoria.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89.

### R07 · No obligado a cotizar

**Categoría:** Obligatoriedad · **Prioridad:** 31 · **Impacto:** Advertencia · **Respaldo:** Verificado

> SI el ingreso neto es menor a 1 SMMLV ENTONCES no está obligado a cotizar y se le ofrece la cotización voluntaria.

**SI** (todas se cumplen):
- `ingreso_neto` < `SMMLV`

**ENTONCES:**
- ASIGNAR `obligado_cotizar` ← `NO`
- RECOMENDAR: Ofrecer la cotización voluntaria sobre 1 SMMLV ({SMMLV|moneda}).

**Explicación:** El ingreso neto ({ingreso_neto|moneda}) es menor a 1 SMMLV ({SMMLV|moneda}): no hay obligación de cotizar, pero conviene ofrecer la cotización voluntaria para no perder cobertura.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89.

### R08 · Cálculo del IBC

**Categoría:** Ingreso base de cotización · **Prioridad:** 40 · **Impacto:** Normal · **Respaldo:** Verificado

> SI está obligado a cotizar ENTONCES el IBC es el 40 % del ingreso neto.

**SI** (todas se cumplen):
- `obligado_cotizar` = «SI»

**ENTONCES:**
- CALCULAR `ibc_calculado` ← `ingreso_neto * PCT_IBC_INDEPENDIENTE / 100`
- CALCULAR `ibc` ← `ibc_calculado`

**Explicación:** El IBC de un independiente es el {PCT_IBC_INDEPENDIENTE} % del ingreso neto: {ingreso_neto|moneda} × {PCT_IBC_INDEPENDIENTE} % = {ibc_calculado|moneda}.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89.

### R09 · IBC ajustado al mínimo legal

**Categoría:** Ingreso base de cotización · **Prioridad:** 41 · **Impacto:** Normal · **Respaldo:** Verificado

> SI está obligado a cotizar Y el IBC calculado es menor a 1 SMMLV ENTONCES el IBC se ajusta a 1 SMMLV.

**SI** (todas se cumplen):
- `obligado_cotizar` = «SI»
- `ibc_calculado` < `SMMLV * IBC_MIN_SMMLV`

**ENTONCES:**
- CALCULAR `ibc` ← `SMMLV * IBC_MIN_SMMLV`
- CONCLUIR: IBC ajustado al mínimo legal: {ibc|moneda}.

**Explicación:** El {PCT_IBC_INDEPENDIENTE} % del ingreso ({ibc_calculado|moneda}) quedó por debajo del mínimo legal, así que se cotiza sobre {IBC_MIN_SMMLV} SMMLV: {ibc|moneda}.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89.

### R10 · IBC limitado al tope legal

**Categoría:** Ingreso base de cotización · **Prioridad:** 42 · **Impacto:** Advertencia · **Respaldo:** Verificado

> SI está obligado a cotizar Y el IBC calculado supera 25 SMMLV ENTONCES el IBC se limita a 25 SMMLV y se verifican los ingresos.

**SI** (todas se cumplen):
- `obligado_cotizar` = «SI»
- `ibc_calculado` > `SMMLV * IBC_MAX_SMMLV`

**ENTONCES:**
- CALCULAR `ibc` ← `SMMLV * IBC_MAX_SMMLV`
- RECOMENDAR: Verificar los ingresos reportados: el IBC llegó al tope de {IBC_MAX_SMMLV} SMMLV.

**Explicación:** El IBC calculado ({ibc_calculado|moneda}) supera el tope de {IBC_MAX_SMMLV} SMMLV, así que se limita a {ibc|moneda}. Conviene verificar los ingresos reportados.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89.

### R11 · ARL obligatoria por alto riesgo (contratista)

**Categoría:** Riesgos laborales · **Prioridad:** 50 · **Impacto:** Advertencia · **Respaldo:** Verificado

> SI es contratista Y su actividad es de clase de riesgo 4 o superior ENTONCES la ARL es obligatoria y la paga el contratante.

**SI** (todas se cumplen):
- `tipo_vinculacion` = «Contratista»
- `clase_riesgo` ≥ `CLASE_ALTO_RIESGO_MIN`

**ENTONCES:**
- ASIGNAR `arl_obligatoria` ← `SI`
- ASIGNAR `arl_pagador` ← `Contratante`
- CONCLUIR: ARL obligatoria por alto riesgo (clase {clase_riesgo}); la paga el contratante.

**Explicación:** La actividad es de clase de riesgo {clase_riesgo}. Un contratista en actividades de alto riesgo (clase {CLASE_ALTO_RIESGO_MIN} o superior) debe estar afiliado a ARL sin importar la duración del contrato, y el pago lo hace el contratante.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (2026); Decreto 723 de 2013; Ley 1562 de 2012, art. 2.

### R12 · Alto riesgo en un independiente por cuenta propia

**Categoría:** Riesgos laborales · **Prioridad:** 51 · **Impacto:** Advertencia · **Respaldo:** Por validar

> SI es independiente por cuenta propia Y su actividad es de clase de riesgo 4 o superior ENTONCES un asesor debe validar la afiliación obligatoria a ARL.

**SI** (todas se cumplen):
- `tipo_vinculacion` = «Cuenta propia»
- `clase_riesgo` ≥ `CLASE_ALTO_RIESGO_MIN`

**ENTONCES:**
- RECOMENDAR: Validar con un asesor la afiliación a ARL por actividad de alto riesgo (clase {clase_riesgo}).

**Explicación:** La actividad es de clase de riesgo {clase_riesgo} (alto riesgo). La ley obliga a afiliar a ARL a los independientes en actividades de alto riesgo; para quien trabaja por cuenta propia, un asesor debe confirmar cómo se hace la afiliación y quién la paga.

**Fuente:** Ley 1562 de 2012, art. 2 (independientes en actividades de alto riesgo). Falta validar cómo aplica a quien trabaja por cuenta propia.

### R13 · ARL obligatoria por duración del contrato

**Categoría:** Riesgos laborales · **Prioridad:** 52 · **Impacto:** Normal · **Respaldo:** Verificado

> SI es contratista Y el contrato dura más de 30 días Y su actividad es de clase de riesgo menor a 4 ENTONCES la ARL es obligatoria y la paga el contratista.

**SI** (todas se cumplen):
- `tipo_vinculacion` = «Contratista»
- `duracion_contrato_dias` > `DIAS_MIN_ARL_OBLIGATORIA`
- `clase_riesgo` < `CLASE_ALTO_RIESGO_MIN`

**ENTONCES:**
- ASIGNAR `arl_obligatoria` ← `SI`
- ASIGNAR `arl_pagador` ← `Contratista`
- CONCLUIR: ARL obligatoria (contrato de {duracion_contrato_dias} días); la paga el contratista.

**Explicación:** El contrato dura {duracion_contrato_dias} días (más de {DIAS_MIN_ARL_OBLIGATORIA}) y la actividad es de clase {clase_riesgo}: la afiliación a ARL es obligatoria y el pago corre por cuenta del contratista.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (2026); Decreto 723 de 2013; Ley 1562 de 2012, art. 2.

### R14 · ARL voluntaria en contrato corto

**Categoría:** Riesgos laborales · **Prioridad:** 53 · **Impacto:** Normal · **Respaldo:** Verificado

> SI es contratista Y el contrato dura 30 días o menos Y su actividad es de clase de riesgo menor a 4 ENTONCES la ARL es voluntaria.

**SI** (todas se cumplen):
- `tipo_vinculacion` = «Contratista»
- `duracion_contrato_dias` ≤ `DIAS_MIN_ARL_OBLIGATORIA`
- `clase_riesgo` < `CLASE_ALTO_RIESGO_MIN`

**ENTONCES:**
- ASIGNAR `arl_obligatoria` ← `NO`
- RECOMENDAR: Ofrecer la afiliación voluntaria a ARL.

**Explicación:** El contrato dura {duracion_contrato_dias} días ({DIAS_MIN_ARL_OBLIGATORIA} o menos) y la actividad no es de alto riesgo: la afiliación a ARL no es obligatoria.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (2026); Decreto 723 de 2013; Ley 1562 de 2012, art. 2.

### R15 · Actividad económica sin clasificar

**Categoría:** Riesgos laborales · **Prioridad:** 54 · **Impacto:** Advertencia · **Respaldo:** Política interna

> SI es independiente Y no tiene actividad económica registrada ENTONCES no se puede determinar la clase de riesgo de ARL.

**SI** (todas se cumplen):
- `tipo_vinculacion` está en «Contratista», «Cuenta propia»
- `clase_riesgo` no tiene valor

**ENTONCES:**
- RECOMENDAR: Registrar la actividad económica para determinar la clase de riesgo y la tarifa de ARL.

**Explicación:** No hay actividad económica registrada, así que no se puede determinar la clase de riesgo ni la tarifa de ARL.

**Fuente:** Política interna SolutaPLUS (definida para el ejercicio académico).

### R16 · Duración del contrato no reportada

**Categoría:** Riesgos laborales · **Prioridad:** 55 · **Impacto:** Advertencia · **Respaldo:** Verificado

> SI es contratista Y no reportó la duración del contrato ENTONCES no se puede determinar si la ARL es obligatoria.

**SI** (todas se cumplen):
- `tipo_vinculacion` = «Contratista»
- `duracion_contrato_dias` no tiene valor

**ENTONCES:**
- RECOMENDAR: Registrar la duración del contrato para determinar si la ARL es obligatoria.

**Explicación:** La afiliación a ARL de un contratista depende de si el contrato dura más de {DIAS_MIN_ARL_OBLIGATORIA} días, y la solicitud no registra la duración.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (2026); Decreto 723 de 2013; Ley 1562 de 2012, art. 2.

### R17 · Liquidación de Salud y Pensión

**Categoría:** Liquidación · **Prioridad:** 60 · **Impacto:** Normal · **Respaldo:** Verificado

> SI hay IBC ENTONCES se liquidan los aportes a Salud (12,5 %) y Pensión (16 %).

**SI** (todas se cumplen):
- `ibc` tiene valor

**ENTONCES:**
- CALCULAR `aporte_salud` ← `ibc * TARIFA_SALUD / 100`
- CALCULAR `aporte_pension` ← `ibc * TARIFA_PENSION / 100`
- CALCULAR `total_aportes_cliente` ← `aporte_salud + aporte_pension`

**Explicación:** Sobre un IBC de {ibc|moneda}: Salud {TARIFA_SALUD} % = {aporte_salud|moneda}; Pensión {TARIFA_PENSION} % = {aporte_pension|moneda}.

**Fuente:** UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89.

### R18 · Liquidación de ARL a cargo del contratista

**Categoría:** Liquidación · **Prioridad:** 61 · **Impacto:** Normal · **Respaldo:** Verificado

> SI la ARL la paga el contratista Y hay IBC y tarifa ENTONCES se liquida la ARL y se suma al total del solicitante.

**SI** (todas se cumplen):
- `arl_pagador` = «Contratista»
- `ibc` tiene valor
- `tarifa_arl` tiene valor
- `total_aportes_cliente` tiene valor

**ENTONCES:**
- CALCULAR `aporte_arl` ← `ibc * tarifa_arl / 100`
- CALCULAR `total_aportes_cliente` ← `total_aportes_cliente + aporte_arl`

**Explicación:** ARL de clase {clase_riesgo} con tarifa de {tarifa_arl} %: {aporte_arl|moneda}. Total mensual estimado a cargo del solicitante: {total_aportes_cliente|moneda}.

**Fuente:** Decreto 1772 de 1994, art. 13 (tarifa inicial por clase de riesgo).

### R19 · Liquidación de ARL a cargo del contratante

**Categoría:** Liquidación · **Prioridad:** 62 · **Impacto:** Normal · **Respaldo:** Verificado

> SI la ARL la paga el contratante Y hay IBC y tarifa ENTONCES se liquida la ARL como aporte del contratante, sin sumarla al total del solicitante.

**SI** (todas se cumplen):
- `arl_pagador` = «Contratante»
- `ibc` tiene valor
- `tarifa_arl` tiene valor
- `total_aportes_cliente` tiene valor

**ENTONCES:**
- CALCULAR `aporte_arl` ← `ibc * tarifa_arl / 100`
- CONCLUIR: Aporte de ARL a cargo del contratante: {aporte_arl|moneda}.

**Explicación:** ARL de clase {clase_riesgo} con tarifa de {tarifa_arl} %: {aporte_arl|moneda}. Lo paga el contratante, así que no se suma al total del solicitante ({total_aportes_cliente|moneda}).

**Fuente:** Decreto 1772 de 1994, art. 13 (tarifa inicial por clase de riesgo).

### R20 · Plan Básico sin la Pensión obligatoria

**Categoría:** Coherencia comercial · **Prioridad:** 70 · **Impacto:** Advertencia · **Respaldo:** Política interna

> SI pidió el Plan Básico Y está obligado a cotizar Pensión ENTONCES se sugiere el Plan Integral.

**SI** (todas se cumplen):
- `plan_solicitado` = «basico»
- `obligado_cotizar` = «SI»

**ENTONCES:**
- ASIGNAR `plan_sugerido` ← `integral`
- RECOMENDAR: Sugerir el Plan Integral: incluye la Pensión obligatoria.

**Explicación:** El Plan Básico solo incluye Salud y ARL, pero el solicitante está obligado a cotizar Pensión. El plan que cubre su obligación es el Integral.

**Fuente:** Catálogo de planes SolutaPLUS (constants/pricing-plans.ts). UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89.

### R21 · Plan Básico con riesgo superior a I

**Categoría:** Coherencia comercial · **Prioridad:** 71 · **Impacto:** Advertencia · **Respaldo:** Política interna

> SI pidió el Plan Básico Y su actividad es de clase de riesgo mayor a I ENTONCES se sugiere el Plan Integral.

**SI** (todas se cumplen):
- `plan_solicitado` = «basico»
- `clase_riesgo` > «1»

**ENTONCES:**
- ASIGNAR `plan_sugerido` ← `integral`
- RECOMENDAR: Sugerir el Plan Integral: cubre ARL para la clase de riesgo {clase_riesgo}.

**Explicación:** El Plan Básico cubre ARL solo en riesgo I y la actividad es de clase {clase_riesgo}. El plan adecuado es el Integral.

**Fuente:** Catálogo de planes SolutaPLUS (constants/pricing-plans.ts).

### R22 · Empresa apta para el Plan Empresarial

**Categoría:** Coherencia comercial · **Prioridad:** 72 · **Impacto:** Normal · **Respaldo:** Política interna

> SI es empleador Y tiene 5 o más trabajadores ENTONCES se sugiere el Plan Empresarial.

**SI** (todas se cumplen):
- `tipo_vinculacion` = «Empleador»
- `numero_trabajadores` ≥ `UMBRAL_TRABAJADORES_EMPRESARIAL`

**ENTONCES:**
- ASIGNAR `plan_sugerido` ← `empresarial`
- RECOMENDAR: Ofrecer el Plan Empresarial para {numero_trabajadores} trabajadores.

**Explicación:** La empresa tiene {numero_trabajadores} trabajadores (umbral: {UMBRAL_TRABAJADORES_EMPRESARIAL}), así que le corresponde el Plan Empresarial con cotización por volumen.

**Fuente:** Catálogo de planes SolutaPLUS (constants/pricing-plans.ts).

### R23 · Empleador por debajo del umbral empresarial

**Categoría:** Coherencia comercial · **Prioridad:** 73 · **Impacto:** Advertencia · **Respaldo:** Política interna

> SI es empleador Y tiene menos de 5 trabajadores ENTONCES un asesor evalúa la afiliación individual.

**SI** (todas se cumplen):
- `tipo_vinculacion` = «Empleador»
- `numero_trabajadores` < `UMBRAL_TRABAJADORES_EMPRESARIAL`

**ENTONCES:**
- RECOMENDAR: Evaluar la afiliación individual de los {numero_trabajadores} trabajadores.

**Explicación:** La empresa tiene {numero_trabajadores} trabajadores, por debajo del umbral de {UMBRAL_TRABAJADORES_EMPRESARIAL} del Plan Empresarial; un asesor debe evaluar la afiliación individual.

**Fuente:** Catálogo de planes SolutaPLUS (constants/pricing-plans.ts).

### R24 · Documentación incompleta

**Categoría:** Documentación · **Prioridad:** 80 · **Impacto:** Advertencia · **Respaldo:** Política interna

> SI los documentos obligatorios recibidos están por debajo del 100 % ENTONCES se piden los faltantes.

**SI** (todas se cumplen):
- `porcentaje_documentos` < `PCT_MIN_DOCUMENTOS`

**ENTONCES:**
- RECOMENDAR: Pedir los documentos obligatorios que faltan ({porcentaje_documentos} % completo).

**Explicación:** Solo está completo el {porcentaje_documentos} % de los documentos obligatorios (mínimo requerido: {PCT_MIN_DOCUMENTOS} %).

**Fuente:** Política interna SolutaPLUS (definida para el ejercicio académico).

### R25 · Bloqueo por múltiples condiciones críticas

**Categoría:** Consolidación · **Prioridad:** 90 · **Impacto:** Crítico · **Respaldo:** Política interna

> SI se activaron 2 o más reglas críticas ENTONCES la solicitud se bloquea y se alerta.

**SI** (todas se cumplen):
- `num_reglas_criticas` ≥ `NUM_CRITICAS_BLOQUEO`

**ENTONCES:**
- ASIGNAR `estado_sugerido` ← `Bloqueada`
- ALERTAR: Solicitud {id_solicitud} bloqueada: {num_reglas_criticas} condiciones críticas.

**Explicación:** Se activaron {num_reglas_criticas} reglas críticas (umbral de bloqueo: {NUM_CRITICAS_BLOQUEO}); la solicitud queda bloqueada hasta que un asesor las resuelva.

**Fuente:** Política interna SolutaPLUS (definida para el ejercicio académico).

### R26 · Escalamiento de solicitud crítica sin gestión

**Categoría:** Consolidación · **Prioridad:** 91 · **Impacto:** Normal · **Respaldo:** Política interna

> SI hay al menos una regla crítica Y la solicitud lleva más de 24 horas sin gestión ENTONCES se escala al supervisor.

**SI** (todas se cumplen):
- `num_reglas_criticas` ≥ «1»
- `horas_sin_gestion` > `HORAS_ESCALAMIENTO_CRITICA`

**ENTONCES:**
- ASIGNAR `escalar_supervisor` ← `SI`
- ALERTAR: Escalamiento: la solicitud crítica {id_solicitud} lleva {horas_sin_gestion} horas sin gestión.

**Explicación:** La solicitud tiene condiciones críticas y lleva {horas_sin_gestion} horas sin gestión (límite: {HORAS_ESCALAMIENTO_CRITICA}); se escala al supervisor.

**Fuente:** Política interna SolutaPLUS (definida para el ejercicio académico).

### R27 · Solicitud viable

**Categoría:** Consolidación · **Prioridad:** 92 · **Impacto:** Normal · **Respaldo:** Política interna

> SI no se activó ninguna regla crítica ni de advertencia ENTONCES la solicitud es viable y se sugiere aprobarla.

**SI** (todas se cumplen):
- `num_reglas_criticas` = «0»
- `num_reglas_advertencia` = «0»

**ENTONCES:**
- ASIGNAR `estado_sugerido` ← `Aprobada`
- CONCLUIR: Solicitud viable según las reglas configuradas; un asesor valida la decisión final.

**Explicación:** No se activó ninguna regla crítica ni de advertencia: la solicitud cumple todas las condiciones configuradas. Un asesor valida la decisión final.

**Fuente:** Política interna SolutaPLUS (definida para el ejercicio académico).

### R28 · Solicitud pendiente de documentos

**Categoría:** Consolidación · **Prioridad:** 93 · **Impacto:** Normal · **Respaldo:** Política interna

> SI los documentos están incompletos Y la solicitud no quedó bloqueada ENTONCES el estado sugerido es «Pendiente documentos».

**SI** (todas se cumplen):
- `porcentaje_documentos` < `PCT_MIN_DOCUMENTOS`
- `estado_sugerido` no tiene valor

**ENTONCES:**
- ASIGNAR `estado_sugerido` ← `Pendiente documentos`
- CONCLUIR: Solicitud pendiente de documentos.

**Explicación:** Faltan documentos obligatorios ({porcentaje_documentos} % completo) y la solicitud no está bloqueada, así que queda pendiente de documentos.

**Fuente:** Política interna SolutaPLUS (definida para el ejercicio académico).

### R29 · Solicitud que requiere revisión

**Categoría:** Consolidación · **Prioridad:** 99 · **Impacto:** Normal · **Respaldo:** Política interna

> SI ninguna regla anterior definió el estado de la solicitud ENTONCES el estado sugerido es «En revisión».

**SI** (todas se cumplen):
- `estado_sugerido` no tiene valor

**ENTONCES:**
- ASIGNAR `estado_sugerido` ← `En revisión`
- CONCLUIR: La solicitud requiere revisión de un asesor.

**Explicación:** La solicitud no es viable sin revisión, pero tampoco llega al umbral de bloqueo ({NUM_CRITICAS_BLOQUEO} críticas), así que un asesor debe revisarla. Advertencias: {num_reglas_advertencia} · Críticas: {num_reglas_criticas}.

**Fuente:** Política interna SolutaPLUS (definida para el ejercicio académico).

## Casos de demostración (datos ficticios)

Resultado esperado con los datos semilla. Los tests del motor lo verifican y [`evaluaciones-demo.md`](evaluaciones-demo.md) muestra la explicación completa.

| Solicitud | Perfil | Nivel | Estado sugerido | Reglas activadas | Nota |
|---|---|---|---|---|---|
| SOL-0001 | Contratista, Plan Integral | **Viable** | Aprobada | R03, R06, R08, R13, R17, R18, R27 | IBC $2.000.000; Salud $250.000, Pensión $320.000, ARL $10.440; total $580.440. Coincide con el ejemplo oficial de la UGPP. |
| SOL-0002 | Contratista, Plan Básico | **Requiere revisión** | En revisión | R03, R06, R08, R09, R13, R17, R18, R20, R29 | El 40 % ($800.000) queda bajo el mínimo: IBC ajustado a $1.750.905. El Plan Básico no incluye la Pensión obligatoria. |
| SOL-0003 | Cuenta propia, Plan Integral | **Crítica** | Bloqueada | R01, R02, R12, R24, R25, R26 | Sin ingreso y sin autorización de datos: 2 críticas, bloqueo. R26 (escalamiento) se activa al evaluar más de 24 h después de la última gestión. |
| SOL-0004 | Empleador, Plan Empresarial | **Viable** | Aprobada | R22, R27 | 12 trabajadores superan el umbral de 5: se sugiere el Plan Empresarial. |
| SOL-0005 | Contratista, Plan Integral | **Requiere revisión** | En revisión | R03, R06, R08, R09, R11, R17, R19, R29 | Contrato de 20 días pero actividad de riesgo IV: ARL obligatoria a cargo del contratante. |
| SOL-0006 | Cuenta propia, Plan Básico | **Requiere revisión** | Pendiente documentos | R04, R05, R07, R24, R28 | Ingreso neto $1.500.000 < 1 SMMLV: no está obligada. Faltan soportes de costos (75 % de documentos). |
| SOL-0007 | Cuenta propia, Plan Básico | **Requiere revisión** | En revisión | R04, R06, R08, R12, R17, R20, R21, R29 | Obligado a Pensión y con riesgo IV: el Plan Básico no le sirve por dos motivos; se sugiere el Integral. |
