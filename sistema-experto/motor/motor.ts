// Motor de inferencia del sistema experto SolutaPLUS (Módulo 8).
//
// Encadenamiento hacia adelante sobre la base de conocimiento que vive en
// Google Sheets (tablas Hechos, Parametros, Reglas, Condiciones_Regla y
// Acciones_Regla). En cada ciclo se recorre la agenda por Prioridad y se
// dispara la primera regla todavía no disparada cuyas condiciones se
// cumplen; sus acciones pueden escribir hechos que habilitan otras reglas.
// Cada regla se dispara una sola vez, así que la inferencia siempre termina.
//
// RESTRICCIÓN DE DISEÑO: este mismo archivo se transpila sin bundler y se
// pega en un nodo Code de n8n (ver `scripts/motor-n8n.ts`). Por eso no
// puede importar nada en tiempo de ejecución (solo `import type`), ni usar
// APIs de Node, Intl, ni `instanceof Date` (los objetos pueden venir de otro
// contexto de ejecución).
//
// Acepta las filas tal como llegan de Sheets: números como texto ("12,5"),
// booleanos como TRUE/FALSE y fechas como serial de Sheets, ISO o Date.

import type {
  NivelImpacto,
  NivelResultado,
  Operador,
} from "@/sistema-experto/base-conocimiento/esquema";

// ---------------------------------------------------------------------------
// Contrato con la base de conocimiento
// ---------------------------------------------------------------------------

export const FORMATOS_PLANTILLA = ["moneda"] as const;
/** Separador de listas en EN_LISTA y en Hechos.Valores_Permitidos. */
export const SEPARADOR_LISTA = "|";

/**
 * Hechos cuyo nombre conoce el motor: los de Entrada los arma
 * `hechosDesdeTablas`, los Derivados se leen para armar las filas de
 * resultado y los de Motor son sus contadores. `validacion.ts` exige que
 * existan en la tabla Hechos con este mismo origen.
 */
export const HECHOS_DEL_MOTOR = {
  id_solicitud: "Entrada",
  tipo_vinculacion: "Entrada",
  ingreso_mensual: "Entrada",
  costos_deducibles: "Entrada",
  duracion_contrato_dias: "Entrada",
  clase_riesgo: "Entrada",
  tarifa_arl: "Entrada",
  numero_trabajadores: "Entrada",
  autoriza_datos: "Entrada",
  plan_solicitado: "Entrada",
  porcentaje_documentos: "Entrada",
  horas_sin_gestion: "Entrada",
  estado_sugerido: "Derivado",
  ibc: "Derivado",
  aporte_salud: "Derivado",
  aporte_pension: "Derivado",
  aporte_arl: "Derivado",
  total_aportes_cliente: "Derivado",
  num_reglas_criticas: "Motor",
  num_reglas_advertencia: "Motor",
} as const;

const NIVEL_RESULTADO_POR_IMPACTO: Record<NivelImpacto, NivelResultado> = {
  Normal: "Viable",
  Advertencia: "Requiere revisión",
  Crítico: "Crítica",
};

/** Colombia no tiene horario de verano: UTC−5 todo el año. */
const ZONA_HORARIA_COLOMBIA_MINUTOS = -300;

const CONTADOR_CRITICAS = "num_reglas_criticas";
const CONTADOR_ADVERTENCIAS = "num_reglas_advertencia";
const ES_PARAMETRO = /^[A-Z][A-Z0-9_]*$/;
const MS_POR_HORA = 3_600_000;
const MS_POR_DIA = 86_400_000;
/** Días entre el origen de los seriales de Sheets (1899-12-30) y 1970-01-01. */
const SERIAL_SHEETS_UNIX = 25_569;

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Valor normalizado de un hecho: número, texto o "SI"/"NO". */
export type Valor = number | string;
export type FilaCruda = Record<string, unknown>;

export interface TablasBaseConocimiento {
  Hechos: FilaCruda[];
  Parametros: FilaCruda[];
  Reglas: FilaCruda[];
  Condiciones_Regla: FilaCruda[];
  Acciones_Regla: FilaCruda[];
}

export interface TablasOperacion {
  Solicitudes: FilaCruda[];
  Solicitantes: FilaCruda[];
  Actividades_Economicas: FilaCruda[];
  Clases_Riesgo: FilaCruda[];
  Documentos_Solicitud: FilaCruda[];
  Documentos_Requeridos: FilaCruda[];
}

export type TablasSistema = TablasBaseConocimiento & TablasOperacion;

export interface ReglaActivada {
  /** Posición en la cadena de inferencia (1 = primera en dispararse). */
  orden: number;
  idRegla: string;
  nombre: string;
  nivelImpacto: NivelImpacto;
  /** Plantilla de la regla con los valores reales. */
  explicacion: string;
  /** Valores de los hechos y parámetros que hicieron cumplir sus condiciones. */
  hechosUsados: Record<string, Valor>;
}

export interface ResultadoEvaluacion {
  nivel: NivelResultado;
  estadoSugerido: string | null;
  numCriticas: number;
  numAdvertencias: number;
  reglasActivadas: ReglaActivada[];
  conclusiones: string[];
  recomendaciones: string[];
  alertas: string[];
  /** Todos los hechos al terminar la inferencia. */
  hechos: Record<string, Valor>;
  /** Problemas de configuración o de datos que no detuvieron la evaluación. */
  errores: string[];
}

