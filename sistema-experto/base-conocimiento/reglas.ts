// Base de conocimiento del sistema experto: hechos, parámetros y reglas
// SI-ENTONCES para evaluar solicitudes de afiliación a Seguridad Social.
//
// Se escribe aquí de forma anidada (cada regla con sus condiciones y
// acciones juntas, que es como se lee y se revisa) y se aplana a las tablas
// Reglas / Condiciones_Regla / Acciones_Regla para Google Sheets. Una vez
// cargada en Sheets, la base se administra desde AppSheet: este archivo es
// solo la carga inicial.
//
// Convenciones que valida `validacion.ts` y que implementa el motor:
// - hechos en minúscula (`ingreso_neto`), parámetros en MAYÚSCULA (`SMMLV`);
// - todas las condiciones de una regla se unen con Y;
// - una comparación contra un hecho sin valor es falsa (salvo NO_EXISTE);
// - las reglas se disparan por Prioridad ascendente, una vez cada una, y el
//   motor vuelve a evaluar la agenda tras cada disparo (encadenamiento hacia
//   adelante): una regla puede habilitar a otra al escribir un hecho;
// - las reglas de "Consolidación" (prioridad ≥ 90) leen los contadores del
//   motor, por eso van al final.

import { PRICING_PLANS } from "@/constants/pricing-plans";
import { SEPARADOR_LISTA } from "@/sistema-experto/motor/motor";
import {
  ESTADOS_SOLICITUD,
  PAGADORES_ARL,
  TIPOS_VINCULACION,
  fecha,
  type CategoriaRegla,
  type EstadoVerificacion,
  type Fila,
  type NivelImpacto,
  type Operador,
  type OrigenHecho,
  type TipoAccion,
  type TipoDatoHecho,
  type TipoValor,
} from "./esquema";

export interface DefinicionHecho {
  id: string;
  descripcion: string;
  tipo: TipoDatoHecho;
  origen: OrigenHecho;
  fuenteDato?: string;
  porDefecto?: string;
  valores?: readonly string[];
}

export interface DefinicionParametro {
  id: string;
  nombre: string;
  valor: number;
  unidad: string;
  vigenciaDesde: string;
  fuente: string;
  estado: EstadoVerificacion;
}

export interface DefinicionCondicion {
  hecho: string;
  operador: Operador;
  tipoValor?: TipoValor;
  valor?: string;
}

export interface DefinicionAccion {
  tipo: TipoAccion;
  destino?: string;
  valor: string;
}

export interface DefinicionRegla {
  id: string;
  nombre: string;
  enunciado: string;
  categoria: CategoriaRegla;
  prioridad: number;
  nivel: NivelImpacto;
  si: DefinicionCondicion[];
  entonces: DefinicionAccion[];
  explicacion: string;
  fuente: string;
  estado: EstadoVerificacion;
}

// ---------------------------------------------------------------------------
// Fuentes (consultadas el 13-09-2026)
// ---------------------------------------------------------------------------

const FUENTE = {
  ugpp: "UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (enero de 2026); Ley 2277 de 2022, art. 89.",
  decreto379:
    "Decreto 0379 de 2026 (depuración de costos antes de aplicar el 40 %), según Portafolio (abril de 2026). Pendiente contrastar con el texto oficial.",
  arlContratistas:
    "UGPP, «ABC Trabajador independiente con contrato de prestación de servicios» (2026); Decreto 723 de 2013; Ley 1562 de 2012, art. 2.",
  arlCuentaPropia:
    "Ley 1562 de 2012, art. 2 (independientes en actividades de alto riesgo). Falta validar cómo aplica a quien trabaja por cuenta propia.",
  tarifasArl:
    "Decreto 1772 de 1994, art. 13 (tarifa inicial por clase de riesgo).",
  datos: "Ley 1581 de 2012, art. 9 (autorización previa del titular).",
  smmlv:
    "Decreto 1469 de 2025 (SMMLV 2026). Valor confirmado en fuentes secundarias concordantes (Holland & Knight, Alegra).",
  planes: "Catálogo de planes SolutaPLUS (constants/pricing-plans.ts).",
  interna:
    "Política interna SolutaPLUS (definida para el ejercicio académico).",
} as const;

// ---------------------------------------------------------------------------
// Hechos
// ---------------------------------------------------------------------------

const SLUGS_PLANES = PRICING_PLANS.map((plan) => plan.slug);

