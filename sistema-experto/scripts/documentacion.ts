// Genera la documentación Markdown del sistema experto a partir de las
// mismas fuentes que el .xlsx y del motor real, para que nunca quede
// desactualizada respecto a lo que se carga en Google Sheets.

import { PRICING_PLANS } from "@/constants/pricing-plans";
import {
  CATEGORIAS_REGLA,
  ESTADOS_VERIFICACION,
  GRUPOS_TABLA,
  NIVELES_IMPACTO,
  TABLAS,
  fecha,
  type BaseDatos,
  type Columna,
} from "@/sistema-experto/base-conocimiento/esquema";
import {
  HECHOS,
  PARAMETROS,
  REGLAS,
  type DefinicionCondicion,
  type DefinicionRegla,
} from "@/sistema-experto/base-conocimiento/reglas";
import {
  CASOS_DEMO,
  SEMILLA,
} from "@/sistema-experto/base-conocimiento/semilla";
import {
  evaluarSolicitud,
  formatearMoneda,
  formatearNumero,
} from "@/sistema-experto/motor/motor";
import { FECHA_EVALUACION_DEMO } from "./preparar-datos";

const AVISO =
  "> Generado por `npm run sistema-experto:generar`. No editar a mano.";

const celda = (texto: string) =>
  texto.replaceAll("|", "\\|").replaceAll("\n", " ");

const NOMBRE_PLAN = new Map(PRICING_PLANS.map((p) => [p.slug, p.name]));
const nombrePlan = (slug: string) => NOMBRE_PLAN.get(slug) ?? slug;

// ---------------------------------------------------------------------------
// Modelo de datos
// ---------------------------------------------------------------------------

function tipoColumna(columna: Columna): string {
  if (columna.tipo === "Ref") {
    return `Ref → ${columna.ref}${columna.esParteDe ? " (parte de)" : ""}`;
  }
  if (columna.valores) {
    const valores =
      columna.valores.length > 8
        ? `${columna.valores.length} valores`
        : columna.valores.join(" / ");
    return `${columna.tipo}: ${valores}`;
  }
  return columna.tipo;
}

/** `datos`: lo que se carga en Sheets, para informar las filas iniciales reales. */
export function generarModeloDatosMd(datos: BaseDatos): string {
  const lineas = [
    "# Modelo de datos — Google Sheets / AppSheet",
    "",
    AVISO,
    "",
    `${TABLAS.length} tablas agrupadas en ${GRUPOS_TABLA.length} bloques. Cada tabla es una pestaña del archivo \`sistema-experto/salida/SolutaPLUS_BaseDatos.xlsx\`.`,
    "",
    "## Diagrama entidad-relación",
    "",
    "```mermaid",
    "erDiagram",
  ];

  for (const tabla of TABLAS) {
    for (const columna of tabla.columnas) {
      if (columna.ref) {
        const cardinalidad = columna.requerida ? "||--o{" : "|o--o{";
        lineas.push(
          `  ${columna.ref} ${cardinalidad} ${tabla.nombre} : "${columna.nombre}"`,
        );
      }
    }
  }
  for (const tabla of TABLAS) {
    lineas.push(`  ${tabla.nombre} {`);
    for (const columna of tabla.columnas) {
      const marca = columna.clave ? " PK" : columna.ref ? " FK" : "";
      lineas.push(
        `    ${columna.tipo.replace(/[^A-Za-z]/g, "")} ${columna.nombre}${marca}`,
      );
    }
    lineas.push("  }");
  }
  lineas.push("```", "");

  for (const grupo of GRUPOS_TABLA) {
    lineas.push(`## ${grupo}`, "");
    for (const tabla of TABLAS.filter((t) => t.grupo === grupo)) {
      const filas = datos[tabla.nombre].length;
      lineas.push(
        `### ${tabla.nombre}`,
        "",
        `${tabla.descripcion} _Filas iniciales: ${filas}._`,
        "",
        "| Columna | Tipo en AppSheet | Obligatoria | Descripción |",
        "|---|---|---|---|",
        ...tabla.columnas.map(
          (c) =>
            `| ${c.clave ? `**${c.nombre}** 🔑` : c.nombre} | ${celda(tipoColumna(c))} | ${c.requerida ? "Sí" : "No"} | ${celda(c.descripcion)} |`,
        ),
        "",
      );
    }
  }
  return lineas.join("\n");
}