export class ErrorExpresion extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorExpresion";
  }
}

class ErrorConfiguracion extends Error {}

class HechoFaltante extends Error {
  constructor(readonly hecho: string) {
    super(`falta el hecho "${hecho}"`);
  }
}

const mensajeDe = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

// ---------------------------------------------------------------------------
// Normalización de valores de Sheets
// ---------------------------------------------------------------------------

const esVacio = (valor: unknown) =>
  valor === null ||
  valor === undefined ||
  (typeof valor === "string" && valor.trim() === "");

function aNumero(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  if (/^-?\d+(\.\d+)?$/.test(texto)) return Number(texto);
  if (/^-?\d+,\d+$/.test(texto)) return Number(texto.replace(",", "."));
  return null;
}

const VERDADEROS = ["SI", "SÍ", "TRUE", "VERDADERO", "Y", "YES"];
const FALSOS = ["NO", "FALSE", "FALSO", "N"];

function aSiNo(valor: unknown): "SI" | "NO" | null {
  if (typeof valor === "boolean") return valor ? "SI" : "NO";
  if (typeof valor === "number")
    return valor === 1 ? "SI" : valor === 0 ? "NO" : null;
  if (typeof valor !== "string") return null;
  const texto = valor.trim().toUpperCase();
  if (VERDADEROS.includes(texto)) return "SI";
  if (FALSOS.includes(texto)) return "NO";
  return null;
}

function aTexto(valor: unknown): string | null {
  if (typeof valor === "string")
    return valor.trim() === "" ? null : valor.trim();
  if (typeof valor === "number" || typeof valor === "boolean")
    return String(valor);
  return null;
}

function normalizar(valor: unknown, tipoDato: string): Valor | null {
  if (tipoDato === "Número") return aNumero(valor);
  if (tipoDato === "SI/NO") return aSiNo(valor);
  return aTexto(valor);
}

const esFecha = (valor: unknown): valor is Date =>
  Object.prototype.toString.call(valor) === "[object Date]";

const FECHA_SIN_ZONA =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?$/;

/**
 * Convierte una fecha de Sheets a milisegundos de "hora de pared": la hora
 * tal como se ve en la hoja, contada como si fuera UTC. Los Date y los
 * textos sin zona ya son hora de pared; un texto con zona (…Z, …-05:00) es
 * un instante real y se lleva a la zona indicada.
 */
function aHoraDePared(valor: unknown, zonaMinutos: number): number | null {
  if (esFecha(valor))
    return Number.isNaN(valor.getTime()) ? null : valor.getTime();
  if (typeof valor === "number")
    return (valor - SERIAL_SHEETS_UNIX) * MS_POR_DIA;
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  const partes = FECHA_SIN_ZONA.exec(texto);
  if (partes) {
    const [, anio, mes, dia, hora = "0", minuto = "0", segundo = "0"] = partes;
    return Date.UTC(+anio, +mes - 1, +dia, +hora, +minuto, +segundo);
  }
  const instante = Date.parse(texto);
  return Number.isNaN(instante) ? null : instante + zonaMinutos * 60_000;
}

// ---------------------------------------------------------------------------
// Expresiones aritméticas (sin eval)
// ---------------------------------------------------------------------------

type Nodo =
  | { tipo: "numero"; valor: number }
  | { tipo: "identificador"; nombre: string }
  | { tipo: "funcion"; nombre: string; argumentos: Nodo[] }
  | { tipo: "negativo"; operando: Nodo }
  | {
      tipo: "binario";
      operador: "+" | "-" | "*" | "/";
      izquierda: Nodo;
      derecha: Nodo;
    };

const ARIDAD: Record<string, [number, number]> = {
  MAX: [1, Infinity],
  MIN: [1, Infinity],
  ROUND: [1, 2],
};

function tokenizar(texto: string): string[] {
  const tokens: string[] = [];
  const patron = /\s*(\d+(?:\.\d+)?|[A-Za-z_]\w*|[+\-*/(),])/y;
  let posicion = 0;
  while (texto.slice(posicion).trim() !== "") {
    patron.lastIndex = posicion;
    const coincidencia = patron.exec(texto);
    if (!coincidencia) {
      const simbolo = texto.slice(posicion).trim()[0];
      throw new ErrorExpresion(
        `símbolo no permitido "${simbolo}" en "${texto}"`,
      );
    }
    tokens.push(coincidencia[1]);
    posicion = patron.lastIndex;
  }
  return tokens;
}