export const HECHOS: DefinicionHecho[] = [
  // Entrada: los arma n8n a partir de las tablas antes de llamar al motor.
  {
    id: "id_solicitud",
    descripcion: "Radicado de la solicitud evaluada.",
    tipo: "Texto",
    origen: "Entrada",
    fuenteDato: "Solicitudes.ID_Solicitud",
  },
  {
    id: "tipo_vinculacion",
    descripcion: "Cómo trabaja el solicitante.",
    tipo: "Texto",
    origen: "Entrada",
    fuenteDato: "Solicitudes.Tipo_Vinculacion",
    valores: TIPOS_VINCULACION,
  },
  {
    id: "ingreso_mensual",
    descripcion: "Ingreso mensual bruto sin IVA.",
    tipo: "Número",
    origen: "Entrada",
    fuenteDato: "Solicitudes.Ingreso_Mensual",
  },
  {
    id: "costos_deducibles",
    descripcion: "Costos de la actividad por cuenta propia.",
    tipo: "Número",
    origen: "Entrada",
    fuenteDato: "Solicitudes.Costos_Deducibles",
    porDefecto: "0",
  },
  {
    id: "duracion_contrato_dias",
    descripcion: "Duración del contrato de prestación de servicios, en días.",
    tipo: "Número",
    origen: "Entrada",
    fuenteDato: "Solicitudes.Duracion_Contrato_Dias",
  },
  {
    id: "clase_riesgo",
    descripcion: "Clase de riesgo ARL (1 a 5) de la actividad económica.",
    tipo: "Número",
    origen: "Entrada",
    fuenteDato:
      "Actividades_Economicas.ID_Clase (vía Solicitudes.ID_Actividad)",
  },
  {
    id: "tarifa_arl",
    descripcion: "Tarifa inicial de ARL (%) de la clase de riesgo.",
    tipo: "Número",
    origen: "Entrada",
    fuenteDato: "Clases_Riesgo.Tarifa_ARL_Pct (vía la actividad económica)",
  },
  {
    id: "numero_trabajadores",
    descripcion: "Trabajadores que un empleador quiere afiliar.",
    tipo: "Número",
    origen: "Entrada",
    fuenteDato: "Solicitudes.Numero_Trabajadores",
  },
  {
    id: "autoriza_datos",
    descripcion: "Si el solicitante autorizó el tratamiento de sus datos.",
    tipo: "SI/NO",
    origen: "Entrada",
    fuenteDato: "Solicitantes.Autoriza_Datos",
    porDefecto: "NO",
  },
  {
    id: "plan_solicitado",
    descripcion: "Plan que eligió el solicitante.",
    tipo: "Texto",
    origen: "Entrada",
    fuenteDato: "Solicitudes.ID_Plan",
    valores: SLUGS_PLANES,
  },
  {
    id: "porcentaje_documentos",
    descripcion:
      "Porcentaje de documentos obligatorios recibidos para su tipo de vinculación.",
    tipo: "Número",
    origen: "Entrada",
    fuenteDato:
      "Calculado: Documentos_Solicitud en estado Recibido ÷ Documentos_Requeridos obligatorios que aplican × 100",
  },
  {
    id: "horas_sin_gestion",
    descripcion: "Horas transcurridas desde la última gestión de la solicitud.",
    tipo: "Número",
    origen: "Entrada",
    fuenteDato:
      "Calculado: momento de la evaluación − Solicitudes.Fecha_Ultima_Gestion",
  },

  // Derivados: solo los escriben las reglas.
  {
    id: "ingreso_neto",
    descripcion: "Ingreso sobre el que se determina la obligación de cotizar.",
    tipo: "Número",
    origen: "Derivado",
  },
  {
    id: "obligado_cotizar",
    descripcion: "Si está obligado a cotizar a Salud y Pensión.",
    tipo: "SI/NO",
    origen: "Derivado",
  },
  {
    id: "ibc_calculado",
    descripcion: "IBC antes de aplicar el mínimo y el tope legales.",
    tipo: "Número",
    origen: "Derivado",
  },
  {
    id: "ibc",
    descripcion: "Ingreso base de cotización final.",
    tipo: "Número",
    origen: "Derivado",
  },
  {
    id: "arl_obligatoria",
    descripcion: "Si la afiliación a ARL es obligatoria.",
    tipo: "SI/NO",
    origen: "Derivado",
  },
  {
    id: "arl_pagador",
    descripcion: "Quién paga la ARL.",
    tipo: "Texto",
    origen: "Derivado",
    valores: PAGADORES_ARL,
  },
  {
    id: "aporte_salud",
    descripcion: "Aporte mensual a Salud.",
    tipo: "Número",
    origen: "Derivado",
  },
  {
    id: "aporte_pension",
    descripcion: "Aporte mensual a Pensión.",
    tipo: "Número",
    origen: "Derivado",
  },
  {
    id: "aporte_arl",
    descripcion: "Aporte mensual a ARL.",
    tipo: "Número",
    origen: "Derivado",
  },
  {
    id: "total_aportes_cliente",
    descripcion: "Total mensual estimado a cargo del solicitante.",
    tipo: "Número",
    origen: "Derivado",
  },
  {
    id: "plan_sugerido",
    descripcion: "Plan que el sistema recomienda.",
    tipo: "Texto",
    origen: "Derivado",
    valores: SLUGS_PLANES,
  },
  {
    id: "estado_sugerido",
    descripcion: "Estado que el sistema sugiere para la solicitud.",
    tipo: "Texto",
    origen: "Derivado",
    valores: ESTADOS_SOLICITUD,
  },
  {
    id: "escalar_supervisor",
    descripcion: "Si la solicitud debe escalarse al supervisor.",
    tipo: "SI/NO",
    origen: "Derivado",
  },

  // Motor: contadores que actualiza el motor al activar cada regla.
  {
    id: "num_reglas_criticas",
    descripcion: "Reglas de impacto Crítico activadas hasta el momento.",
    tipo: "Número",
    origen: "Motor",
  },
  {
    id: "num_reglas_advertencia",
    descripcion: "Reglas de impacto Advertencia activadas hasta el momento.",
    tipo: "Número",
    origen: "Motor",
  },
];

// ---------------------------------------------------------------------------
// Parámetros
// ---------------------------------------------------------------------------

