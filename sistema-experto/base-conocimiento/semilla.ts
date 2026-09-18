// Datos iniciales de las 20 tablas para Google Sheets.
//
// Catálogos: servicios y planes salen de las mismas constantes que usa la
// landing (una sola fuente). Operación: 7 casos de demostración FICTICIOS
// (nombres, documentos y correos inventados, dominio example.com) diseñados
// para que cada nivel de clasificación y las reglas principales se activen
// al menos una vez. Su resultado esperado queda documentado aquí y el
// Módulo 8 lo usa como prueba del motor.

import type { City } from "@/constants/cities";
import { PRICING_PLANS } from "@/constants/pricing-plans";
import { SERVICES } from "@/constants/services";
import {
  SEPARADOR_ENUMLIST,
  fecha,
  type BaseDatos,
  type EstadoDocumento,
  type EstadoSolicitud,
  type Fila,
  type NivelResultado,
  type OrigenSolicitud,
  type TipoDocumentoIdentidad,
  type TipoVinculacion,
} from "./esquema";
import {
  filasAcciones,
  filasCondiciones,
  filasHechos,
  filasParametros,
  filasReglas,
} from "./reglas";

const FUENTE_INTERNA = "Política interna SolutaPLUS (ejercicio académico).";

// ---------------------------------------------------------------------------
// Seguridad
// ---------------------------------------------------------------------------

const ROLES: Fila[] = [
  {
    ID_Rol: "ADMIN",
    Nombre: "Administrador",
    Descripcion:
      "Gestiona usuarios, catálogos y la base de conocimiento (reglas, condiciones, acciones y parámetros).",
    Gestiona_Base_Conocimiento: true,
    Evalua_Solicitudes: true,
    Ve_Todas_Las_Solicitudes: true,
    Recibe_Escalamientos: false,
  },
  {
    ID_Rol: "ASESOR",
    Nombre: "Asesor",
    Descripcion:
      "Registra y gestiona las solicitudes que tiene asignadas, ejecuta evaluaciones y cambia estados.",
    Gestiona_Base_Conocimiento: false,
    Evalua_Solicitudes: true,
    Ve_Todas_Las_Solicitudes: false,
    Recibe_Escalamientos: false,
  },
  {
    ID_Rol: "SUPERVISOR",
    Nombre: "Supervisor",
    Descripcion:
      "Consulta todas las solicitudes y el dashboard y recibe los escalamientos. No modifica reglas.",
    Gestiona_Base_Conocimiento: false,
    Evalua_Solicitudes: false,
    Ve_Todas_Las_Solicitudes: true,
    Recibe_Escalamientos: true,
  },
];

// Usuarios de ejemplo. Las cuentas reales del equipo NO van aquí (el
// repositorio es público): viven en `sistema-experto/usuarios.local.json`,
// que el generador aplica encima de estos al crear el .xlsx.
const CORREO_ASESOR_EJEMPLO = "asesor@example.com";

const USUARIOS: Fila[] = [
  {
    Correo: "administrador@example.com",
    Nombre: "Administrador (ejemplo)",
    ID_Rol: "ADMIN",
    Estado: "Activo",
    Telegram_Chat_ID: null,
    Fecha_Alta: fecha("2026-09-01"),
  },
  {
    Correo: "supervisor@example.com",
    Nombre: "Supervisor (ejemplo)",
    ID_Rol: "SUPERVISOR",
    Estado: "Activo",
    Telegram_Chat_ID: null,
    Fecha_Alta: fecha("2026-09-01"),
  },
  {
    Correo: CORREO_ASESOR_EJEMPLO,
    Nombre: "Asesor (ejemplo)",
    ID_Rol: "ASESOR",
    Estado: "Activo",
    Telegram_Chat_ID: null,
    Fecha_Alta: fecha("2026-09-01"),
  },
  {
    // Sirve para demostrar que un usuario inactivo no entra a la app.
    Correo: "usuario.inactivo@example.com",
    Nombre: "Usuario inactivo (ejemplo)",
    ID_Rol: "ASESOR",
    Estado: "Inactivo",
    Telegram_Chat_ID: null,
    Fecha_Alta: fecha("2026-09-01"),
  },
];

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