/** Analiza una expresión como `MAX(ingreso_mensual - costos_deducibles, 0)`. */
export function analizarExpresion(texto: string): Nodo {
  const tokens = tokenizar(texto);
  if (tokens.length === 0) throw new ErrorExpresion("la expresión está vacía");
  let i = 0;

  const actual = () => tokens[i];
  const consumir = (esperado?: string) => {
    const token = tokens[i];
    if (token === undefined || (esperado !== undefined && token !== esperado)) {
      const que = esperado ? `"${esperado}"` : "un valor";
      throw new ErrorExpresion(`se esperaba ${que} en "${texto}"`);
    }
    i += 1;
    return token;
  };

  const suma = (): Nodo => {
    let nodo = producto();
    while (actual() === "+" || actual() === "-") {
      const operador = consumir() as "+" | "-";
      nodo = {
        tipo: "binario",
        operador,
        izquierda: nodo,
        derecha: producto(),
      };
    }
    return nodo;
  };

  const producto = (): Nodo => {
    let nodo = factor();
    while (actual() === "*" || actual() === "/") {
      const operador = consumir() as "*" | "/";
      nodo = { tipo: "binario", operador, izquierda: nodo, derecha: factor() };
    }
    return nodo;
  };

  const factor = (): Nodo => {
    const token = consumir();
    if (token === "-") return { tipo: "negativo", operando: factor() };
    if (token === "(") {
      const nodo = suma();
      consumir(")");
      return nodo;
    }
    if (/^\d/.test(token)) return { tipo: "numero", valor: Number(token) };
    if (!/^[A-Za-z_]/.test(token)) {
      throw new ErrorExpresion(`símbolo inesperado "${token}" en "${texto}"`);
    }
    if (actual() !== "(") return { tipo: "identificador", nombre: token };

    consumir("(");
    const argumentos: Nodo[] = [];
    if (actual() !== ")") {
      argumentos.push(suma());
      while (actual() === ",") {
        consumir(",");
        argumentos.push(suma());
      }
    }
    consumir(")");
    const aridad = ARIDAD[token];
    if (!aridad)
      throw new ErrorExpresion(`la función "${token}" no está permitida`);
    if (argumentos.length < aridad[0] || argumentos.length > aridad[1]) {
      throw new ErrorExpresion(`número de argumentos inválido para ${token}`);
    }
    return { tipo: "funcion", nombre: token, argumentos };
  };

  const arbol = suma();
  if (i < tokens.length)
    throw new ErrorExpresion(`sobra "${tokens[i]}" en "${texto}"`);
  return arbol;
}

function referenciasDeNodo(nodo: Nodo): {
  hechos: string[];
  parametros: string[];
} {
  const hechos = new Set<string>();
  const parametros = new Set<string>();
  const recorrer = (n: Nodo): void => {
    if (n.tipo === "identificador") {
      (ES_PARAMETRO.test(n.nombre) ? parametros : hechos).add(n.nombre);
    } else if (n.tipo === "binario") {
      recorrer(n.izquierda);
      recorrer(n.derecha);
    } else if (n.tipo === "negativo") {
      recorrer(n.operando);
    } else if (n.tipo === "funcion") {
      n.argumentos.forEach(recorrer);
    }
  };
  recorrer(nodo);
  return { hechos: [...hechos], parametros: [...parametros] };
}

/** Hechos (minúscula) y parámetros (MAYÚSCULA) que usa una expresión. */
export function referenciasExpresion(texto: string) {
  return referenciasDeNodo(analizarExpresion(texto));
}

interface Contexto {
  hechos: Map<string, Valor>;
  parametros: Map<string, number>;
}

function redondear(valor: number, decimales = 0): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

function evaluarNodo(nodo: Nodo, contexto: Contexto): number {
  switch (nodo.tipo) {
    case "numero":
      return nodo.valor;
    case "negativo":
      return -evaluarNodo(nodo.operando, contexto);
    case "identificador": {
      if (ES_PARAMETRO.test(nodo.nombre)) {
        const parametro = contexto.parametros.get(nodo.nombre);
        if (parametro === undefined) {
          throw new ErrorConfiguracion(
            `el parámetro "${nodo.nombre}" no existe`,
          );
        }
        return parametro;
      }
      const hecho = contexto.hechos.get(nodo.nombre);
      if (hecho === undefined) throw new HechoFaltante(nodo.nombre);
      if (typeof hecho !== "number") {
        throw new ErrorConfiguracion(
          `el hecho "${nodo.nombre}" no es numérico ("${hecho}")`,
        );
      }
      return hecho;
    }
    case "binario": {
      const a = evaluarNodo(nodo.izquierda, contexto);
      const b = evaluarNodo(nodo.derecha, contexto);
      if (nodo.operador === "+") return a + b;
      if (nodo.operador === "-") return a - b;
      if (nodo.operador === "*") return a * b;
      return a / b;
    }
    case "funcion": {
      const valores = nodo.argumentos.map((argumento) =>
        evaluarNodo(argumento, contexto),
      );
      if (nodo.nombre === "MAX") return Math.max(...valores);
      if (nodo.nombre === "MIN") return Math.min(...valores);
      return redondear(valores[0], valores[1]);
    }
  }
}

function calcular(nodo: Nodo, contexto: Contexto): number {
  const resultado = evaluarNodo(nodo, contexto);
  if (!Number.isFinite(resultado)) {
    throw new ErrorConfiguracion(
      "el cálculo no dio un número (¿división por cero?)",
    );
  }
  return resultado;
}

/**
 * Evalúa una expresión suelta. Las claves en MAYÚSCULA se tratan como
 * parámetros y las demás como hechos, igual que dentro de una regla.
 */
