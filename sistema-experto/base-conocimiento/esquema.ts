// Modelo de datos del proyecto final de Sistemas Expertos (Google Sheets +
// AppSheet).
//
// FUENTE ÚNICA de las tablas: `scripts/generar.ts` construye con esto el
// .xlsx que se sube a Google Drive y la documentación del modelo, y
// `validacion.ts` lo usa para comprobar la integridad de los datos semilla.
// Tablas y columnas van sin tildes ni espacios a propósito: en AppSheet se
// escriben dentro de expresiones (`[Nivel_Resultado]`) y en n8n como claves
// de JSON.

import { CITIES } from "@/constants/cities";

export type TipoColumna =
  | "Text"
  | "LongText"
  | "Name"
  | "Email"
  | "Phone"
  | "Number"
  | "Decimal"
  | "Price"
  | "Date"
  | "DateTime"
  | "Enum"
  | "EnumList"
  | "Ref"
  | "Yes/No"
  | "File"
  | "Signature"
  | "Url";

export const NOMBRES_TABLAS = [
  "Roles",
  "Usuarios",
  "Servicios",
  "Planes",
  "Plan_Servicios",
  "Clases_Riesgo",
  "Actividades_Economicas",
  "Documentos_Requeridos",
  "Solicitantes",
  "Solicitudes",
  "Documentos_Solicitud",
  "Historial_Estados",
  "Hechos",
  "Parametros",
  "Reglas",
  "Condiciones_Regla",
  "Acciones_Regla",
  "Evaluaciones",
  "Reglas_Activadas",
  "Notificaciones",
] as const;
export type NombreTabla = (typeof NOMBRES_TABLAS)[number];

export const GRUPOS_TABLA = [
  "Seguridad",
  "Catálogos",
  "Operación",
  "Base de conocimiento",
  "Resultados del motor",
] as const;
export type GrupoTabla = (typeof GRUPOS_TABLA)[number];

export interface Columna {
  nombre: string;
  tipo: TipoColumna;
  descripcion: string;
  requerida: boolean;
  clave?: boolean;
  /** Tabla destino de una columna Ref. */
  ref?: NombreTabla;
  /** En AppSheet: "Is a part of" (la fila hija vive dentro de la padre). */
  esParteDe?: boolean;
  /** Valores permitidos de una columna Enum / EnumList. */
  valores?: readonly string[];
}

export interface Tabla {
  nombre: NombreTabla;
  grupo: GrupoTabla;
  descripcion: string;
  columnas: Columna[];
}

export type ValorCelda = string | number | boolean | Date | null;
export type Fila = Record<string, ValorCelda>;
export type BaseDatos = Record<NombreTabla, Fila[]>;

/** Separador que AppSheet usa al guardar una columna EnumList en Sheets. */
export const SEPARADOR_ENUMLIST = " , ";

// ---------------------------------------------------------------------------
// Dominios (Enum)
// ---------------------------------------------------------------------------

export const TIPOS_VINCULACION = [
  "Contratista",
  "Cuenta propia",
  "Empleador",
] as const;
export type TipoVinculacion = (typeof TIPOS_VINCULACION)[number];

export const ESTADOS_SOLICITUD = [
  "Nueva",
  "En evaluación",
  "Pendiente documentos",
  "En revisión",
  "Aprobada",
  "Bloqueada",
  "Afiliada",
  "Cancelada",
] as const;
export type EstadoSolicitud = (typeof ESTADOS_SOLICITUD)[number];

/** Impacto que aporta una regla al activarse. */
export const NIVELES_IMPACTO = ["Normal", "Advertencia", "Crítico"] as const;
export type NivelImpacto = (typeof NIVELES_IMPACTO)[number];

/** Clasificación final de una solicitud (los 3 niveles que exige el curso). */
export const NIVELES_RESULTADO = [
  "Viable",
  "Requiere revisión",
  "Crítica",
] as const;
export type NivelResultado = (typeof NIVELES_RESULTADO)[number];

export const OPERADORES = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "EN_LISTA",
  "EXISTE",
  "NO_EXISTE",
] as const;
export type Operador = (typeof OPERADORES)[number];