export const PARAMETROS: DefinicionParametro[] = [
  {
    id: "SMMLV",
    nombre: "Salario mínimo mensual legal vigente",
    valor: 1_750_905,
    unidad: "COP",
    vigenciaDesde: "2026-01-01",
    fuente: FUENTE.smmlv,
    estado: "Verificado",
  },
  {
    id: "PCT_IBC_INDEPENDIENTE",
    nombre: "Porcentaje del ingreso que forma el IBC de un independiente",
    valor: 40,
    unidad: "%",
    vigenciaDesde: "2026-01-01",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "IBC_MIN_SMMLV",
    nombre: "IBC mínimo",
    valor: 1,
    unidad: "SMMLV",
    vigenciaDesde: "2026-01-01",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "IBC_MAX_SMMLV",
    nombre: "IBC máximo (tope)",
    valor: 25,
    unidad: "SMMLV",
    vigenciaDesde: "2026-01-01",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "TARIFA_SALUD",
    nombre: "Tarifa de cotización a Salud del independiente",
    valor: 12.5,
    unidad: "%",
    vigenciaDesde: "2026-01-01",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "TARIFA_PENSION",
    nombre: "Tarifa de cotización a Pensión del independiente",
    valor: 16,
    unidad: "%",
    vigenciaDesde: "2026-01-01",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "DIAS_MIN_ARL_OBLIGATORIA",
    nombre: "Duración de contrato a partir de la cual la ARL es obligatoria",
    valor: 30,
    unidad: "días",
    vigenciaDesde: "2026-01-01",
    fuente: FUENTE.arlContratistas,
    estado: "Verificado",
  },
  {
    id: "CLASE_ALTO_RIESGO_MIN",
    nombre: "Clase de riesgo desde la que una actividad es de alto riesgo",
    valor: 4,
    unidad: "clase",
    vigenciaDesde: "2026-01-01",
    fuente: FUENTE.arlContratistas,
    estado: "Verificado",
  },
  {
    id: "UMBRAL_TRABAJADORES_EMPRESARIAL",
    nombre: "Trabajadores mínimos para el Plan Empresarial",
    valor: 5,
    unidad: "trabajadores",
    vigenciaDesde: "2026-09-13",
    fuente: FUENTE.planes,
    estado: "Política interna",
  },
  {
    id: "PCT_MIN_DOCUMENTOS",
    nombre: "Documentación mínima para continuar el trámite",
    valor: 100,
    unidad: "%",
    vigenciaDesde: "2026-09-13",
    fuente: FUENTE.interna,
    estado: "Política interna",
  },
  {
    id: "NUM_CRITICAS_BLOQUEO",
    nombre: "Reglas críticas que bloquean una solicitud",
    valor: 2,
    unidad: "reglas",
    vigenciaDesde: "2026-09-13",
    fuente: FUENTE.interna,
    estado: "Política interna",
  },
  {
    id: "HORAS_ESCALAMIENTO_CRITICA",
    nombre: "Horas sin gestión antes de escalar una solicitud crítica",
    valor: 24,
    unidad: "horas",
    vigenciaDesde: "2026-09-13",
    fuente: FUENTE.interna,
    estado: "Política interna",
  },
];

// ---------------------------------------------------------------------------
// Reglas
// ---------------------------------------------------------------------------

type OperadorConValor = Exclude<Operador, "EXISTE" | "NO_EXISTE">;

const cuando = (
  hecho: string,
  operador: OperadorConValor,
  valor: string | number,
): DefinicionCondicion => ({
  hecho,
  operador,
  tipoValor: "Literal",
  valor: String(valor),
});

const cuandoExpr = (
  hecho: string,
  operador: Exclude<OperadorConValor, "EN_LISTA">,
  expresion: string,
): DefinicionCondicion => ({
  hecho,
  operador,
  tipoValor: "Expresion",
  valor: expresion,
});

const existe = (hecho: string): DefinicionCondicion => ({
  hecho,
  operador: "EXISTE",
});

const noExiste = (hecho: string): DefinicionCondicion => ({
  hecho,
  operador: "NO_EXISTE",
});

const enLista = (...valores: string[]) => valores.join(SEPARADOR_LISTA);

const asignar = (destino: string, valor: string): DefinicionAccion => ({
  tipo: "ASIGNAR",
  destino,
  valor,
});

const calcular = (destino: string, expresion: string): DefinicionAccion => ({
  tipo: "CALCULAR",
  destino,
  valor: expresion,
});

const concluir = (texto: string): DefinicionAccion => ({
  tipo: "CONCLUIR",
  valor: texto,
});

const recomendar = (texto: string): DefinicionAccion => ({
  tipo: "RECOMENDAR",
  valor: texto,
});

const alertar = (texto: string): DefinicionAccion => ({
  tipo: "ALERTAR",
  valor: texto,
});