export function calcularExpresion(
  texto: string,
  valores: Record<string, number> = {},
): number {
  const contexto: Contexto = { hechos: new Map(), parametros: new Map() };
  for (const [nombre, valor] of Object.entries(valores)) {
    if (ES_PARAMETRO.test(nombre)) contexto.parametros.set(nombre, valor);
    else contexto.hechos.set(nombre, valor);
  }
  return calcular(analizarExpresion(texto), contexto);
}

// ---------------------------------------------------------------------------
// Plantillas de texto
// ---------------------------------------------------------------------------

const MARCADOR = /\{([A-Za-z_]\w*)(?:\|(\w+))?\}/g;

/** Marcadores `{hecho}`, `{PARAMETRO}` o `{hecho|moneda}` de una plantilla. */
export function analizarPlantilla(texto: string) {
  const marcadores = [...texto.matchAll(MARCADOR)].map((coincidencia) => ({
    nombre: coincidencia[1],
    formato: coincidencia[2] as string | undefined,
  }));
  return {
    marcadores,
    llavesSueltas: /[{}]/.test(texto.replace(MARCADOR, "")),
  };
}

export function formatearNumero(valor: number, decimales = 3): string {
  const [entero, fraccion = ""] = Math.abs(valor).toFixed(decimales).split(".");
  const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decimalesUtiles = fraccion.replace(/0+$/, "");
  const signo = valor < 0 && (Number(entero) > 0 || decimalesUtiles) ? "-" : "";
  return `${signo}${miles}${decimalesUtiles ? `,${decimalesUtiles}` : ""}`;
}

export const formatearMoneda = (valor: number) =>
  `$${formatearNumero(Math.round(valor), 0)}`;

function renderizarPlantilla(texto: string, contexto: Contexto): string {
  return texto.replace(
    MARCADOR,
    (_marcador, nombre: string, formato?: string) => {
      const valor = ES_PARAMETRO.test(nombre)
        ? contexto.parametros.get(nombre)
        : contexto.hechos.get(nombre);
      if (valor === undefined) return "(sin dato)";
      if (typeof valor !== "number") return valor;
      return formato === "moneda"
        ? formatearMoneda(valor)
        : formatearNumero(valor);
    },
  );
}

// ---------------------------------------------------------------------------
// Compilación de la base de conocimiento
// ---------------------------------------------------------------------------

interface DefinicionHecho {
  tipo: string;
  origen: string;
  porDefecto: unknown;
}

interface CondicionCompilada {
  hecho: string;
  operador: Operador;
  literales: Valor[];
  expresion: Nodo | null;
  referencias: string[];
}

type AccionCompilada =
  | { tipo: "ASIGNAR"; destino: string; valor: Valor }
  | { tipo: "CALCULAR"; destino: string; expresion: Nodo }
  | { tipo: "CONCLUIR" | "RECOMENDAR" | "ALERTAR"; plantilla: string };

interface ReglaCompilada {
  id: string;
  nombre: string;
  prioridad: number;
  nivel: NivelImpacto;
  explicacion: string;
  condiciones: CondicionCompilada[];
  acciones: AccionCompilada[];
}

export interface BaseCompilada {
  hechos: Map<string, DefinicionHecho>;
  parametros: Map<string, number>;
  /** Reglas activas y bien formadas, ordenadas por prioridad. */
  reglas: ReglaCompilada[];
  /** Reglas o parámetros que se descartaron por estar mal configurados. */
  errores: string[];
}

const OPERADORES: readonly string[] = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "EN_LISTA",
  "EXISTE",
  "NO_EXISTE",
];
const NIVELES_IMPACTO: readonly string[] = ["Normal", "Advertencia", "Crítico"];

function buscarHecho(
  hechos: Map<string, DefinicionHecho>,
  id: string | null,
  contexto: string,
) {
  const definicion = id ? hechos.get(id) : undefined;
  if (!id || !definicion) {
    throw new ErrorConfiguracion(
      `${contexto} usa el hecho "${id ?? ""}", que no existe`,
    );
  }
  return { id, definicion };
}

function compilarCondicion(
  fila: FilaCruda,
  hechos: Map<string, DefinicionHecho>,
): CondicionCompilada {
  const contexto = `la condición ${aTexto(fila.ID_Condicion) ?? "sin id"}`;
  const { id: hecho, definicion } = buscarHecho(
    hechos,
    aTexto(fila.ID_Hecho),
    contexto,
  );
  const operador = aTexto(fila.Operador) ?? "";
  if (!OPERADORES.includes(operador)) {
    throw new ErrorConfiguracion(
      `${contexto} usa el operador "${operador}", que no existe`,
    );
  }
  const base: CondicionCompilada = {
    hecho,
    operador: operador as Operador,
    literales: [],
    expresion: null,
    referencias: [],
  };
  if (operador === "EXISTE" || operador === "NO_EXISTE") return base;

  const valor = aTexto(fila.Valor);
  if (valor === null)
    throw new ErrorConfiguracion(`${contexto} no tiene valor`);
  if (aTexto(fila.Tipo_Valor) === "Expresion") {
    const expresion = analizarExpresion(valor);
    const { hechos: usados, parametros } = referenciasDeNodo(expresion);
    return { ...base, expresion, referencias: [...usados, ...parametros] };
  }
  const partes =
    operador === "EN_LISTA" ? valor.split(SEPARADOR_LISTA) : [valor];
  const literales = partes.map((parte) => {
    const literal = normalizar(parte, definicion.tipo);
    if (literal === null) {
      throw new ErrorConfiguracion(
        `${contexto}: "${parte}" no es un valor ${definicion.tipo}`,
      );
    }
    return literal;
  });
  return { ...base, literales };
}

