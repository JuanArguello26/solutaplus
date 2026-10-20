// Genera los flujos de n8n (JSON importable) del sistema experto:
//  1. «Evaluar solicitud»: lee la base de conocimiento y las tablas de
//     operación de la Hoja de Google, ejecuta el motor en un nodo Code y
//     escribe Evaluaciones, Reglas_Activadas, el estado y el historial.
//  2. «Landing a Sheets»: recibe el formulario de la landing y lo radica como
//     Solicitante + Solicitud (estado «Nueva»).
//
// El JSON no lleva credenciales: tras importarlo, cada nodo de Google Sheets
// y cada Webhook debe enlazarse a las credenciales que crea el usuario.

import { NOMBRE_GLOBAL_MOTOR } from "./motor-n8n";

export const ID_HOJA_GOOGLE = "1O2zZNprQexe7myH7oqBAufvWNw9ze0LV4Ke2EGD7G0U";

/** Tablas que el flujo de evaluación lee completas (nombre del nodo = hoja). */
export const TABLAS_LECTURA_EVALUACION = [
  "Hechos",
  "Parametros",
  "Reglas",
  "Condiciones_Regla",
  "Acciones_Regla",
  "Solicitudes",
  "Solicitantes",
  "Actividades_Economicas",
  "Clases_Riesgo",
  "Documentos_Solicitud",
  "Documentos_Requeridos",
  "Evaluaciones",
] as const;

/** Estados desde los que el motor puede mover una solicitud por sí solo. */
const ESTADOS_AUTOMATICOS = ["Nueva", "En evaluación"];

type Nodo = Record<string, unknown>;
type Posicion = [number, number];

const hoja = (nombre: string) => ({
  documentId: { __rl: true, mode: "id", value: ID_HOJA_GOOGLE },
  sheetName: { __rl: true, mode: "name", value: nombre },
});

const credencialSheets = {
  googleSheetsOAuth2Api: { id: "", name: "Google Sheets (SolutaPLUS)" },
};
const credencialWebhook = {
  httpHeaderAuth: { id: "", name: "Clave webhook SolutaPLUS" },
};

function webhook(ruta: string, posicion: Posicion): Nodo {
  return {
    name: "Webhook",
    type: "n8n-nodes-base.webhook",
    typeVersion: 2,
    position: posicion,
    parameters: {
      httpMethod: "POST",
      path: ruta,
      authentication: "headerAuth",
      responseMode: "responseNode",
    },
    credentials: credencialWebhook,
  };
}

function lecturaHoja(nombre: string, posicion: Posicion): Nodo {
  return {
    name: nombre,
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4.5,
    position: posicion,
    // Una sola ejecución: si no, cada fila leída dispararía el nodo siguiente.
    executeOnce: true,
    parameters: { operation: "read", ...hoja(nombre), options: {} },
    credentials: credencialSheets,
  };
}

function agregarFilas(
  nombreNodo: string,
  nombreHoja: string,
  posicion: Posicion,
): Nodo {
  return {
    name: nombreNodo,
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4.5,
    position: posicion,
    parameters: {
      operation: "append",
      ...hoja(nombreHoja),
      columns: { mappingMode: "autoMapInputData", value: null },
      options: {},
    },
    credentials: credencialSheets,
  };
}

function codigo(
  nombre: string,
  posicion: Posicion,
  jsCode: string,
  unaVez = false,
): Nodo {
  return {
    name: nombre,
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: posicion,
    ...(unaVez ? { executeOnce: true } : {}),
    parameters: { mode: "runOnceForAllItems", jsCode },
  };
}

function responder(posicion: Posicion, cuerpo: string): Nodo {
  return {
    name: "Responder",
    type: "n8n-nodes-base.respondToWebhook",
    typeVersion: 1.1,
    position: posicion,
    parameters: { respondWith: "json", responseBody: cuerpo },
  };
}

/** Conecta los nodos en cadena, en el orden dado. */
function encadenar(nombres: string[]) {
  const conexiones: Record<string, unknown> = {};
  nombres.slice(0, -1).forEach((nombre, i) => {
    conexiones[nombre] = {
      main: [[{ node: nombres[i + 1], type: "main", index: 0 }]],
    };
  });
  return conexiones;
}

const LEE_TABLAS = TABLAS_LECTURA_EVALUACION.map(
  (nombre) => `  ${nombre}: leer("${nombre}"),`,
).join("\n");