const SERVICIOS: Fila[] = SERVICES.map((servicio) => ({
  ID_Servicio: servicio.slug,
  Nombre: servicio.name,
  Descripcion: servicio.description,
  Activo: true,
}));

const PLANES: Fila[] = PRICING_PLANS.map((plan) => ({
  ID_Plan: plan.slug,
  Nombre: plan.name,
  Ideal_Para: plan.idealFor,
  Incluye: plan.includes.join("; "),
  Nota_Precio: plan.priceNote,
  Activo: true,
}));

/** Traducción de `includes` de cada plan a los servicios del catálogo. */
const SERVICIOS_POR_PLAN: Record<string, string[]> = {
  basico: ["salud", "arl"],
  integral: ["salud", "pension", "arl"],
  empresarial: ["salud", "pension", "arl"],
};

const PLAN_SERVICIOS: Fila[] = Object.entries(SERVICIOS_POR_PLAN).flatMap(
  ([plan, servicios]) =>
    servicios.map((servicio) => ({
      ID_Plan_Servicio: `${plan}-${servicio}`,
      ID_Plan: plan,
      ID_Servicio: servicio,
    })),
);

const FUENTE_TARIFAS_ARL =
  "Tarifas: Decreto 1772 de 1994, art. 13 (tarifa inicial y rango). Clasificación de actividades: Decreto 768 de 2022.";
const SIN_EJEMPLOS =
  "Consultar la tabla de clasificación de actividades económicas del Decreto 768 de 2022.";

const CLASES_RIESGO: Fila[] = [
  {
    ID_Clase: 1,
    Nombre: "I – Riesgo mínimo",
    Tarifa_ARL_Pct: 0.522,
    Tarifa_Minima_Pct: 0.348,
    Tarifa_Maxima_Pct: 0.696,
    Ejemplos:
      "Trabajo administrativo de oficina, consultoría de gestión, portales web, centros educativos.",
    Fuente: FUENTE_TARIFAS_ARL,
  },
  {
    ID_Clase: 2,
    Nombre: "II – Riesgo bajo",
    Tarifa_ARL_Pct: 1.044,
    Tarifa_Minima_Pct: 0.435,
    Tarifa_Maxima_Pct: 1.653,
    Ejemplos: SIN_EJEMPLOS,
    Fuente: FUENTE_TARIFAS_ARL,
  },
  {
    ID_Clase: 3,
    Nombre: "III – Riesgo medio",
    Tarifa_ARL_Pct: 2.436,
    Tarifa_Minima_Pct: 0.783,
    Tarifa_Maxima_Pct: 4.089,
    Ejemplos: SIN_EJEMPLOS,
    Fuente: FUENTE_TARIFAS_ARL,
  },
  {
    ID_Clase: 4,
    Nombre: "IV – Riesgo alto",
    Tarifa_ARL_Pct: 4.35,
    Tarifa_Minima_Pct: 1.74,
    Tarifa_Maxima_Pct: 6.96,
    Ejemplos: "Transporte (conducción de vehículos).",
    Fuente: FUENTE_TARIFAS_ARL,
  },
  {
    ID_Clase: 5,
    Nombre: "V – Riesgo máximo",
    Tarifa_ARL_Pct: 6.96,
    Tarifa_Minima_Pct: 3.219,
    Tarifa_Maxima_Pct: 8.7,
    Ejemplos:
      "Construcción de edificios residenciales, explotación de canteras.",
    Fuente: FUENTE_TARIFAS_ARL,
  },
];

const NOTA_ACTIVIDAD =
  "Clasificación orientativa para el ejercicio académico; la clase exacta la determina el código CIIU en la tabla del Decreto 768 de 2022.";