function compilarAccion(
  fila: FilaCruda,
  hechos: Map<string, DefinicionHecho>,
): AccionCompilada {
  const contexto = `la acción ${aTexto(fila.ID_Accion) ?? "sin id"}`;
  const tipo = aTexto(fila.Tipo) ?? "";
  const valor = aTexto(fila.Valor) ?? "";
  if (tipo === "CONCLUIR" || tipo === "RECOMENDAR" || tipo === "ALERTAR") {
    return { tipo, plantilla: valor };
  }
  if (tipo !== "ASIGNAR" && tipo !== "CALCULAR") {
    throw new ErrorConfiguracion(
      `${contexto} tiene el tipo "${tipo}", que no existe`,
    );
  }
  const { id: destino, definicion } = buscarHecho(
    hechos,
    aTexto(fila.ID_Hecho_Destino),
    contexto,
  );
  if (definicion.origen !== "Derivado") {
    throw new ErrorConfiguracion(
      `${contexto} no puede escribir "${destino}" (es un hecho de ${definicion.origen})`,
    );
  }
  if (tipo === "CALCULAR")
    return { tipo, destino, expresion: analizarExpresion(valor) };
  const literal = normalizar(valor, definicion.tipo);
  if (literal === null) {
    throw new ErrorConfiguracion(
      `${contexto}: "${valor}" no es un valor ${definicion.tipo}`,
    );
  }
  return { tipo, destino, valor: literal };
}

function compilarRegla(
  id: string,
  fila: FilaCruda,
  tablas: TablasBaseConocimiento,
  hechos: Map<string, DefinicionHecho>,
): ReglaCompilada {
  const prioridad = aNumero(fila.Prioridad);
  if (prioridad === null)
    throw new ErrorConfiguracion("su prioridad no es numérica");
  const nivel = aTexto(fila.Nivel_Impacto) ?? "";
  if (!NIVELES_IMPACTO.includes(nivel)) {
    throw new ErrorConfiguracion(`su nivel de impacto "${nivel}" no existe`);
  }
  const deLaRegla = (filas: FilaCruda[]) =>
    filas.filter((f) => aTexto(f.ID_Regla) === id);
  const condiciones = deLaRegla(tablas.Condiciones_Regla).map((c) =>
    compilarCondicion(c, hechos),
  );
  const acciones = deLaRegla(tablas.Acciones_Regla)
    .sort((a, b) => (aNumero(a.Orden) ?? 0) - (aNumero(b.Orden) ?? 0))
    .map((a) => compilarAccion(a, hechos));
  if (condiciones.length === 0)
    throw new ErrorConfiguracion("no tiene condiciones");
  if (acciones.length === 0) throw new ErrorConfiguracion("no tiene acciones");

  return {
    id,
    nombre: aTexto(fila.Nombre) ?? id,
    prioridad,
    nivel: nivel as NivelImpacto,
    explicacion: aTexto(fila.Explicacion) ?? "",
    condiciones,
    acciones,
  };
}

/**
 * Prepara la base de conocimiento para evaluar. Una regla mal configurada
 * (por ejemplo, editada a mano en AppSheet) no detiene al motor: se
 * descarta y queda anotada en `errores`.
 */
export function compilarBase(tablas: TablasBaseConocimiento): BaseCompilada {
  const errores: string[] = [];

  const hechos = new Map<string, DefinicionHecho>();
  for (const fila of tablas.Hechos) {
    const id = aTexto(fila.ID_Hecho);
    if (!id) continue;
    hechos.set(id, {
      tipo: aTexto(fila.Tipo_Dato) ?? "Texto",
      origen: aTexto(fila.Origen) ?? "Entrada",
      porDefecto: fila.Valor_Por_Defecto,
    });
  }

  const parametros = new Map<string, number>();
  for (const fila of tablas.Parametros) {
    const id = aTexto(fila.ID_Parametro);
    if (!id) continue;
    const valor = aNumero(fila.Valor);
    if (valor === null) {
      errores.push(
        `Parámetro ${id}: el valor "${String(fila.Valor)}" no es numérico`,
      );
    } else {
      parametros.set(id, valor);
    }
  }

  const reglas: ReglaCompilada[] = [];
  for (const fila of tablas.Reglas) {
    const id = aTexto(fila.ID_Regla);
    if (!id || aSiNo(fila.Activa) === "NO") continue;
    try {
      reglas.push(compilarRegla(id, fila, tablas, hechos));
    } catch (error) {
      errores.push(`Regla ${id}: se ignora porque ${mensajeDe(error)}`);
    }
  }
  reglas.sort((a, b) => a.prioridad - b.prioridad || a.id.localeCompare(b.id));

  return { hechos, parametros, reglas, errores };
}