// ---------------------------------------------------------------------------
// Catálogo de reglas
// ---------------------------------------------------------------------------

const TEXTO_OPERADOR: Record<DefinicionCondicion["operador"], string> = {
  "=": "=",
  "!=": "≠",
  ">": ">",
  ">=": "≥",
  "<": "<",
  "<=": "≤",
  EN_LISTA: "está en",
  EXISTE: "tiene valor",
  NO_EXISTE: "no tiene valor",
};

function textoCondicion(condicion: DefinicionCondicion): string {
  const base = `\`${condicion.hecho}\` ${TEXTO_OPERADOR[condicion.operador]}`;
  if (!condicion.valor) return base;
  const valor =
    condicion.tipoValor === "Expresion"
      ? `\`${condicion.valor}\``
      : condicion.valor
          .split("|")
          .map((v) => `«${v}»`)
          .join(", ");
  return `${base} ${valor}`;
}

const valorParametro = (valor: number, unidad: string) =>
  unidad === "COP" ? formatearMoneda(valor) : formatearNumero(valor);

const PARAMETROS_POR_ID = new Map(PARAMETROS.map((p) => [p.id, p]));

/** Reemplaza {PARAMETROS} por su valor actual, para leer el enunciado. */
function conParametros(texto: string): string {
  return texto.replace(/\{([A-Z][A-Z0-9_]*)\}/g, (marcador, id: string) => {
    const parametro = PARAMETROS_POR_ID.get(id);
    return parametro
      ? valorParametro(parametro.valor, parametro.unidad)
      : marcador;
  });
}

export function generarCatalogoReglasMd(): string {
  const contar = (
    valores: readonly string[],
    clave: (regla: DefinicionRegla) => string,
  ) =>
    valores
      .map((v) => `${v}: ${REGLAS.filter((r) => clave(r) === v).length}`)
      .join(" · ");

  const lineas = [
    "# Catálogo de la base de conocimiento",
    "",
    AVISO,
    "",
    `**${REGLAS.length} reglas SI-ENTONCES**, ${HECHOS.length} hechos y ${PARAMETROS.length} parámetros.`,
    "",
    `- Por impacto: ${contar(NIVELES_IMPACTO, (r) => r.nivel)}`,
    `- Por categoría: ${contar(CATEGORIAS_REGLA, (r) => r.categoria)}`,
    `- Por respaldo: ${contar(ESTADOS_VERIFICACION, (r) => r.estado)}`,
    "",
    "## Parámetros",
    "",
    "| ID | Nombre | Valor | Estado | Fuente |",
    "|---|---|---|---|---|",
    ...PARAMETROS.map(
      (p) =>
        `| \`${p.id}\` | ${celda(p.nombre)} | ${valorParametro(p.valor, p.unidad)}${p.unidad === "COP" ? "" : ` ${p.unidad}`} | ${p.estado} | ${celda(p.fuente)} |`,
    ),
    "",
    "## Hechos",
    "",
    "| Hecho | Tipo | Origen | Descripción / fuente del dato |",
    "|---|---|---|---|",
    ...HECHOS.map(
      (h) =>
        `| \`${h.id}\` | ${h.tipo} | ${h.origen} | ${celda(h.descripcion)}${h.fuenteDato ? ` <br>_${celda(h.fuenteDato)}_` : ""}${h.porDefecto ? ` <br>Por defecto: \`${h.porDefecto}\`` : ""} |`,
    ),
    "",
    "## Reglas",
    "",
  ];

  for (const regla of REGLAS) {
    lineas.push(
      `### ${regla.id} · ${regla.nombre}`,
      "",
      `**Categoría:** ${regla.categoria} · **Prioridad:** ${regla.prioridad} · **Impacto:** ${regla.nivel} · **Respaldo:** ${regla.estado}`,
      "",
      `> ${conParametros(regla.enunciado)}`,
      "",
      "**SI** (todas se cumplen):",
      ...regla.si.map((c) => `- ${textoCondicion(c)}`),
      "",
      "**ENTONCES:**",
      ...regla.entonces.map((a) =>
        a.destino
          ? `- ${a.tipo} \`${a.destino}\` ← \`${a.valor}\``
          : `- ${a.tipo}: ${a.valor}`,
      ),
      "",
      `**Explicación:** ${regla.explicacion}`,
      "",
      `**Fuente:** ${regla.fuente}`,
      "",
    );
  }

  lineas.push(
    "## Casos de demostración (datos ficticios)",
    "",
    "Resultado esperado con los datos semilla. Los tests del motor lo verifican y [`evaluaciones-demo.md`](evaluaciones-demo.md) muestra la explicación completa.",
    "",
    "| Solicitud | Perfil | Nivel | Estado sugerido | Reglas activadas | Nota |",
    "|---|---|---|---|---|---|",
    ...CASOS_DEMO.map(
      (c) =>
        `| ${c.id} | ${c.tipo}, ${nombrePlan(c.plan)} | **${c.esperado.nivel}** | ${c.esperado.estado} | ${c.esperado.reglas.join(", ")} | ${celda(c.esperado.nota)} |`,
    ),
    "",
  );
  return lineas.join("\n");
}