export const REGLAS: DefinicionRegla[] = [
  // --- Validación de datos -------------------------------------------------
  {
    id: "R01",
    nombre: "Ingreso mensual no reportado",
    enunciado:
      "SI el solicitante es independiente (contratista o cuenta propia) Y no reportó ingreso mensual ENTONCES la solicitud es crítica, porque no se puede determinar si está obligado a cotizar.",
    categoria: "Validación de datos",
    prioridad: 10,
    nivel: "Crítico",
    si: [
      cuando(
        "tipo_vinculacion",
        "EN_LISTA",
        enLista("Contratista", "Cuenta propia"),
      ),
      noExiste("ingreso_mensual"),
    ],
    entonces: [
      concluir(
        "Falta el ingreso mensual: no se puede determinar la obligación de cotizar.",
      ),
    ],
    explicacion:
      "La solicitud es de un trabajador «{tipo_vinculacion}», pero no registra ingreso mensual. Sin ese dato no se puede aplicar la regla de obligatoriedad (ingresos de 1 SMMLV o más).",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "R02",
    nombre: "Sin autorización de tratamiento de datos",
    enunciado:
      "SI el solicitante no autorizó el tratamiento de sus datos personales ENTONCES la solicitud es crítica y se alerta al equipo.",
    categoria: "Validación de datos",
    prioridad: 11,
    nivel: "Crítico",
    si: [cuando("autoriza_datos", "!=", "SI")],
    entonces: [
      alertar(
        "Solicitud {id_solicitud}: el solicitante no ha autorizado el tratamiento de sus datos (Ley 1581 de 2012).",
      ),
    ],
    explicacion:
      "El solicitante no ha dado autorización previa para el tratamiento de sus datos personales; sin ella la solicitud no puede gestionarse.",
    fuente: FUENTE.datos,
    estado: "Verificado",
  },

  // --- Ingreso base de cotización ------------------------------------------
  {
    id: "R03",
    nombre: "Ingreso neto de un contratista",
    enunciado:
      "SI es contratista de prestación de servicios Y reportó ingreso ENTONCES su ingreso neto es el valor mensual del contrato, sin deducir costos.",
    categoria: "Ingreso base de cotización",
    prioridad: 20,
    nivel: "Normal",
    si: [
      cuando("tipo_vinculacion", "=", "Contratista"),
      existe("ingreso_mensual"),
    ],
    entonces: [calcular("ingreso_neto", "ingreso_mensual")],
    explicacion:
      "A un contratista de prestación de servicios no se le deducen costos: el ingreso neto es el valor mensual del contrato sin IVA, {ingreso_neto|moneda}.",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "R04",
    nombre: "Ingreso neto de un independiente por cuenta propia",
    enunciado:
      "SI es independiente por cuenta propia Y reportó ingreso ENTONCES su ingreso neto es el ingreso menos los costos deducibles.",
    categoria: "Ingreso base de cotización",
    prioridad: 21,
    nivel: "Normal",
    si: [
      cuando("tipo_vinculacion", "=", "Cuenta propia"),
      existe("ingreso_mensual"),
    ],
    entonces: [
      calcular("ingreso_neto", "MAX(ingreso_mensual - costos_deducibles, 0)"),
    ],
    explicacion:
      "Al ingreso de {ingreso_mensual|moneda} se le restan costos deducibles por {costos_deducibles|moneda}, lo que deja un ingreso neto de {ingreso_neto|moneda}.",
    fuente: FUENTE.decreto379,
    estado: "Por validar",
  },
  {
    id: "R05",
    nombre: "Costos deducidos que requieren soporte",
    enunciado:
      "SI es independiente por cuenta propia Y dedujo costos ENTONCES se deben pedir los soportes de esos costos.",
    categoria: "Ingreso base de cotización",
    prioridad: 22,
    nivel: "Advertencia",
    si: [
      cuando("tipo_vinculacion", "=", "Cuenta propia"),
      cuando("costos_deducibles", ">", 0),
    ],
    entonces: [
      recomendar(
        "Pedir los soportes de los costos deducidos ({costos_deducibles|moneda}).",
      ),
    ],
    explicacion:
      "Se dedujeron {costos_deducibles|moneda} de costos antes de calcular el IBC. Si no hay soportes, la UGPP puede aplicar costos presuntos y el aporte cambiaría.",
    fuente: FUENTE.decreto379,
    estado: "Por validar",
  },

  // --- Obligatoriedad -------------------------------------------------------
  {
    id: "R06",
    nombre: "Obligado a cotizar a Salud y Pensión",
    enunciado:
      "SI el ingreso neto es mayor o igual a 1 SMMLV ENTONCES está obligado a cotizar a Salud y Pensión.",
    categoria: "Obligatoriedad",
    prioridad: 30,
    nivel: "Normal",
    si: [cuandoExpr("ingreso_neto", ">=", "SMMLV")],
    entonces: [
      asignar("obligado_cotizar", "SI"),
      concluir(
        "Obligado a cotizar a Salud ({TARIFA_SALUD} %) y Pensión ({TARIFA_PENSION} %).",
      ),
    ],
    explicacion:
      "El ingreso neto ({ingreso_neto|moneda}) es igual o superior a 1 SMMLV ({SMMLV|moneda}), así que la afiliación a Salud y Pensión es obligatoria.",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "R07",
    nombre: "No obligado a cotizar",
    enunciado:
      "SI el ingreso neto es menor a 1 SMMLV ENTONCES no está obligado a cotizar y se le ofrece la cotización voluntaria.",
    categoria: "Obligatoriedad",
    prioridad: 31,
    nivel: "Advertencia",
    si: [cuandoExpr("ingreso_neto", "<", "SMMLV")],
    entonces: [
      asignar("obligado_cotizar", "NO"),
      recomendar(
        "Ofrecer la cotización voluntaria sobre 1 SMMLV ({SMMLV|moneda}).",
      ),
    ],
    explicacion:
      "El ingreso neto ({ingreso_neto|moneda}) es menor a 1 SMMLV ({SMMLV|moneda}): no hay obligación de cotizar, pero conviene ofrecer la cotización voluntaria para no perder cobertura.",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },

  // --- IBC ------------------------------------------------------------------
  {
    id: "R08",
    nombre: "Cálculo del IBC",
    enunciado:
      "SI está obligado a cotizar ENTONCES el IBC es el {PCT_IBC_INDEPENDIENTE} % del ingreso neto.",
    categoria: "Ingreso base de cotización",
    prioridad: 40,
    nivel: "Normal",
    si: [cuando("obligado_cotizar", "=", "SI")],
    entonces: [
      calcular("ibc_calculado", "ingreso_neto * PCT_IBC_INDEPENDIENTE / 100"),
      calcular("ibc", "ibc_calculado"),
    ],
    explicacion:
      "El IBC de un independiente es el {PCT_IBC_INDEPENDIENTE} % del ingreso neto: {ingreso_neto|moneda} × {PCT_IBC_INDEPENDIENTE} % = {ibc_calculado|moneda}.",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "R09",
    nombre: "IBC ajustado al mínimo legal",
    enunciado:
      "SI está obligado a cotizar Y el IBC calculado es menor a {IBC_MIN_SMMLV} SMMLV ENTONCES el IBC se ajusta a {IBC_MIN_SMMLV} SMMLV.",
    categoria: "Ingreso base de cotización",
    prioridad: 41,
    nivel: "Normal",
    si: [
      cuando("obligado_cotizar", "=", "SI"),
      cuandoExpr("ibc_calculado", "<", "SMMLV * IBC_MIN_SMMLV"),
    ],
    entonces: [
      calcular("ibc", "SMMLV * IBC_MIN_SMMLV"),
      concluir("IBC ajustado al mínimo legal: {ibc|moneda}."),
    ],
    explicacion:
      "El {PCT_IBC_INDEPENDIENTE} % del ingreso ({ibc_calculado|moneda}) quedó por debajo del mínimo legal, así que se cotiza sobre {IBC_MIN_SMMLV} SMMLV: {ibc|moneda}.",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "R10",
    nombre: "IBC limitado al tope legal",
    enunciado:
      "SI está obligado a cotizar Y el IBC calculado supera {IBC_MAX_SMMLV} SMMLV ENTONCES el IBC se limita a {IBC_MAX_SMMLV} SMMLV y se verifican los ingresos.",
    categoria: "Ingreso base de cotización",
    prioridad: 42,
    nivel: "Advertencia",
    si: [
      cuando("obligado_cotizar", "=", "SI"),
      cuandoExpr("ibc_calculado", ">", "SMMLV * IBC_MAX_SMMLV"),
    ],
    entonces: [
      calcular("ibc", "SMMLV * IBC_MAX_SMMLV"),
      recomendar(
        "Verificar los ingresos reportados: el IBC llegó al tope de {IBC_MAX_SMMLV} SMMLV.",
      ),
    ],
    explicacion:
      "El IBC calculado ({ibc_calculado|moneda}) supera el tope de {IBC_MAX_SMMLV} SMMLV, así que se limita a {ibc|moneda}. Conviene verificar los ingresos reportados.",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },

  // --- Riesgos laborales ----------------------------------------------------
  {
    id: "R11",
    nombre: "ARL obligatoria por alto riesgo (contratista)",
    enunciado:
      "SI es contratista Y su actividad es de clase de riesgo {CLASE_ALTO_RIESGO_MIN} o superior ENTONCES la ARL es obligatoria y la paga el contratante.",
    categoria: "Riesgos laborales",
    prioridad: 50,
    nivel: "Advertencia",
    si: [
      cuando("tipo_vinculacion", "=", "Contratista"),
      cuandoExpr("clase_riesgo", ">=", "CLASE_ALTO_RIESGO_MIN"),
    ],
    entonces: [
      asignar("arl_obligatoria", "SI"),
      asignar("arl_pagador", "Contratante"),
      concluir(
        "ARL obligatoria por alto riesgo (clase {clase_riesgo}); la paga el contratante.",
      ),
    ],
    explicacion:
      "La actividad es de clase de riesgo {clase_riesgo}. Un contratista en actividades de alto riesgo (clase {CLASE_ALTO_RIESGO_MIN} o superior) debe estar afiliado a ARL sin importar la duración del contrato, y el pago lo hace el contratante.",
    fuente: FUENTE.arlContratistas,
    estado: "Verificado",
  },
  {
    id: "R12",
    nombre: "Alto riesgo en un independiente por cuenta propia",
    enunciado:
      "SI es independiente por cuenta propia Y su actividad es de clase de riesgo {CLASE_ALTO_RIESGO_MIN} o superior ENTONCES un asesor debe validar la afiliación obligatoria a ARL.",
    categoria: "Riesgos laborales",
    prioridad: 51,
    nivel: "Advertencia",
    si: [
      cuando("tipo_vinculacion", "=", "Cuenta propia"),
      cuandoExpr("clase_riesgo", ">=", "CLASE_ALTO_RIESGO_MIN"),
    ],
    entonces: [
      recomendar(
        "Validar con un asesor la afiliación a ARL por actividad de alto riesgo (clase {clase_riesgo}).",
      ),
    ],
    explicacion:
      "La actividad es de clase de riesgo {clase_riesgo} (alto riesgo). La ley obliga a afiliar a ARL a los independientes en actividades de alto riesgo; para quien trabaja por cuenta propia, un asesor debe confirmar cómo se hace la afiliación y quién la paga.",
    fuente: FUENTE.arlCuentaPropia,
    estado: "Por validar",
  },
  {
    id: "R13",
    nombre: "ARL obligatoria por duración del contrato",
    enunciado:
      "SI es contratista Y el contrato dura más de {DIAS_MIN_ARL_OBLIGATORIA} días Y su actividad es de clase de riesgo menor a {CLASE_ALTO_RIESGO_MIN} ENTONCES la ARL es obligatoria y la paga el contratista.",
    categoria: "Riesgos laborales",
    prioridad: 52,
    nivel: "Normal",
    si: [
      cuando("tipo_vinculacion", "=", "Contratista"),
      cuandoExpr("duracion_contrato_dias", ">", "DIAS_MIN_ARL_OBLIGATORIA"),
      cuandoExpr("clase_riesgo", "<", "CLASE_ALTO_RIESGO_MIN"),
    ],
    entonces: [
      asignar("arl_obligatoria", "SI"),
      asignar("arl_pagador", "Contratista"),
      concluir(
        "ARL obligatoria (contrato de {duracion_contrato_dias} días); la paga el contratista.",
      ),
    ],
    explicacion:
      "El contrato dura {duracion_contrato_dias} días (más de {DIAS_MIN_ARL_OBLIGATORIA}) y la actividad es de clase {clase_riesgo}: la afiliación a ARL es obligatoria y el pago corre por cuenta del contratista.",
    fuente: FUENTE.arlContratistas,
    estado: "Verificado",
  },
  {
    id: "R14",
    nombre: "ARL voluntaria en contrato corto",
    enunciado:
      "SI es contratista Y el contrato dura {DIAS_MIN_ARL_OBLIGATORIA} días o menos Y su actividad es de clase de riesgo menor a {CLASE_ALTO_RIESGO_MIN} ENTONCES la ARL es voluntaria.",
    categoria: "Riesgos laborales",
    prioridad: 53,
    nivel: "Normal",
    si: [
      cuando("tipo_vinculacion", "=", "Contratista"),
      cuandoExpr("duracion_contrato_dias", "<=", "DIAS_MIN_ARL_OBLIGATORIA"),
      cuandoExpr("clase_riesgo", "<", "CLASE_ALTO_RIESGO_MIN"),
    ],
    entonces: [
      asignar("arl_obligatoria", "NO"),
      recomendar("Ofrecer la afiliación voluntaria a ARL."),
    ],
    explicacion:
      "El contrato dura {duracion_contrato_dias} días ({DIAS_MIN_ARL_OBLIGATORIA} o menos) y la actividad no es de alto riesgo: la afiliación a ARL no es obligatoria.",
    fuente: FUENTE.arlContratistas,
    estado: "Verificado",
  },
  {
    id: "R15",
    nombre: "Actividad económica sin clasificar",
    enunciado:
      "SI es independiente Y no tiene actividad económica registrada ENTONCES no se puede determinar la clase de riesgo de ARL.",
    categoria: "Riesgos laborales",
    prioridad: 54,
    nivel: "Advertencia",
    si: [
      cuando(
        "tipo_vinculacion",
        "EN_LISTA",
        enLista("Contratista", "Cuenta propia"),
      ),
      noExiste("clase_riesgo"),
    ],
    entonces: [
      recomendar(
        "Registrar la actividad económica para determinar la clase de riesgo y la tarifa de ARL.",
      ),
    ],
    explicacion:
      "No hay actividad económica registrada, así que no se puede determinar la clase de riesgo ni la tarifa de ARL.",
    fuente: FUENTE.interna,
    estado: "Política interna",
  },
  {
    // Sin esta regla, un contratista sin duración no activaba ni R13 ni R14
    // (sus comparaciones contra un hecho vacío son falsas) y quedaba sin
    // ninguna conclusión sobre ARL y sin aviso.
    id: "R16",
    nombre: "Duración del contrato no reportada",
    enunciado:
      "SI es contratista Y no reportó la duración del contrato ENTONCES no se puede determinar si la ARL es obligatoria.",
    categoria: "Riesgos laborales",
    prioridad: 55,
    nivel: "Advertencia",
    si: [
      cuando("tipo_vinculacion", "=", "Contratista"),
      noExiste("duracion_contrato_dias"),
    ],
    entonces: [
      recomendar(
        "Registrar la duración del contrato para determinar si la ARL es obligatoria.",
      ),
    ],
    explicacion:
      "La afiliación a ARL de un contratista depende de si el contrato dura más de {DIAS_MIN_ARL_OBLIGATORIA} días, y la solicitud no registra la duración.",
    fuente: FUENTE.arlContratistas,
    estado: "Verificado",
  },

  // --- Liquidación ----------------------------------------------------------
  {
    id: "R17",
    nombre: "Liquidación de Salud y Pensión",
    enunciado:
      "SI hay IBC ENTONCES se liquidan los aportes a Salud ({TARIFA_SALUD} %) y Pensión ({TARIFA_PENSION} %).",
    categoria: "Liquidación",
    prioridad: 60,
    nivel: "Normal",
    si: [existe("ibc")],
    entonces: [
      calcular("aporte_salud", "ibc * TARIFA_SALUD / 100"),
      calcular("aporte_pension", "ibc * TARIFA_PENSION / 100"),
      calcular("total_aportes_cliente", "aporte_salud + aporte_pension"),
    ],
    explicacion:
      "Sobre un IBC de {ibc|moneda}: Salud {TARIFA_SALUD} % = {aporte_salud|moneda}; Pensión {TARIFA_PENSION} % = {aporte_pension|moneda}.",
    fuente: FUENTE.ugpp,
    estado: "Verificado",
  },
  {
    id: "R18",
    nombre: "Liquidación de ARL a cargo del contratista",
    enunciado:
      "SI la ARL la paga el contratista Y hay IBC y tarifa ENTONCES se liquida la ARL y se suma al total del solicitante.",
    categoria: "Liquidación",
    prioridad: 61,
    nivel: "Normal",
    si: [
      cuando("arl_pagador", "=", "Contratista"),
      existe("ibc"),
      existe("tarifa_arl"),
      existe("total_aportes_cliente"),
    ],
    entonces: [
      calcular("aporte_arl", "ibc * tarifa_arl / 100"),
      calcular("total_aportes_cliente", "total_aportes_cliente + aporte_arl"),
    ],
    explicacion:
      "ARL de clase {clase_riesgo} con tarifa de {tarifa_arl} %: {aporte_arl|moneda}. Total mensual estimado a cargo del solicitante: {total_aportes_cliente|moneda}.",
    fuente: FUENTE.tarifasArl,
    estado: "Verificado",
  },
  {
    id: "R19",
    nombre: "Liquidación de ARL a cargo del contratante",
    enunciado:
      "SI la ARL la paga el contratante Y hay IBC y tarifa ENTONCES se liquida la ARL como aporte del contratante, sin sumarla al total del solicitante.",
    categoria: "Liquidación",
    prioridad: 62,
    nivel: "Normal",
    si: [
      cuando("arl_pagador", "=", "Contratante"),
      existe("ibc"),
      existe("tarifa_arl"),
      existe("total_aportes_cliente"),
    ],
    entonces: [
      calcular("aporte_arl", "ibc * tarifa_arl / 100"),
      concluir("Aporte de ARL a cargo del contratante: {aporte_arl|moneda}."),
    ],
    explicacion:
      "ARL de clase {clase_riesgo} con tarifa de {tarifa_arl} %: {aporte_arl|moneda}. Lo paga el contratante, así que no se suma al total del solicitante ({total_aportes_cliente|moneda}).",
    fuente: FUENTE.tarifasArl,
    estado: "Verificado",
  },

  // --- Coherencia comercial -------------------------------------------------
  {
    id: "R20",
    nombre: "Plan Básico sin la Pensión obligatoria",
    enunciado:
      "SI pidió el Plan Básico Y está obligado a cotizar Pensión ENTONCES se sugiere el Plan Integral.",
    categoria: "Coherencia comercial",
    prioridad: 70,
    nivel: "Advertencia",
    si: [
      cuando("plan_solicitado", "=", "basico"),
      cuando("obligado_cotizar", "=", "SI"),
    ],
    entonces: [
      asignar("plan_sugerido", "integral"),
      recomendar("Sugerir el Plan Integral: incluye la Pensión obligatoria."),
    ],
    explicacion:
      "El Plan Básico solo incluye Salud y ARL, pero el solicitante está obligado a cotizar Pensión. El plan que cubre su obligación es el Integral.",
    fuente: `${FUENTE.planes} ${FUENTE.ugpp}`,
    estado: "Política interna",
  },
  {
    id: "R21",
    nombre: "Plan Básico con riesgo superior a I",
    enunciado:
      "SI pidió el Plan Básico Y su actividad es de clase de riesgo mayor a I ENTONCES se sugiere el Plan Integral.",
    categoria: "Coherencia comercial",
    prioridad: 71,
    nivel: "Advertencia",
    si: [
      cuando("plan_solicitado", "=", "basico"),
      cuando("clase_riesgo", ">", 1),
    ],
    entonces: [
      asignar("plan_sugerido", "integral"),
      recomendar(
        "Sugerir el Plan Integral: cubre ARL para la clase de riesgo {clase_riesgo}.",
      ),
    ],
    explicacion:
      "El Plan Básico cubre ARL solo en riesgo I y la actividad es de clase {clase_riesgo}. El plan adecuado es el Integral.",
    fuente: FUENTE.planes,
    estado: "Política interna",
  },
  {
    id: "R22",
    nombre: "Empresa apta para el Plan Empresarial",
    enunciado:
      "SI es empleador Y tiene {UMBRAL_TRABAJADORES_EMPRESARIAL} o más trabajadores ENTONCES se sugiere el Plan Empresarial.",
    categoria: "Coherencia comercial",
    prioridad: 72,
    nivel: "Normal",
    si: [
      cuando("tipo_vinculacion", "=", "Empleador"),
      cuandoExpr(
        "numero_trabajadores",
        ">=",
        "UMBRAL_TRABAJADORES_EMPRESARIAL",
      ),
    ],
    entonces: [
      asignar("plan_sugerido", "empresarial"),
      recomendar(
        "Ofrecer el Plan Empresarial para {numero_trabajadores} trabajadores.",
      ),
    ],
    explicacion:
      "La empresa tiene {numero_trabajadores} trabajadores (umbral: {UMBRAL_TRABAJADORES_EMPRESARIAL}), así que le corresponde el Plan Empresarial con cotización por volumen.",
    fuente: FUENTE.planes,
    estado: "Política interna",
  },
  {
    id: "R23",
    nombre: "Empleador por debajo del umbral empresarial",
    enunciado:
      "SI es empleador Y tiene menos de {UMBRAL_TRABAJADORES_EMPRESARIAL} trabajadores ENTONCES un asesor evalúa la afiliación individual.",
    categoria: "Coherencia comercial",
    prioridad: 73,
    nivel: "Advertencia",
    si: [
      cuando("tipo_vinculacion", "=", "Empleador"),
      cuandoExpr("numero_trabajadores", "<", "UMBRAL_TRABAJADORES_EMPRESARIAL"),
    ],
    entonces: [
      recomendar(
        "Evaluar la afiliación individual de los {numero_trabajadores} trabajadores.",
      ),
    ],
    explicacion:
      "La empresa tiene {numero_trabajadores} trabajadores, por debajo del umbral de {UMBRAL_TRABAJADORES_EMPRESARIAL} del Plan Empresarial; un asesor debe evaluar la afiliación individual.",
    fuente: FUENTE.planes,
    estado: "Política interna",
  },

  // --- Documentación --------------------------------------------------------
  {
    id: "R24",
    nombre: "Documentación incompleta",
    enunciado:
      "SI los documentos obligatorios recibidos están por debajo del {PCT_MIN_DOCUMENTOS} % ENTONCES se piden los faltantes.",
    categoria: "Documentación",
    prioridad: 80,
    nivel: "Advertencia",
    si: [cuandoExpr("porcentaje_documentos", "<", "PCT_MIN_DOCUMENTOS")],
    entonces: [
      recomendar(
        "Pedir los documentos obligatorios que faltan ({porcentaje_documentos} % completo).",
      ),
    ],
    explicacion:
      "Solo está completo el {porcentaje_documentos} % de los documentos obligatorios (mínimo requerido: {PCT_MIN_DOCUMENTOS} %).",
    fuente: FUENTE.interna,
    estado: "Política interna",
  },

  // --- Consolidación (leen los contadores del motor) -------------------------
  {
    id: "R25",
    nombre: "Bloqueo por múltiples condiciones críticas",
    enunciado:
      "SI se activaron {NUM_CRITICAS_BLOQUEO} o más reglas críticas ENTONCES la solicitud se bloquea y se alerta.",
    categoria: "Consolidación",
    prioridad: 90,
    nivel: "Crítico",
    si: [cuandoExpr("num_reglas_criticas", ">=", "NUM_CRITICAS_BLOQUEO")],
    entonces: [
      asignar("estado_sugerido", "Bloqueada"),
      alertar(
        "Solicitud {id_solicitud} bloqueada: {num_reglas_criticas} condiciones críticas.",
      ),
    ],
    explicacion:
      "Se activaron {num_reglas_criticas} reglas críticas (umbral de bloqueo: {NUM_CRITICAS_BLOQUEO}); la solicitud queda bloqueada hasta que un asesor las resuelva.",
    fuente: FUENTE.interna,
    estado: "Política interna",
  },
  {
    id: "R26",
    nombre: "Escalamiento de solicitud crítica sin gestión",
    enunciado:
      "SI hay al menos una regla crítica Y la solicitud lleva más de {HORAS_ESCALAMIENTO_CRITICA} horas sin gestión ENTONCES se escala al supervisor.",
    categoria: "Consolidación",
    prioridad: 91,
    // Normal a propósito: escalar es una acción operativa, no evidencia nueva
    // de riesgo. Si fuera Crítico sumaría al contador y podría provocar un
    // bloqueo (R25) solo por el paso del tiempo.
    nivel: "Normal",
    si: [
      cuando("num_reglas_criticas", ">=", 1),
      cuandoExpr("horas_sin_gestion", ">", "HORAS_ESCALAMIENTO_CRITICA"),
    ],
    entonces: [
      asignar("escalar_supervisor", "SI"),
      alertar(
        "Escalamiento: la solicitud crítica {id_solicitud} lleva {horas_sin_gestion} horas sin gestión.",
      ),
    ],
    explicacion:
      "La solicitud tiene condiciones críticas y lleva {horas_sin_gestion} horas sin gestión (límite: {HORAS_ESCALAMIENTO_CRITICA}); se escala al supervisor.",
    fuente: FUENTE.interna,
    estado: "Política interna",
  },
  {
    id: "R27",
    nombre: "Solicitud viable",
    enunciado:
      "SI no se activó ninguna regla crítica ni de advertencia ENTONCES la solicitud es viable y se sugiere aprobarla.",
    categoria: "Consolidación",
    prioridad: 92,
    nivel: "Normal",
    si: [
      cuando("num_reglas_criticas", "=", 0),
      cuando("num_reglas_advertencia", "=", 0),
    ],
    entonces: [
      asignar("estado_sugerido", "Aprobada"),
      concluir(
        "Solicitud viable según las reglas configuradas; un asesor valida la decisión final.",
      ),
    ],
    explicacion:
      "No se activó ninguna regla crítica ni de advertencia: la solicitud cumple todas las condiciones configuradas. Un asesor valida la decisión final.",
    fuente: FUENTE.interna,
    estado: "Política interna",
  },
  {
    id: "R28",
    nombre: "Solicitud pendiente de documentos",
    enunciado:
      "SI los documentos están incompletos Y la solicitud no quedó bloqueada ENTONCES el estado sugerido es «Pendiente documentos».",
    categoria: "Consolidación",
    prioridad: 93,
    nivel: "Normal",
    si: [
      cuandoExpr("porcentaje_documentos", "<", "PCT_MIN_DOCUMENTOS"),
      noExiste("estado_sugerido"),
    ],
    entonces: [
      asignar("estado_sugerido", "Pendiente documentos"),
      concluir("Solicitud pendiente de documentos."),
    ],
    explicacion:
      "Faltan documentos obligatorios ({porcentaje_documentos} % completo) y la solicitud no está bloqueada, así que queda pendiente de documentos.",
    fuente: FUENTE.interna,
    estado: "Política interna",
  },
  {
    id: "R29",
    nombre: "Solicitud que requiere revisión",
    enunciado:
      "SI ninguna regla anterior definió el estado de la solicitud ENTONCES el estado sugerido es «En revisión».",
    categoria: "Consolidación",
    prioridad: 99,
    nivel: "Normal",
    si: [noExiste("estado_sugerido")],
    entonces: [
      asignar("estado_sugerido", "En revisión"),
      concluir("La solicitud requiere revisión de un asesor."),
    ],
    explicacion:
      "La solicitud no es viable sin revisión, pero tampoco llega al umbral de bloqueo ({NUM_CRITICAS_BLOQUEO} críticas), así que un asesor debe revisarla. Advertencias: {num_reglas_advertencia} · Críticas: {num_reglas_criticas}.",
    fuente: FUENTE.interna,
    estado: "Política interna",
  },
];