// ---------------------------------------------------------------------------
// Inferencia
// ---------------------------------------------------------------------------

function iguales(a: Valor, b: Valor): boolean {
  if (typeof a === "number" && typeof b === "number")
    return Math.abs(a - b) < 1e-9;
  return String(a) === String(b);
}

function seCumple(condicion: CondicionCompilada, contexto: Contexto): boolean {
  const actual = contexto.hechos.get(condicion.hecho);
  if (condicion.operador === "EXISTE") return actual !== undefined;
  if (condicion.operador === "NO_EXISTE") return actual === undefined;
  if (actual === undefined) return false;

  let comparados = condicion.literales;
  if (condicion.expresion) {
    try {
      comparados = [calcular(condicion.expresion, contexto)];
    } catch (error) {
      // Un hecho todavía sin valor dentro de la expresión = condición falsa,
      // igual que comparar contra un hecho vacío.
      if (error instanceof HechoFaltante) return false;
      throw error;
    }
  }

  const [comparado] = comparados;
  switch (condicion.operador) {
    case "=":
      return iguales(actual, comparado);
    case "!=":
      return !iguales(actual, comparado);
    case "EN_LISTA":
      return comparados.some((valor) => iguales(actual, valor));
    default: {
      if (typeof actual !== "number" || typeof comparado !== "number")
        return false;
      if (condicion.operador === ">") return actual > comparado;
      if (condicion.operador === ">=") return actual >= comparado;
      if (condicion.operador === "<") return actual < comparado;
      return actual <= comparado;
    }
  }
}

function hechosIniciales(
  base: BaseCompilada,
  entrada: Record<string, unknown>,
  errores: string[],
): Map<string, Valor> {
  const hechos = new Map<string, Valor>();
  for (const [id, definicion] of base.hechos) {
    if (definicion.origen !== "Entrada") continue;
    const crudo = esVacio(entrada[id]) ? definicion.porDefecto : entrada[id];
    if (esVacio(crudo)) continue;
    const valor = normalizar(crudo, definicion.tipo);
    if (valor === null) {
      errores.push(
        `Hecho ${id}: "${String(crudo)}" no es un valor ${definicion.tipo}; se ignora`,
      );
    } else {
      hechos.set(id, valor);
    }
  }
  hechos.set(CONTADOR_CRITICAS, 0);
  hechos.set(CONTADOR_ADVERTENCIAS, 0);
  return hechos;
}

function valoresUsados(
  regla: ReglaCompilada,
  contexto: Contexto,
): Record<string, Valor> {
  const usados: Record<string, Valor> = {};
  for (const condicion of regla.condiciones) {
    usados[condicion.hecho] =
      contexto.hechos.get(condicion.hecho) ?? "(sin valor)";
    for (const nombre of condicion.referencias) {
      const valor = ES_PARAMETRO.test(nombre)
        ? contexto.parametros.get(nombre)
        : contexto.hechos.get(nombre);
      if (valor !== undefined) usados[nombre] = valor;
    }
  }
  return usados;
}

type Textos = Record<"CONCLUIR" | "RECOMENDAR" | "ALERTAR", string[]>;

/** Ejecuta las acciones sobre una copia: si una falla, no queda nada a medias. */
function ejecutarAcciones(regla: ReglaCompilada, contexto: Contexto) {
  const hechos = new Map(contexto.hechos);
  const local: Contexto = { hechos, parametros: contexto.parametros };
  const textos: Textos = { CONCLUIR: [], RECOMENDAR: [], ALERTAR: [] };
  for (const accion of regla.acciones) {
    if (accion.tipo === "ASIGNAR") hechos.set(accion.destino, accion.valor);
    else if (accion.tipo === "CALCULAR")
      hechos.set(accion.destino, calcular(accion.expresion, local));
    else textos[accion.tipo].push(renderizarPlantilla(accion.plantilla, local));
  }
  return { hechos, textos };
}

function siguienteRegla(
  base: BaseCompilada,
  contexto: Contexto,
  intentadas: Set<string>,
  errores: string[],
): ReglaCompilada | undefined {
  for (const regla of base.reglas) {
    if (intentadas.has(regla.id)) continue;
    try {
      if (regla.condiciones.every((condicion) => seCumple(condicion, contexto)))
        return regla;
    } catch (error) {
      intentadas.add(regla.id);
      errores.push(
        `Regla ${regla.id}: no se pudo evaluar porque ${mensajeDe(error)}`,
      );
    }
  }
  return undefined;
}