const ACTIVIDADES: Fila[] = [
  {
    ID_Actividad: "ACT-01",
    Nombre: "Consultoría de gestión y contable",
    ID_Clase: 1,
    Nota: NOTA_ACTIVIDAD,
  },
  {
    ID_Actividad: "ACT-02",
    Nombre: "Trabajo administrativo de oficina",
    ID_Clase: 1,
    Nota: NOTA_ACTIVIDAD,
  },
  {
    ID_Actividad: "ACT-03",
    Nombre: "Transporte (conducción de vehículos)",
    ID_Clase: 4,
    Nota: NOTA_ACTIVIDAD,
  },
  {
    ID_Actividad: "ACT-04",
    Nombre: "Construcción de edificios residenciales",
    ID_Clase: 5,
    Nota: NOTA_ACTIVIDAD,
  },
  {
    ID_Actividad: "ACT-05",
    Nombre: "Portales web y desarrollo digital",
    ID_Clase: 1,
    Nota: NOTA_ACTIVIDAD,
  },
];

const aplicaA = (...tipos: TipoVinculacion[]) => tipos.join(SEPARADOR_ENUMLIST);

const DOCUMENTOS_REQUERIDOS: Fila[] = [
  {
    ID_Documento: "DOC-01",
    Nombre: "Documento de identidad",
    Aplica_A: aplicaA("Contratista", "Cuenta propia", "Empleador"),
    Obligatorio: true,
    Fuente: FUENTE_INTERNA,
  },
  {
    ID_Documento: "DOC-02",
    Nombre: "Contrato de prestación de servicios",
    Aplica_A: aplicaA("Contratista"),
    Obligatorio: true,
    Fuente: FUENTE_INTERNA,
  },
  {
    ID_Documento: "DOC-03",
    Nombre: "RUT",
    Aplica_A: aplicaA("Contratista", "Cuenta propia"),
    Obligatorio: true,
    Fuente: FUENTE_INTERNA,
  },
  {
    ID_Documento: "DOC-04",
    Nombre: "Soportes de ingresos y costos",
    Aplica_A: aplicaA("Cuenta propia"),
    Obligatorio: true,
    Fuente: FUENTE_INTERNA,
  },
  {
    ID_Documento: "DOC-05",
    Nombre: "Certificado de existencia y representación legal",
    Aplica_A: aplicaA("Empleador"),
    Obligatorio: true,
    Fuente: FUENTE_INTERNA,
  },
  {
    ID_Documento: "DOC-06",
    Nombre: "Autorización firmada de tratamiento de datos",
    Aplica_A: aplicaA("Contratista", "Cuenta propia", "Empleador"),
    Obligatorio: true,
    Fuente: "Ley 1581 de 2012, art. 9 (autorización previa del titular).",
  },
];

// ---------------------------------------------------------------------------
// Casos de demostración (datos ficticios)
// ---------------------------------------------------------------------------

export interface CasoDemo {
  id: string;
  solicitante: {
    tipoDocumento: TipoDocumentoIdentidad;
    documento: string;
    nombre: string;
    telefono: string;
    correo: string;
    ciudad: City;
    autoriza: boolean;
  };
  origen: OrigenSolicitud;
  servicio: string;
  plan: string;
  tipo: TipoVinculacion;
  ingreso?: number;
  costos?: number;
  dias?: number;
  actividad?: string;
  trabajadores?: number;
  descripcion: string;
  creada: string;
  ultimaGestion: string;
  documentos: Record<string, EstadoDocumento>;
  /** Resultado que el motor (Módulo 8) debe producir con estos datos. */
  esperado: {
    nivel: NivelResultado;
    estado: EstadoSolicitud;
    reglas: string[];
    nota: string;
  };
}