export const TIPOS_VALOR = ["Literal", "Expresion"] as const;
export type TipoValor = (typeof TIPOS_VALOR)[number];

export const TIPOS_ACCION = [
  "ASIGNAR",
  "CALCULAR",
  "CONCLUIR",
  "RECOMENDAR",
  "ALERTAR",
] as const;
export type TipoAccion = (typeof TIPOS_ACCION)[number];

export const TIPOS_DATO_HECHO = ["Número", "Texto", "SI/NO"] as const;
export type TipoDatoHecho = (typeof TIPOS_DATO_HECHO)[number];

export const ORIGENES_HECHO = ["Entrada", "Derivado", "Motor"] as const;
export type OrigenHecho = (typeof ORIGENES_HECHO)[number];

export const ESTADOS_VERIFICACION = [
  "Verificado",
  "Por validar",
  "Política interna",
] as const;
export type EstadoVerificacion = (typeof ESTADOS_VERIFICACION)[number];

export const CATEGORIAS_REGLA = [
  "Validación de datos",
  "Ingreso base de cotización",
  "Obligatoriedad",
  "Riesgos laborales",
  "Liquidación",
  "Coherencia comercial",
  "Documentación",
  "Consolidación",
] as const;
export type CategoriaRegla = (typeof CATEGORIAS_REGLA)[number];

export const PAGADORES_ARL = ["Contratista", "Contratante"] as const;
export const ESTADOS_USUARIO = ["Activo", "Inactivo"] as const;
export const ESTADOS_DOCUMENTO = [
  "Pendiente",
  "Recibido",
  "Rechazado",
] as const;
export type EstadoDocumento = (typeof ESTADOS_DOCUMENTO)[number];
export const TIPOS_DOCUMENTO_IDENTIDAD = ["CC", "CE", "PPT", "NIT"] as const;
export type TipoDocumentoIdentidad = (typeof TIPOS_DOCUMENTO_IDENTIDAD)[number];
export const ORIGENES_SOLICITUD = ["Landing", "AppSheet", "Telegram"] as const;
export type OrigenSolicitud = (typeof ORIGENES_SOLICITUD)[number];
export const ORIGENES_EVALUACION = [
  "Automática (n8n)",
  "Manual (AppSheet)",
  "Telegram",
  "Carga inicial (demo)",
] as const;
export const CANALES_NOTIFICACION = ["Telegram"] as const;
export const TIPOS_NOTIFICACION = [
  "Crítica",
  "Escalamiento",
  "Cambio de estado",
  "Consulta",
] as const;
export const ESTADOS_ENVIO = ["Enviada", "Fallida"] as const;

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/**
 * Fecha "de calendario" en UTC, para que Google Sheets muestre el mismo día
 * sin importar la zona horaria de quien abra el archivo.
 */
export function fecha(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : `${iso}Z`);
}

// ---------------------------------------------------------------------------
// Tablas
// ---------------------------------------------------------------------------

interface Opciones {
  requerida?: boolean;
  esParteDe?: boolean;
}

function clave(
  nombre: string,
  descripcion: string,
  tipo: TipoColumna = "Text",
): Columna {
  return { nombre, tipo, descripcion, requerida: true, clave: true };
}

function col(
  nombre: string,
  tipo: TipoColumna,
  descripcion: string,
  { requerida = false }: Opciones = {},
): Columna {
  return { nombre, tipo, descripcion, requerida };
}

function ref(
  nombre: string,
  tabla: NombreTabla,
  descripcion: string,
  { requerida = true, esParteDe = false }: Opciones = {},
): Columna {
  return { nombre, tipo: "Ref", ref: tabla, descripcion, requerida, esParteDe };
}

function lista(
  nombre: string,
  valores: readonly string[],
  descripcion: string,
  {
    requerida = true,
    multiple = false,
  }: Opciones & { multiple?: boolean } = {},
): Columna {
  return {
    nombre,
    tipo: multiple ? "EnumList" : "Enum",
    valores,
    descripcion,
    requerida,
  };
}