/** Ejecuta la inferencia sobre unos hechos de entrada (nombres de la tabla Hechos). */
export function evaluar(
  base: BaseCompilada,
  entrada: Record<string, unknown>,
): ResultadoEvaluacion {
  const errores = [...base.errores];
  let contexto: Contexto = {
    hechos: hechosIniciales(base, entrada, errores),
    parametros: base.parametros,
  };
  const intentadas = new Set<string>();
  const reglasActivadas: ReglaActivada[] = [];
  const conclusiones: string[] = [];
  const recomendaciones: string[] = [];
  const alertas: string[] = [];
  let numCriticas = 0;
  let numAdvertencias = 0;

  for (;;) {
    const regla = siguienteRegla(base, contexto, intentadas, errores);
    if (!regla) break;
    intentadas.add(regla.id);

    const hechosUsados = valoresUsados(regla, contexto);
    let ejecucion: ReturnType<typeof ejecutarAcciones>;
    try {
      ejecucion = ejecutarAcciones(regla, contexto);
    } catch (error) {
      errores.push(
        `Regla ${regla.id}: no se pudo ejecutar porque ${mensajeDe(error)}`,
      );
      continue;
    }
    contexto = { hechos: ejecucion.hechos, parametros: base.parametros };

    // La explicación se arma ANTES de sumar el impacto de la propia regla:
    // "se activaron 2 reglas críticas" debe contar las que la dispararon.
    const explicacion = renderizarPlantilla(regla.explicacion, contexto);
    if (regla.nivel === "Crítico") {
      numCriticas += 1;
      contexto.hechos.set(CONTADOR_CRITICAS, numCriticas);
    } else if (regla.nivel === "Advertencia") {
      numAdvertencias += 1;
      contexto.hechos.set(CONTADOR_ADVERTENCIAS, numAdvertencias);
    }

    conclusiones.push(...ejecucion.textos.CONCLUIR);
    recomendaciones.push(...ejecucion.textos.RECOMENDAR);
    alertas.push(...ejecucion.textos.ALERTAR);
    reglasActivadas.push({
      orden: reglasActivadas.length + 1,
      idRegla: regla.id,
      nombre: regla.nombre,
      nivelImpacto: regla.nivel,
      explicacion,
      hechosUsados,
    });
  }

  const impacto: NivelImpacto =
    numCriticas > 0
      ? "Crítico"
      : numAdvertencias > 0
        ? "Advertencia"
        : "Normal";
  const estado = contexto.hechos.get("estado_sugerido");
  return {
    nivel: NIVEL_RESULTADO_POR_IMPACTO[impacto],
    estadoSugerido: typeof estado === "string" ? estado : null,
    numCriticas,
    numAdvertencias,
    reglasActivadas,
    conclusiones,
    recomendaciones,
    alertas,
    hechos: Object.fromEntries(contexto.hechos),
    errores,
  };
}

// ---------------------------------------------------------------------------
// Integración con las tablas de operación
// ---------------------------------------------------------------------------

export interface OpcionesSolicitud {
  /** Momento de la evaluación: un Date real o un texto de fecha. */
  ahora: Date | string;
  /** Zona horaria en la que están escritas las fechas de la hoja. */
  zonaHorariaMinutos?: number;
}

const mismoId = (a: unknown, b: unknown) =>
  aTexto(a) !== null && aTexto(a) === aTexto(b);

/** Arma los hechos de entrada de una solicitud a partir de las tablas de Sheets. */
export function hechosDesdeTablas(
  idSolicitud: string,
  tablas: TablasOperacion,
  {
    ahora,
    zonaHorariaMinutos = ZONA_HORARIA_COLOMBIA_MINUTOS,
  }: OpcionesSolicitud,
): Record<string, unknown> {
  const solicitud = tablas.Solicitudes.find((f) =>
    mismoId(f.ID_Solicitud, idSolicitud),
  );
  if (!solicitud) throw new Error(`La solicitud ${idSolicitud} no existe`);

  const solicitante = tablas.Solicitantes.find((f) =>
    mismoId(f.ID_Solicitante, solicitud.ID_Solicitante),
  );
  const actividad = tablas.Actividades_Economicas.find((f) =>
    mismoId(f.ID_Actividad, solicitud.ID_Actividad),
  );
  const clase = actividad
    ? tablas.Clases_Riesgo.find((f) => mismoId(f.ID_Clase, actividad.ID_Clase))
    : undefined;

  const tipo = aTexto(solicitud.Tipo_Vinculacion);
  let porcentajeDocumentos: number | undefined;
  if (tipo) {
    const requeridos = tablas.Documentos_Requeridos.filter(
      (documento) =>
        aSiNo(documento.Obligatorio) === "SI" &&
        String(documento.Aplica_A ?? "")
          .split(",")
          .map((valor) => valor.trim())
          .includes(tipo),
    );
    const recibidos = requeridos.filter((requerido) =>
      tablas.Documentos_Solicitud.some(
        (entregado) =>
          mismoId(entregado.ID_Solicitud, idSolicitud) &&
          mismoId(entregado.ID_Documento, requerido.ID_Documento) &&
          aTexto(entregado.Estado) === "Recibido",
      ),
    );
    porcentajeDocumentos =
      requeridos.length === 0
        ? 100
        : redondear((recibidos.length / requeridos.length) * 100, 2);
  }

  const ultimaGestion = aHoraDePared(
    solicitud.Fecha_Ultima_Gestion,
    zonaHorariaMinutos,
  );
  const momento = esFecha(ahora)
    ? ahora.getTime() + zonaHorariaMinutos * 60_000
    : aHoraDePared(ahora, zonaHorariaMinutos);
  const horasSinGestion =
    ultimaGestion === null || momento === null
      ? undefined
      : Math.max(0, redondear((momento - ultimaGestion) / MS_POR_HORA, 1));

  return {
    id_solicitud: solicitud.ID_Solicitud,
    tipo_vinculacion: solicitud.Tipo_Vinculacion,
    ingreso_mensual: solicitud.Ingreso_Mensual,
    costos_deducibles: solicitud.Costos_Deducibles,
    duracion_contrato_dias: solicitud.Duracion_Contrato_Dias,
    clase_riesgo: actividad?.ID_Clase,
    tarifa_arl: clase?.Tarifa_ARL_Pct,
    numero_trabajadores: solicitud.Numero_Trabajadores,
    autoriza_datos: solicitante?.Autoriza_Datos,
    plan_solicitado: solicitud.ID_Plan,
    porcentaje_documentos: porcentajeDocumentos,
    horas_sin_gestion: horasSinGestion,
  };
}