export const CASOS_DEMO: CasoDemo[] = [
  {
    id: "SOL-0001",
    solicitante: {
      tipoDocumento: "CC",
      documento: "1000000001",
      nombre: "Laura Restrepo",
      telefono: "3000000001",
      correo: "laura.restrepo@example.com",
      ciudad: "Pereira",
      autoriza: true,
    },
    origen: "Landing",
    servicio: "seguridad-social-integral",
    plan: "integral",
    tipo: "Contratista",
    ingreso: 5_000_000,
    dias: 300,
    actividad: "ACT-01",
    descripcion:
      "Soy contadora independiente, firmé un contrato de prestación de servicios por 10 meses y me pagan 5 millones al mes.",
    creada: "2026-09-01T09:15:00",
    ultimaGestion: "2026-09-01T09:15:00",
    documentos: {
      "DOC-01": "Recibido",
      "DOC-02": "Recibido",
      "DOC-03": "Recibido",
      "DOC-06": "Recibido",
    },
    esperado: {
      nivel: "Viable",
      estado: "Aprobada",
      reglas: ["R03", "R06", "R08", "R13", "R17", "R18", "R27"],
      nota: "IBC $2.000.000; Salud $250.000, Pensión $320.000, ARL $10.440; total $580.440. Coincide con el ejemplo oficial de la UGPP.",
    },
  },
  {
    id: "SOL-0002",
    solicitante: {
      tipoDocumento: "CC",
      documento: "1000000002",
      nombre: "Andrés Cardona",
      telefono: "3000000002",
      correo: "andres.cardona@example.com",
      ciudad: "Manizales",
      autoriza: true,
    },
    origen: "Landing",
    servicio: "salud",
    plan: "basico",
    tipo: "Contratista",
    ingreso: 2_000_000,
    dias: 180,
    actividad: "ACT-02",
    descripcion:
      "Me contrataron 6 meses como auxiliar administrativo por prestación de servicios y gano 2 millones. Solo quiero salud y ARL.",
    creada: "2026-09-02T10:40:00",
    ultimaGestion: "2026-09-02T10:40:00",
    documentos: {
      "DOC-01": "Recibido",
      "DOC-02": "Recibido",
      "DOC-03": "Recibido",
      "DOC-06": "Recibido",
    },
    esperado: {
      nivel: "Requiere revisión",
      estado: "En revisión",
      reglas: ["R03", "R06", "R08", "R09", "R13", "R17", "R18", "R20", "R29"],
      nota: "El 40 % ($800.000) queda bajo el mínimo: IBC ajustado a $1.750.905. El Plan Básico no incluye la Pensión obligatoria.",
    },
  },
  {
    id: "SOL-0003",
    solicitante: {
      tipoDocumento: "CC",
      documento: "1000000003",
      nombre: "Jorge Salazar",
      telefono: "3000000003",
      correo: "jorge.salazar@example.com",
      ciudad: "Armenia",
      autoriza: false,
    },
    origen: "Telegram",
    servicio: "seguridad-social-integral",
    plan: "integral",
    tipo: "Cuenta propia",
    actividad: "ACT-04",
    descripcion:
      "Trabajo por mi cuenta en obras de construcción, a veces en alturas. No sé bien cuánto gano al mes.",
    creada: "2026-09-03T08:05:00",
    ultimaGestion: "2026-09-03T08:05:00",
    documentos: {
      "DOC-01": "Recibido",
      "DOC-03": "Pendiente",
      "DOC-04": "Pendiente",
      "DOC-06": "Pendiente",
    },
    esperado: {
      nivel: "Crítica",
      estado: "Bloqueada",
      reglas: ["R01", "R02", "R12", "R24", "R25", "R26"],
      nota: "Sin ingreso y sin autorización de datos: 2 críticas, bloqueo. R26 (escalamiento) se activa al evaluar más de 24 h después de la última gestión.",
    },
  },
  {
    id: "SOL-0004",
    solicitante: {
      tipoDocumento: "NIT",
      documento: "900000004",
      nombre: "Empresa Demo S.A.S.",
      telefono: "3000000004",
      correo: "talento.humano@example.com",
      ciudad: "Pereira",
      autoriza: true,
    },
    origen: "AppSheet",
    servicio: "seguridad-social-integral",
    plan: "empresarial",
    tipo: "Empleador",
    trabajadores: 12,
    descripcion:
      "Somos una empresa con 12 empleados y necesitamos afiliarlos a todo.",
    creada: "2026-09-04T14:20:00",
    ultimaGestion: "2026-09-04T14:20:00",
    documentos: {
      "DOC-01": "Recibido",
      "DOC-05": "Recibido",
      "DOC-06": "Recibido",
    },
    esperado: {
      nivel: "Viable",
      estado: "Aprobada",
      reglas: ["R22", "R27"],
      nota: "12 trabajadores superan el umbral de 5: se sugiere el Plan Empresarial.",
    },
  },
  {
    id: "SOL-0005",
    solicitante: {
      tipoDocumento: "CC",
      documento: "1000000005",
      nombre: "Camilo Ospina",
      telefono: "3000000005",
      correo: "camilo.ospina@example.com",
      ciudad: "Medellín",
      autoriza: true,
    },
    origen: "Telegram",
    servicio: "arl",
    plan: "integral",
    tipo: "Contratista",
    ingreso: 3_500_000,
    dias: 20,
    actividad: "ACT-03",
    descripcion:
      "Soy conductor, me contrataron 20 días para hacer rutas y me pagan 3,5 millones.",
    creada: "2026-09-05T07:50:00",
    ultimaGestion: "2026-09-05T07:50:00",
    documentos: {
      "DOC-01": "Recibido",
      "DOC-02": "Recibido",
      "DOC-03": "Recibido",
      "DOC-06": "Recibido",
    },
    esperado: {
      nivel: "Requiere revisión",
      estado: "En revisión",
      reglas: ["R03", "R06", "R08", "R09", "R11", "R17", "R19", "R29"],
      nota: "Contrato de 20 días pero actividad de riesgo IV: ARL obligatoria a cargo del contratante.",
    },
  },
  {
    id: "SOL-0006",
    solicitante: {
      tipoDocumento: "CC",
      documento: "1000000006",
      nombre: "Valentina Muñoz",
      telefono: "3000000006",
      correo: "valentina.munoz@example.com",
      ciudad: "Bogotá",
      autoriza: true,
    },
    origen: "Landing",
    servicio: "salud",
    plan: "basico",
    tipo: "Cuenta propia",
    ingreso: 2_500_000,
    costos: 1_000_000,
    actividad: "ACT-01",
    descripcion:
      "Hago consultorías por mi cuenta, facturo unos 2,5 millones y tengo costos de 1 millón.",
    creada: "2026-09-06T16:30:00",
    ultimaGestion: "2026-09-06T16:30:00",
    documentos: {
      "DOC-01": "Recibido",
      "DOC-03": "Recibido",
      "DOC-04": "Pendiente",
      "DOC-06": "Recibido",
    },
    esperado: {
      nivel: "Requiere revisión",
      estado: "Pendiente documentos",
      reglas: ["R04", "R05", "R07", "R24", "R28"],
      nota: "Ingreso neto $1.500.000 < 1 SMMLV: no está obligada. Faltan soportes de costos (75 % de documentos).",
    },
  },
  {
    id: "SOL-0007",
    solicitante: {
      tipoDocumento: "CC",
      documento: "1000000007",
      nombre: "Diego Arango",
      telefono: "3000000007",
      correo: "diego.arango@example.com",
      ciudad: "Cali",
      autoriza: true,
    },
    origen: "AppSheet",
    servicio: "salud",
    plan: "basico",
    tipo: "Cuenta propia",
    ingreso: 6_000_000,
    costos: 0,
    actividad: "ACT-03",
    descripcion:
      "Soy transportador independiente, gano unos 6 millones al mes y quiero el plan más barato.",
    creada: "2026-09-07T11:10:00",
    ultimaGestion: "2026-09-07T11:10:00",
    documentos: {
      "DOC-01": "Recibido",
      "DOC-03": "Recibido",
      "DOC-04": "Recibido",
      "DOC-06": "Recibido",
    },
    esperado: {
      nivel: "Requiere revisión",
      estado: "En revisión",
      reglas: ["R04", "R06", "R08", "R12", "R17", "R20", "R21", "R29"],
      nota: "Obligado a Pensión y con riesgo IV: el Plan Básico no le sirve por dos motivos; se sugiere el Integral.",
    },
  },
];