export const TABLAS: Tabla[] = [
  // --- Seguridad -----------------------------------------------------------
  {
    nombre: "Roles",
    grupo: "Seguridad",
    descripcion:
      "Roles del sistema y sus permisos. AppSheet los usa en los Security filters y en las condiciones Show_If / Editable_If.",
    columnas: [
      clave("ID_Rol", "Código del rol (ADMIN, ASESOR, SUPERVISOR)."),
      col("Nombre", "Text", "Nombre visible del rol.", { requerida: true }),
      col("Descripcion", "LongText", "Qué puede hacer el rol."),
      col(
        "Gestiona_Base_Conocimiento",
        "Yes/No",
        "Puede crear y editar reglas, condiciones, acciones y parámetros.",
        { requerida: true },
      ),
      col(
        "Evalua_Solicitudes",
        "Yes/No",
        "Puede ejecutar el motor de decisión y cambiar el estado de una solicitud.",
        { requerida: true },
      ),
      col(
        "Ve_Todas_Las_Solicitudes",
        "Yes/No",
        "Si es FALSE, solo ve las solicitudes que tiene asignadas.",
        { requerida: true },
      ),
      col(
        "Recibe_Escalamientos",
        "Yes/No",
        "Recibe por Telegram las solicitudes críticas escaladas.",
        { requerida: true },
      ),
    ],
  },
  {
    nombre: "Usuarios",
    grupo: "Seguridad",
    descripcion:
      "Personas que usan la app. El correo debe ser la cuenta de Google con la que inician sesión en AppSheet (USEREMAIL()).",
    columnas: [
      clave("Correo", "Correo de Google del usuario.", "Email"),
      col("Nombre", "Name", "Nombre completo.", { requerida: true }),
      ref("ID_Rol", "Roles", "Rol asignado."),
      lista(
        "Estado",
        ESTADOS_USUARIO,
        "Un usuario Inactivo no puede entrar a la app.",
      ),
      col(
        "Telegram_Chat_ID",
        "Text",
        "Chat de Telegram donde n8n le envía alertas y escalamientos.",
      ),
      col("Fecha_Alta", "Date", "Fecha de creación del usuario.", {
        requerida: true,
      }),
    ],
  },

  // --- Catálogos -----------------------------------------------------------
  {
    nombre: "Servicios",
    grupo: "Catálogos",
    descripcion:
      "Servicios de afiliación (mismos de la landing: constants/services.ts).",
    columnas: [
      clave("ID_Servicio", "Slug del servicio."),
      col("Nombre", "Text", "Nombre visible.", { requerida: true }),
      col("Descripcion", "LongText", "Descripción corta."),
      col("Activo", "Yes/No", "Si se ofrece actualmente.", { requerida: true }),
    ],
  },
  {
    nombre: "Planes",
    grupo: "Catálogos",
    descripcion:
      "Paquetes comerciales (mismos de la landing: constants/pricing-plans.ts).",
    columnas: [
      clave("ID_Plan", "Slug del plan."),
      col("Nombre", "Text", "Nombre visible.", { requerida: true }),
      col("Ideal_Para", "LongText", "Perfil de cliente al que apunta."),
      col("Incluye", "LongText", "Coberturas incluidas."),
      col("Nota_Precio", "Text", "Cómo se calcula el precio."),
      col("Activo", "Yes/No", "Si se ofrece actualmente.", { requerida: true }),
    ],
  },
  {
    nombre: "Plan_Servicios",
    grupo: "Catálogos",
    descripcion: "Relación muchos a muchos: qué servicios incluye cada plan.",
    columnas: [
      clave("ID_Plan_Servicio", "Identificador de la relación."),
      ref("ID_Plan", "Planes", "Plan.", { esParteDe: true }),
      ref("ID_Servicio", "Servicios", "Servicio incluido en el plan."),
    ],
  },
  {
    nombre: "Clases_Riesgo",
    grupo: "Catálogos",
    descripcion:
      "Clases de riesgo del Sistema General de Riesgos Laborales y su tarifa de ARL.",
    columnas: [
      clave("ID_Clase", "Clase de riesgo (1 a 5).", "Number"),
      col("Nombre", "Text", "Nombre de la clase.", { requerida: true }),
      col(
        "Tarifa_ARL_Pct",
        "Decimal",
        "Tarifa inicial en % del IBC. Es la que usa el motor.",
        { requerida: true },
      ),
      col("Tarifa_Minima_Pct", "Decimal", "Límite inferior de la tarifa (%)."),
      col("Tarifa_Maxima_Pct", "Decimal", "Límite superior de la tarifa (%)."),
      col("Ejemplos", "LongText", "Actividades de ejemplo de la clase."),
      col("Fuente", "LongText", "Norma de donde salen los valores.", {
        requerida: true,
      }),
    ],
  },
  {
    nombre: "Actividades_Economicas",
    grupo: "Catálogos",
    descripcion:
      "Actividades con su clase de riesgo. Catálogo orientativo para el ejercicio: la clase exacta la define el código CIIU en la tabla del Decreto 768 de 2022.",
    columnas: [
      clave("ID_Actividad", "Identificador de la actividad."),
      col("Nombre", "Text", "Nombre de la actividad.", { requerida: true }),
      ref("ID_Clase", "Clases_Riesgo", "Clase de riesgo de la actividad."),
      col("Nota", "LongText", "Aclaraciones sobre la clasificación."),
    ],
  },
  {
    nombre: "Documentos_Requeridos",
    grupo: "Catálogos",
    descripcion:
      "Documentos que se exigen según el tipo de vinculación (política interna de SolutaPLUS).",
    columnas: [
      clave("ID_Documento", "Identificador del documento."),
      col("Nombre", "Text", "Nombre del documento.", { requerida: true }),
      lista(
        "Aplica_A",
        TIPOS_VINCULACION,
        "Tipos de vinculación que deben presentarlo.",
        { multiple: true },
      ),
      col(
        "Obligatorio",
        "Yes/No",
        "Si cuenta para el % de documentación completa.",
        { requerida: true },
      ),
      col("Fuente", "LongText", "Por qué se exige."),
    ],
  },

  // --- Operación -----------------------------------------------------------
  {
    nombre: "Solicitantes",
    grupo: "Operación",
    descripcion:
      "Personas o empresas que piden afiliación (llegan por la landing, AppSheet o Telegram).",
    columnas: [
      clave("ID_Solicitante", "Identificador del solicitante."),
      lista(
        "Tipo_Documento",
        TIPOS_DOCUMENTO_IDENTIDAD,
        "Tipo de documento de identidad.",
      ),
      col("Numero_Documento", "Text", "Número de documento.", {
        requerida: true,
      }),
      col("Nombre_Completo", "Name", "Nombre o razón social.", {
        requerida: true,
      }),
      col("Telefono", "Phone", "Teléfono de contacto.", { requerida: true }),
      col("Correo", "Email", "Correo de contacto."),
      lista("Ciudad", CITIES, "Ciudad de residencia."),
      lista(
        "Origen",
        ORIGENES_SOLICITUD,
        "Canal por el que llegó el solicitante.",
      ),
      col(
        "Autoriza_Datos",
        "Yes/No",
        "Autorización previa de tratamiento de datos (Ley 1581 de 2012).",
        { requerida: true },
      ),
      col(
        "Fecha_Autorizacion",
        "DateTime",
        "Evidencia de cuándo se otorgó la autorización.",
      ),
      col(
        "Telegram_Chat_ID",
        "Text",
        "Chat de Telegram para que consulte el estado de su solicitud.",
      ),
    ],
  },
  {
    nombre: "Solicitudes",
    grupo: "Operación",
    descripcion:
      "Solicitud de afiliación. Sus columnas son los hechos de entrada del motor de decisión.",
    columnas: [
      clave("ID_Solicitud", "Radicado de la solicitud."),
      ref("ID_Solicitante", "Solicitantes", "Quién pide la afiliación."),
      ref("ID_Servicio", "Servicios", "Servicio solicitado."),
      ref("ID_Plan", "Planes", "Plan elegido (opcional).", {
        requerida: false,
      }),
      ref("Asesor", "Usuarios", "Asesor asignado.", { requerida: false }),
      lista(
        "Tipo_Vinculacion",
        TIPOS_VINCULACION,
        "Cómo trabaja el solicitante. Determina qué reglas aplican.",
      ),
      col(
        "Ingreso_Mensual",
        "Price",
        "Ingreso mensual bruto sin IVA (para empleadores se deja vacío).",
      ),
      col(
        "Costos_Deducibles",
        "Price",
        "Costos de la actividad (solo independientes por cuenta propia).",
      ),
      col(
        "Duracion_Contrato_Dias",
        "Number",
        "Duración del contrato de prestación de servicios, en días.",
      ),
      ref(
        "ID_Actividad",
        "Actividades_Economicas",
        "Actividad económica (define la clase de riesgo ARL).",
        { requerida: false },
      ),
      col(
        "Numero_Trabajadores",
        "Number",
        "Trabajadores a afiliar (solo empleadores).",
      ),
      col(
        "Descripcion_Libre",
        "LongText",
        "Lo que el solicitante contó con sus palabras. El agente IA lo interpreta.",
      ),
      lista("Estado", ESTADOS_SOLICITUD, "Estado del flujo de la solicitud."),
      lista(
        "Nivel_Resultado",
        NIVELES_RESULTADO,
        "Clasificación de la última evaluación del motor.",
        { requerida: false },
      ),
      col("Fecha_Creacion", "DateTime", "Fecha de radicación.", {
        requerida: true,
      }),
      col(
        "Fecha_Ultima_Gestion",
        "DateTime",
        "Última vez que un usuario la gestionó (base del escalamiento).",
        { requerida: true },
      ),
      col(
        "Firma_Solicitante",
        "Signature",
        "Firma capturada en AppSheet; se incluye en el PDF.",
      ),
    ],
  },
  {
    nombre: "Documentos_Solicitud",
    grupo: "Operación",
    descripcion:
      "Documentos entregados por cada solicitud. De aquí sale el hecho porcentaje_documentos.",
    columnas: [
      clave("ID_Doc_Solicitud", "Identificador del documento entregado."),
      ref("ID_Solicitud", "Solicitudes", "Solicitud.", { esParteDe: true }),
      ref("ID_Documento", "Documentos_Requeridos", "Documento."),
      lista("Estado", ESTADOS_DOCUMENTO, "Estado de revisión."),
      col("Archivo", "File", "Archivo cargado."),
      col("Fecha_Actualizacion", "DateTime", "Última actualización."),
    ],
  },
  {
    nombre: "Historial_Estados",
    grupo: "Operación",
    descripcion: "Trazabilidad de cada cambio de estado de una solicitud.",
    columnas: [
      clave("ID_Historial", "Identificador del cambio."),
      ref("ID_Solicitud", "Solicitudes", "Solicitud.", { esParteDe: true }),
      lista("Estado_Anterior", ESTADOS_SOLICITUD, "Estado antes del cambio.", {
        requerida: false,
      }),
      lista("Estado_Nuevo", ESTADOS_SOLICITUD, "Estado después del cambio."),
      ref("Usuario", "Usuarios", "Quién hizo el cambio (vacío = sistema).", {
        requerida: false,
      }),
      col("Fecha", "DateTime", "Momento del cambio.", { requerida: true }),
      col("Comentario", "LongText", "Motivo del cambio."),
    ],
  },

  // --- Base de conocimiento ------------------------------------------------
  {
    nombre: "Hechos",
    grupo: "Base de conocimiento",
    descripcion:
      "Diccionario de hechos: variables que las reglas leen o escriben. Nombres en minúscula.",
    columnas: [
      clave("ID_Hecho", "Nombre del hecho (snake_case, minúsculas)."),
      col("Descripcion", "LongText", "Qué representa.", { requerida: true }),
      lista("Tipo_Dato", TIPOS_DATO_HECHO, "Tipo de valor."),
      lista(
        "Origen",
        ORIGENES_HECHO,
        "Entrada: viene de las tablas. Derivado: lo escriben las reglas. Motor: lo calcula el motor.",
      ),
      col(
        "Fuente_Dato",
        "Text",
        "Columna o cálculo del que sale un hecho de entrada.",
      ),
      col(
        "Valor_Por_Defecto",
        "Text",
        "Valor que se usa si la entrada viene vacía.",
      ),
      col(
        "Valores_Permitidos",
        "Text",
        "Dominio del hecho, separado por |. Vacío = libre.",
      ),
    ],
  },
  {
    nombre: "Parametros",
    grupo: "Base de conocimiento",
    descripcion:
      "Valores configurables que usan las reglas (topes, tarifas, umbrales). Nombres en MAYÚSCULAS.",
    columnas: [
      clave("ID_Parametro", "Nombre del parámetro (MAYÚSCULAS)."),
      col("Nombre", "Text", "Nombre legible.", { requerida: true }),
      col("Valor", "Decimal", "Valor numérico.", { requerida: true }),
      col("Unidad", "Text", "Unidad del valor.", { requerida: true }),
      col(
        "Vigencia_Desde",
        "Date",
        "Fecha desde la que el sistema aplica este valor.",
        { requerida: true },
      ),
      col("Fuente", "LongText", "Norma o política de donde sale.", {
        requerida: true,
      }),
      lista(
        "Estado_Verificacion",
        ESTADOS_VERIFICACION,
        "Si el valor está verificado en una fuente oficial.",
      ),
    ],
  },
  {
    nombre: "Reglas",
    grupo: "Base de conocimiento",
    descripcion:
      "Reglas SI-ENTONCES. Sus condiciones y acciones están en tablas hijas.",
    columnas: [
      clave("ID_Regla", "Código de la regla (R01, R02...)."),
      col("Nombre", "Text", "Nombre corto.", { requerida: true }),
      col(
        "Enunciado",
        "LongText",
        "La regla en lenguaje natural «SI … ENTONCES …». Admite {PARAMETROS}.",
        { requerida: true },
      ),
      lista("Categoria", CATEGORIAS_REGLA, "Grupo temático."),
      col(
        "Prioridad",
        "Number",
        "Orden de disparo: menor número = se evalúa antes. Única por regla.",
        { requerida: true },
      ),
      lista(
        "Nivel_Impacto",
        NIVELES_IMPACTO,
        "Impacto que suma la regla al activarse.",
      ),
      col(
        "Explicacion",
        "LongText",
        "Plantilla del «por qué» que se muestra al usuario. Admite {hechos} y {PARAMETROS}.",
        { requerida: true },
      ),
      col("Fuente", "LongText", "Norma o política que respalda la regla.", {
        requerida: true,
      }),
      lista(
        "Estado_Verificacion",
        ESTADOS_VERIFICACION,
        "Si el respaldo normativo está verificado.",
      ),
      col("Activa", "Yes/No", "Si FALSE, el motor la ignora.", {
        requerida: true,
      }),
    ],
  },
  {
    nombre: "Condiciones_Regla",
    grupo: "Base de conocimiento",
    descripcion:
      "Parte SI de cada regla. Todas las condiciones de una regla deben cumplirse (Y lógico).",
    columnas: [
      clave("ID_Condicion", "Identificador de la condición."),
      ref("ID_Regla", "Reglas", "Regla a la que pertenece.", {
        esParteDe: true,
      }),
      ref("ID_Hecho", "Hechos", "Hecho que se evalúa."),
      lista("Operador", OPERADORES, "Comparación."),
      lista(
        "Tipo_Valor",
        TIPOS_VALOR,
        "Literal: valor fijo. Expresion: cálculo con hechos y parámetros. Vacío para EXISTE / NO_EXISTE.",
        { requerida: false },
      ),
      col(
        "Valor",
        "Text",
        "Valor contra el que se compara. En EN_LISTA, valores separados por |.",
      ),
    ],
  },
  {
    nombre: "Acciones_Regla",
    grupo: "Base de conocimiento",
    descripcion: "Parte ENTONCES de cada regla, ejecutada en orden.",
    columnas: [
      clave("ID_Accion", "Identificador de la acción."),
      ref("ID_Regla", "Reglas", "Regla a la que pertenece.", {
        esParteDe: true,
      }),
      col("Orden", "Number", "Orden de ejecución dentro de la regla.", {
        requerida: true,
      }),
      lista(
        "Tipo",
        TIPOS_ACCION,
        "ASIGNAR/CALCULAR escriben un hecho; CONCLUIR/RECOMENDAR/ALERTAR generan texto.",
      ),
      ref(
        "ID_Hecho_Destino",
        "Hechos",
        "Hecho que se escribe (solo ASIGNAR y CALCULAR).",
        { requerida: false },
      ),
      col(
        "Valor",
        "LongText",
        "Literal (ASIGNAR), expresión (CALCULAR) o plantilla de texto.",
        { requerida: true },
      ),
    ],
  },

  // --- Resultados del motor ------------------------------------------------
  {
    nombre: "Evaluaciones",
    grupo: "Resultados del motor",
    descripcion:
      "Resultado de cada ejecución del motor sobre una solicitud (lo escribe n8n).",
    columnas: [
      clave("ID_Evaluacion", "Identificador de la evaluación."),
      ref("ID_Solicitud", "Solicitudes", "Solicitud evaluada."),
      col("Fecha", "DateTime", "Momento de la evaluación.", {
        requerida: true,
      }),
      lista(
        "Origen",
        ORIGENES_EVALUACION,
        "Desde dónde se disparó la evaluación.",
      ),
      lista("Nivel_Resultado", NIVELES_RESULTADO, "Clasificación final."),
      lista(
        "Estado_Sugerido",
        ESTADOS_SOLICITUD,
        "Estado que sugiere el motor (el asesor decide).",
        { requerida: false },
      ),
      col("Num_Reglas_Activadas", "Number", "Cuántas reglas se activaron."),
      col("Num_Criticas", "Number", "Reglas críticas activadas."),
      col("Num_Advertencias", "Number", "Reglas de advertencia activadas."),
      col("IBC", "Price", "Ingreso base de cotización final."),
      col("Aporte_Salud", "Price", "Aporte mensual a Salud."),
      col("Aporte_Pension", "Price", "Aporte mensual a Pensión."),
      col("Aporte_ARL", "Price", "Aporte mensual a ARL."),
      col(
        "Total_Aportes_Cliente",
        "Price",
        "Total mensual a cargo del solicitante.",
      ),
      col("Conclusiones", "LongText", "Conclusiones generadas por las reglas."),
      col("Recomendaciones", "LongText", "Recomendaciones para el asesor."),
      col(
        "Explicacion_IA",
        "LongText",
        "Explicación en lenguaje natural redactada por el agente IA.",
      ),
      col(
        "Hechos_Finales_JSON",
        "LongText",
        "Todos los hechos al terminar la inferencia (trazabilidad).",
      ),
      col("URL_PDF", "Url", "Informe PDF de la evaluación."),
    ],
  },
  {
    nombre: "Reglas_Activadas",
    grupo: "Resultados del motor",
    descripcion:
      "Explicación trazable: qué reglas se activaron, en qué orden y por qué.",
    columnas: [
      clave("ID_Regla_Activada", "Identificador."),
      ref("ID_Evaluacion", "Evaluaciones", "Evaluación.", { esParteDe: true }),
      ref("ID_Regla", "Reglas", "Regla que se activó."),
      col("Orden_Disparo", "Number", "Posición en la cadena de inferencia.", {
        requerida: true,
      }),
      lista("Nivel_Impacto", NIVELES_IMPACTO, "Impacto de la regla."),
      col(
        "Explicacion_Generada",
        "LongText",
        "Plantilla de la regla con los valores reales.",
        { requerida: true },
      ),
      col(
        "Hechos_Usados",
        "LongText",
        "Valores de los hechos que evaluaron sus condiciones.",
      ),
    ],
  },
  {
    nombre: "Notificaciones",
    grupo: "Resultados del motor",
    descripcion: "Registro de los mensajes que n8n envía por Telegram.",
    columnas: [
      clave("ID_Notificacion", "Identificador."),
      ref("ID_Solicitud", "Solicitudes", "Solicitud relacionada (si aplica).", {
        requerida: false,
      }),
      lista("Canal", CANALES_NOTIFICACION, "Canal de envío."),
      col("Destinatario", "Text", "Chat ID o usuario de destino.", {
        requerida: true,
      }),
      lista("Tipo", TIPOS_NOTIFICACION, "Motivo del mensaje."),
      col("Mensaje", "LongText", "Texto enviado.", { requerida: true }),
      col("Fecha", "DateTime", "Momento del envío.", { requerida: true }),
      lista("Estado_Envio", ESTADOS_ENVIO, "Resultado del envío."),
    ],
  },
];