/** Evalúa una solicitud leyendo todo lo necesario de las tablas. */
export function evaluarSolicitud(
  idSolicitud: string,
  tablas: TablasSistema,
  opciones: OpcionesSolicitud,
): ResultadoEvaluacion {
  const entrada = hechosDesdeTablas(idSolicitud, tablas, opciones);
  const resultado = evaluar(compilarBase(tablas), entrada);
  if (entrada.horas_sin_gestion === undefined) {
    // Fecha_Ultima_Gestion es obligatoria: si no se pudo leer, su formato no
    // es reconocible y el escalamiento por tiempo no se evaluó. Se avisa en
    // vez de fallar en silencio.
    resultado.errores.push(
      `Solicitud ${idSolicitud}: no se pudo leer Fecha_Ultima_Gestion; el escalamiento por tiempo no se evaluó`,
    );
  }
  return resultado;
}

// ---------------------------------------------------------------------------
// Salidas
// ---------------------------------------------------------------------------

export interface DatosRegistro {
  idEvaluacion: string;
  fecha: Date | string;
  origen: string;
}

type Celda = string | number | Date | null;

/** Filas listas para agregar a las tablas Evaluaciones y Reglas_Activadas. */
export function filasResultado(
  resultado: ResultadoEvaluacion,
  registro: DatosRegistro,
) {
  const dinero = (id: string) => {
    const valor = resultado.hechos[id];
    return typeof valor === "number" ? Math.round(valor) : null;
  };
  const lineas = (textos: string[]) =>
    textos.length > 0 ? textos.join("\n") : null;

  const evaluacion: Record<string, Celda> = {
    ID_Evaluacion: registro.idEvaluacion,
    ID_Solicitud: aTexto(resultado.hechos.id_solicitud),
    Fecha: registro.fecha,
    Origen: registro.origen,
    Nivel_Resultado: resultado.nivel,
    Estado_Sugerido: resultado.estadoSugerido,
    Num_Reglas_Activadas: resultado.reglasActivadas.length,
    Num_Criticas: resultado.numCriticas,
    Num_Advertencias: resultado.numAdvertencias,
    IBC: dinero("ibc"),
    Aporte_Salud: dinero("aporte_salud"),
    Aporte_Pension: dinero("aporte_pension"),
    Aporte_ARL: dinero("aporte_arl"),
    Total_Aportes_Cliente: dinero("total_aportes_cliente"),
    Conclusiones: lineas(resultado.conclusiones),
    Recomendaciones: lineas(resultado.recomendaciones),
    Explicacion_IA: null,
    Hechos_Finales_JSON: JSON.stringify(resultado.hechos),
    URL_PDF: null,
  };

  const reglasActivadas: Record<string, Celda>[] =
    resultado.reglasActivadas.map((activada) => ({
      ID_Regla_Activada: `${registro.idEvaluacion}-${String(activada.orden).padStart(2, "0")}`,
      ID_Evaluacion: registro.idEvaluacion,
      ID_Regla: activada.idRegla,
      Orden_Disparo: activada.orden,
      Nivel_Impacto: activada.nivelImpacto,
      Explicacion_Generada: activada.explicacion,
      Hechos_Usados: Object.entries(activada.hechosUsados)
        .map(
          ([nombre, valor]) =>
            `${nombre} = ${typeof valor === "number" ? formatearNumero(valor) : valor}`,
        )
        .join("; "),
    }));

  return { evaluacion, reglasActivadas };
}

/** Explicación completa en texto plano (Telegram, PDF, prompt del agente IA). */
export function resumenTexto(resultado: ResultadoEvaluacion): string {
  const seccion = (titulo: string, items: string[]) =>
    items.length > 0
      ? ["", `${titulo}:`, ...items.map((item) => `- ${item}`)]
      : [];
  return [
    `Clasificación: ${resultado.nivel}`,
    `Estado sugerido: ${resultado.estadoSugerido ?? "sin definir"}`,
    "",
    `Reglas activadas (${resultado.reglasActivadas.length}):`,
    ...resultado.reglasActivadas.map(
      (a) =>
        `${a.orden}. ${a.idRegla} · ${a.nombre} [${a.nivelImpacto}]: ${a.explicacion}`,
    ),
    ...seccion("Conclusiones", resultado.conclusiones),
    ...seccion("Recomendaciones", resultado.recomendaciones),
    ...seccion("Alertas", resultado.alertas),
  ].join("\n");
}