const idSolicitante = (caso: CasoDemo) => caso.id.replace("SOL", "CLI");

const SOLICITANTES: Fila[] = CASOS_DEMO.map((caso) => ({
  ID_Solicitante: idSolicitante(caso),
  Tipo_Documento: caso.solicitante.tipoDocumento,
  Numero_Documento: caso.solicitante.documento,
  Nombre_Completo: caso.solicitante.nombre,
  Telefono: caso.solicitante.telefono,
  Correo: caso.solicitante.correo,
  Ciudad: caso.solicitante.ciudad,
  Origen: caso.origen,
  Autoriza_Datos: caso.solicitante.autoriza,
  Fecha_Autorizacion: caso.solicitante.autoriza ? fecha(caso.creada) : null,
  Telegram_Chat_ID: null,
}));

const SOLICITUDES: Fila[] = CASOS_DEMO.map((caso) => ({
  ID_Solicitud: caso.id,
  ID_Solicitante: idSolicitante(caso),
  ID_Servicio: caso.servicio,
  ID_Plan: caso.plan,
  Asesor: CORREO_ASESOR_EJEMPLO,
  Tipo_Vinculacion: caso.tipo,
  Ingreso_Mensual: caso.ingreso ?? null,
  Costos_Deducibles: caso.costos ?? null,
  Duracion_Contrato_Dias: caso.dias ?? null,
  ID_Actividad: caso.actividad ?? null,
  Numero_Trabajadores: caso.trabajadores ?? null,
  Descripcion_Libre: caso.descripcion,
  Estado: "Nueva",
  Nivel_Resultado: null,
  Fecha_Creacion: fecha(caso.creada),
  Fecha_Ultima_Gestion: fecha(caso.ultimaGestion),
  Firma_Solicitante: null,
}));