/**
 * Cuerpo del nodo Code «Motor»: pega el motor y lo ejecuta con las tablas
 * leídas. Es una función pura de `$` (el accesor de nodos de n8n) para poder
 * probarla fuera de n8n.
 */
export function codigoNodoMotor(motorJs: string): string {
  return `${motorJs}
const leer = (nombre) => $(nombre).all().map((item) => item.json);
const tablas = {
${LEE_TABLAS}
};

const cuerpo = $("Webhook").first().json.body || {};
const idSolicitud = String(cuerpo.idSolicitud || "").trim();
if (!idSolicitud) throw new Error("Falta idSolicitud en el cuerpo de la petición");

const ahora = new Date();
const resultado = ${NOMBRE_GLOBAL_MOTOR}.evaluarSolicitud(idSolicitud, tablas, { ahora });

// Siguiente ID de evaluación: EVA-0001, EVA-0002, ...
const numeros = tablas.Evaluaciones
  .map((fila) => Number(String(fila.ID_Evaluacion || "").replace(/\\D/g, "")))
  .filter((n) => Number.isFinite(n));
const idEvaluacion = "EVA-" + String(Math.max(0, ...numeros) + 1).padStart(4, "0");

const { evaluacion, reglasActivadas } = ${NOMBRE_GLOBAL_MOTOR}.filasResultado(resultado, {
  idEvaluacion,
  fecha: ahora.toISOString(),
  origen: String(cuerpo.origen || "n8n"),
});

const solicitud = tablas.Solicitudes.find((f) => String(f.ID_Solicitud) === idSolicitud);
const estadoActual = String(solicitud.Estado || "");
const cambiaEstado =
  ${JSON.stringify(ESTADOS_AUTOMATICOS)}.includes(estadoActual) &&
  resultado.estadoSugerido &&
  resultado.estadoSugerido !== estadoActual;
const estadoNuevo = cambiaEstado ? resultado.estadoSugerido : estadoActual;

return [
  {
    json: {
      idSolicitud,
      idEvaluacion,
      evaluacion,
      reglasActivadas,
      actualizacion: {
        ID_Solicitud: idSolicitud,
        Estado: estadoNuevo,
        Nivel_Resultado: resultado.nivel,
      },
      historial: cambiaEstado
        ? {
            ID_Historial: "HIS-" + Date.now(),
            ID_Solicitud: idSolicitud,
            Estado_Anterior: estadoActual,
            Estado_Nuevo: estadoNuevo,
            Usuario: "",
            Fecha: ahora.toISOString(),
            Comentario: "Evaluación automática " + idEvaluacion,
          }
        : null,
      resumen: ${NOMBRE_GLOBAL_MOTOR}.resumenTexto(resultado),
      errores: resultado.errores,
    },
  },
];`;
}

const JS_UNA_EVALUACION = `return [{ json: $("Motor").first().json.evaluacion }];`;
const JS_REGLAS = `return $("Motor").first().json.reglasActivadas.map((json) => ({ json }));`;
const JS_ACTUALIZACION = `return [{ json: $("Motor").first().json.actualizacion }];`;
const JS_HISTORIAL = `const h = $("Motor").first().json.historial;
return h ? [{ json: h }] : [];`;