// ---------------------------------------------------------------------------
// Aplanado a filas de Google Sheets
// ---------------------------------------------------------------------------

export function filasHechos(): Fila[] {
  return HECHOS.map((hecho) => ({
    ID_Hecho: hecho.id,
    Descripcion: hecho.descripcion,
    Tipo_Dato: hecho.tipo,
    Origen: hecho.origen,
    Fuente_Dato: hecho.fuenteDato ?? null,
    Valor_Por_Defecto: hecho.porDefecto ?? null,
    Valores_Permitidos: hecho.valores?.join(SEPARADOR_LISTA) ?? null,
  }));
}

export function filasParametros(): Fila[] {
  return PARAMETROS.map((parametro) => ({
    ID_Parametro: parametro.id,
    Nombre: parametro.nombre,
    Valor: parametro.valor,
    Unidad: parametro.unidad,
    Vigencia_Desde: fecha(parametro.vigenciaDesde),
    Fuente: parametro.fuente,
    Estado_Verificacion: parametro.estado,
  }));
}

export function filasReglas(): Fila[] {
  return REGLAS.map((regla) => ({
    ID_Regla: regla.id,
    Nombre: regla.nombre,
    Enunciado: regla.enunciado,
    Categoria: regla.categoria,
    Prioridad: regla.prioridad,
    Nivel_Impacto: regla.nivel,
    Explicacion: regla.explicacion,
    Fuente: regla.fuente,
    Estado_Verificacion: regla.estado,
    Activa: true,
  }));
}

export function filasCondiciones(): Fila[] {
  return REGLAS.flatMap((regla) =>
    regla.si.map((condicion, i) => ({
      ID_Condicion: `${regla.id}-C${i + 1}`,
      ID_Regla: regla.id,
      ID_Hecho: condicion.hecho,
      Operador: condicion.operador,
      Tipo_Valor: condicion.tipoValor ?? null,
      Valor: condicion.valor ?? null,
    })),
  );
}

export function filasAcciones(): Fila[] {
  return REGLAS.flatMap((regla) =>
    regla.entonces.map((accion, i) => ({
      ID_Accion: `${regla.id}-A${i + 1}`,
      ID_Regla: regla.id,
      Orden: i + 1,
      Tipo: accion.tipo,
      ID_Hecho_Destino: accion.destino ?? null,
      Valor: accion.valor,
    })),
  );
}