const DOCUMENTOS_SOLICITUD: Fila[] = CASOS_DEMO.flatMap((caso) =>
  Object.entries(caso.documentos).map(([documento, estado]) => ({
    ID_Doc_Solicitud: `${caso.id}-${documento}`,
    ID_Solicitud: caso.id,
    ID_Documento: documento,
    Estado: estado,
    Archivo: null,
    Fecha_Actualizacion: fecha(caso.ultimaGestion),
  })),
);

const HISTORIAL_ESTADOS: Fila[] = CASOS_DEMO.map((caso, i) => ({
  ID_Historial: `HIS-${String(i + 1).padStart(4, "0")}`,
  ID_Solicitud: caso.id,
  Estado_Anterior: null,
  Estado_Nuevo: "Nueva",
  Usuario: null,
  Fecha: fecha(caso.creada),
  Comentario: `Solicitud registrada desde ${caso.origen}.`,
}));

// ---------------------------------------------------------------------------

export const SEMILLA: BaseDatos = {
  Roles: ROLES,
  Usuarios: USUARIOS,
  Servicios: SERVICIOS,
  Planes: PLANES,
  Plan_Servicios: PLAN_SERVICIOS,
  Clases_Riesgo: CLASES_RIESGO,
  Actividades_Economicas: ACTIVIDADES,
  Documentos_Requeridos: DOCUMENTOS_REQUERIDOS,
  Solicitantes: SOLICITANTES,
  Solicitudes: SOLICITUDES,
  Documentos_Solicitud: DOCUMENTOS_SOLICITUD,
  Historial_Estados: HISTORIAL_ESTADOS,
  Hechos: filasHechos(),
  Parametros: filasParametros(),
  Reglas: filasReglas(),
  Condiciones_Regla: filasCondiciones(),
  Acciones_Regla: filasAcciones(),
  // Las escribe n8n al ejecutar el motor (Módulos 10 y 11).
  Evaluaciones: [],
  Reglas_Activadas: [],
  Notificaciones: [],
};