export function flujoEvaluacion(motorJs: string) {
  const nodos: Nodo[] = [webhook("solutaplus-evaluar", [0, 300])];
  TABLAS_LECTURA_EVALUACION.forEach((nombre, i) => {
    nodos.push(lecturaHoja(nombre, [260 + i * 220, 300]));
  });
  const x = 260 + TABLAS_LECTURA_EVALUACION.length * 220;
  nodos.push(
    codigo("Motor", [x, 300], codigoNodoMotor(motorJs), true),
    codigo("Fila evaluación", [x + 220, 300], JS_UNA_EVALUACION, true),
    agregarFilas("Guardar Evaluaciones", "Evaluaciones", [x + 440, 300]),
    codigo("Filas reglas", [x + 660, 300], JS_REGLAS, true),
    agregarFilas("Guardar Reglas_Activadas", "Reglas_Activadas", [
      x + 880,
      300,
    ]),
    codigo("Fila solicitud", [x + 1100, 300], JS_ACTUALIZACION, true),
    {
      name: "Actualizar Solicitudes",
      type: "n8n-nodes-base.googleSheets",
      typeVersion: 4.5,
      position: [x + 1320, 300],
      parameters: {
        operation: "update",
        ...hoja("Solicitudes"),
        columns: {
          mappingMode: "autoMapInputData",
          value: null,
          matchingColumns: ["ID_Solicitud"],
        },
        options: {},
      },
      credentials: credencialSheets,
    },
    codigo("Fila historial", [x + 1540, 300], JS_HISTORIAL, true),
    agregarFilas("Guardar Historial_Estados", "Historial_Estados", [
      x + 1760,
      300,
    ]),
    responder(
      [x + 1980, 300],
      `={{ { ok: true, idEvaluacion: $("Motor").first().json.idEvaluacion, nivel: $("Motor").first().json.evaluacion.Nivel_Resultado, resumen: $("Motor").first().json.resumen, errores: $("Motor").first().json.errores } }}`,
    ),
  );

  const orden = nodos.map((nodo) => String(nodo.name));
  return {
    name: "SolutaPLUS - Evaluar solicitud",
    nodes: nodos,
    connections: encadenar(orden),
    settings: { executionOrder: "v1" },
  };
}

/** Código del nodo que radica una solicitud llegada desde la landing. */
export const CODIGO_LANDING = `const cuerpo = $("Webhook").first().json.body || {};
const texto = (valor) => String(valor ?? "").trim();
if (!texto(cuerpo.fullName) || !texto(cuerpo.phone) || !texto(cuerpo.city)) {
  throw new Error("Faltan datos obligatorios: fullName, phone, city");
}
if (cuerpo.consentAccepted !== true) {
  throw new Error("El solicitante no aceptó el tratamiento de datos");
}
const siguiente = (tabla, prefijo, campo) => {
  const numeros = $(tabla).all()
    .map((item) => Number(String(item.json[campo] || "").replace(/\\D/g, "")))
    .filter((n) => Number.isFinite(n));
  return prefijo + String(Math.max(0, ...numeros) + 1).padStart(4, "0");
};
const ahora = new Date().toISOString();
const idSolicitante = siguiente("Solicitantes", "CLI-", "ID_Solicitante");
const idSolicitud = siguiente("Solicitudes", "SOL-", "ID_Solicitud");

return [
  {
    json: {
      idSolicitud,
      solicitante: {
        ID_Solicitante: idSolicitante,
        Numero_Documento: texto(cuerpo.document),
        Nombre_Completo: texto(cuerpo.fullName),
        Telefono: texto(cuerpo.phone),
        Correo: texto(cuerpo.email),
        Ciudad: texto(cuerpo.city),
        Origen: "Landing",
        Autoriza_Datos: "Y",
        Fecha_Autorizacion: ahora,
        Telegram_Chat_ID: "",
      },
      solicitud: {
        ID_Solicitud: idSolicitud,
        ID_Solicitante: idSolicitante,
        ID_Servicio: texto(cuerpo.serviceSlug),
        ID_Plan: texto(cuerpo.planId),
        Descripcion_Libre: texto(cuerpo.observations),
        Estado: "Nueva",
        Fecha_Creacion: ahora,
        Fecha_Ultima_Gestion: ahora,
      },
    },
  },
];`;

export function flujoLanding() {
  const nodos: Nodo[] = [
    webhook("solutaplus-landing", [0, 300]),
    lecturaHoja("Solicitantes", [260, 300]),
    lecturaHoja("Solicitudes", [480, 300]),
    codigo("Radicar", [700, 300], CODIGO_LANDING, true),
    codigo(
      "Fila solicitante",
      [920, 300],
      `return [{ json: $("Radicar").first().json.solicitante }];`,
      true,
    ),
    agregarFilas("Guardar Solicitantes", "Solicitantes", [1140, 300]),
    codigo(
      "Fila solicitud",
      [1360, 300],
      `return [{ json: $("Radicar").first().json.solicitud }];`,
      true,
    ),
    agregarFilas("Guardar Solicitudes", "Solicitudes", [1580, 300]),
    responder(
      [1800, 300],
      `={{ { ok: true, idSolicitud: $("Radicar").first().json.idSolicitud } }}`,
    ),
  ];
  return {
    name: "SolutaPLUS - Landing a Sheets",
    nodes: nodos,
    connections: encadenar(nodos.map((nodo) => String(nodo.name))),
    settings: { executionOrder: "v1" },
  };
}