// ---------------------------------------------------------------------------
// Evaluaciones de los casos de demostración (salida real del motor)
// ---------------------------------------------------------------------------

const LIQUIDACION: [string, string][] = [
  ["IBC", "ibc"],
  ["Salud", "aporte_salud"],
  ["Pensión", "aporte_pension"],
  ["ARL", "aporte_arl"],
  ["Total a cargo del solicitante", "total_aportes_cliente"],
];

export function generarEvaluacionesDemoMd(): string {
  const lineas = [
    "# Evaluaciones de los casos de demostración",
    "",
    AVISO,
    "",
    `Salida real del motor (\`sistema-experto/motor/motor.ts\`) sobre los datos semilla, evaluados el ${FECHA_EVALUACION_DEMO.replace("T", " ")} (hora de Colombia). Es la misma explicación que n8n guarda en las tablas Evaluaciones y Reglas_Activadas.`,
    "",
  ];

  for (const caso of CASOS_DEMO) {
    const resultado = evaluarSolicitud(caso.id, SEMILLA, {
      ahora: fecha(FECHA_EVALUACION_DEMO),
      zonaHorariaMinutos: 0,
    });
    const reglas = resultado.reglasActivadas.map((a) => a.idRegla);
    const coincide =
      reglas.join() === caso.esperado.reglas.join() &&
      resultado.nivel === caso.esperado.nivel &&
      resultado.estadoSugerido === caso.esperado.estado;

    lineas.push(
      `## ${caso.id} · ${caso.solicitante.nombre}`,
      "",
      `_${caso.tipo} · ${nombrePlan(caso.plan)} — «${caso.descripcion}»_`,
      "",
      `**Clasificación: ${resultado.nivel}** · Estado sugerido: ${resultado.estadoSugerido ?? "sin definir"} · ${resultado.reglasActivadas.length} reglas activadas (${resultado.numCriticas} críticas, ${resultado.numAdvertencias} advertencias) · ${coincide ? "✅ coincide con el resultado esperado" : "❌ NO coincide con el resultado esperado"}`,
      "",
      "| # | Regla | Impacto | Por qué se activó |",
      "|---|---|---|---|",
      ...resultado.reglasActivadas.map(
        (a) =>
          `| ${a.orden} | ${a.idRegla} · ${celda(a.nombre)} | ${a.nivelImpacto} | ${celda(a.explicacion)} |`,
      ),
      "",
    );

    const liquidacion = LIQUIDACION.flatMap(([titulo, hecho]) => {
      const valor = resultado.hechos[hecho];
      return typeof valor === "number"
        ? [`${titulo}: ${formatearMoneda(valor)}`]
        : [];
    });
    if (liquidacion.length > 0) {
      lineas.push(`**Liquidación estimada:** ${liquidacion.join(" · ")}`, "");
    }
    for (const [titulo, textos] of [
      ["Conclusiones", resultado.conclusiones],
      ["Recomendaciones", resultado.recomendaciones],
      ["Alertas", resultado.alertas],
    ] as const) {
      if (textos.length > 0) {
        lineas.push(`**${titulo}:**`, ...textos.map((t) => `- ${t}`), "");
      }
    }
  }
  return lineas.join("\n");
}
