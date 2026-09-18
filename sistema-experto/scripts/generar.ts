// Genera los entregables del sistema experto:
// - sistema-experto/salida/SolutaPLUS_BaseDatos.xlsx (una pestaña por tabla,
//   listo para subir a Google Drive y abrir con Google Sheets). Incluye las
//   evaluaciones reales del motor para los casos de demostración y, si
//   existe `sistema-experto/usuarios.local.json`, las cuentas reales del
//   equipo (por eso el .xlsx no se versiona);
// - sistema-experto/salida/motor-n8n.js (el motor para el nodo Code de n8n);
// - docs/proyecto-final/modelo-datos.md, catalogo-reglas.md y
//   evaluaciones-demo.md (sin datos personales).
//
// Uso (desde la raíz del proyecto): npm run sistema-experto:generar
// No escribe nada si la validación de integridad encuentra errores.

import "dotenv/config";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import {
  TABLAS,
  type BaseDatos,
  type Columna,
  type TipoColumna,
} from "@/sistema-experto/base-conocimiento/esquema";
import { REGLAS } from "@/sistema-experto/base-conocimiento/reglas";
import { SEMILLA } from "@/sistema-experto/base-conocimiento/semilla";
import { validarBaseDatos } from "@/sistema-experto/base-conocimiento/validacion";
import {
  generarCatalogoReglasMd,
  generarEvaluacionesDemoMd,
  generarModeloDatosMd,
} from "./documentacion";
import { compilarMotorParaN8n } from "./motor-n8n";
import { conEvaluacionesDemo, conUsuariosLocales } from "./preparar-datos";

const RAIZ = process.cwd();
const CARPETA_SALIDA = path.join(RAIZ, "sistema-experto", "salida");
const CARPETA_DOCS = path.join(RAIZ, "docs", "proyecto-final");
const RUTA_USUARIOS = path.join(RAIZ, "sistema-experto", "usuarios.local.json");

const FORMATO_NUMERICO: Partial<Record<TipoColumna, string>> = {
  Price: "#,##0",
  Date: "yyyy-mm-dd",
  DateTime: "yyyy-mm-dd hh:mm",
};

function ancho(columna: Columna): number {
  const minimo = columna.tipo === "LongText" ? 40 : 14;
  return Math.min(Math.max(columna.nombre.length + 2, minimo), 60);
}

async function escribirXlsx(ruta: string, datos: BaseDatos): Promise<void> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "SolutaPLUS";

  for (const tabla of TABLAS) {
    const hoja = libro.addWorksheet(tabla.nombre, {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    hoja.columns = tabla.columnas.map((columna) => ({
      header: columna.nombre,
      key: columna.nombre,
      width: ancho(columna),
    }));

    const encabezado = hoja.getRow(1);
    encabezado.font = { bold: true, color: { argb: "FFFFFFFF" } };
    tabla.columnas.forEach((columna, i) => {
      const cabecera = encabezado.getCell(i + 1);
      cabecera.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F4E79" },
      };
      const detalle = columna.ref ? ` → ${columna.ref}` : "";
      cabecera.note = `${columna.tipo}${detalle}${columna.clave ? " (clave)" : ""}: ${columna.descripcion}`;
    });

    for (const fila of datos[tabla.nombre]) {
      hoja.addRow(
        Object.fromEntries(
          tabla.columnas.map((c) => [c.nombre, fila[c.nombre] ?? null]),
        ),
      );
    }

    tabla.columnas.forEach((columna, i) => {
      const formato = FORMATO_NUMERICO[columna.tipo];
      if (!formato) return;
      hoja
        .getColumn(i + 1)
        .eachCell({ includeEmpty: false }, (cell, numeroFila) => {
          if (numeroFila > 1) cell.numFmt = formato;
        });
    });
  }

  await libro.xlsx.writeFile(ruta);
}

function reportarErrores(titulo: string, errores: string[]): boolean {
  if (errores.length === 0) return false;
  console.error(`${titulo} tiene ${errores.length} error(es):`);
  for (const error of errores) console.error(`  - ${error}`);
  process.exitCode = 1;
  return true;
}

async function main(): Promise<void> {
  if (reportarErrores("La semilla", validarBaseDatos(SEMILLA))) return;

  const datosDemo = conEvaluacionesDemo(SEMILLA);
  const usaUsuariosLocales = existsSync(RUTA_USUARIOS);
  const datos = usaUsuariosLocales
    ? conUsuariosLocales(
        datosDemo,
        JSON.parse(await readFile(RUTA_USUARIOS, "utf8")),
        new Date(),
      )
    : datosDemo;
  if (reportarErrores("La base de datos final", validarBaseDatos(datos))) {
    return;
  }

  // Se genera todo en memoria primero: si algo falla, no queda nada a medias.
  const archivos: [string, string][] = [
    [path.join(CARPETA_SALIDA, "motor-n8n.js"), compilarMotorParaN8n(RAIZ)],
    [
      path.join(CARPETA_DOCS, "modelo-datos.md"),
      generarModeloDatosMd(datosDemo),
    ],
    [path.join(CARPETA_DOCS, "catalogo-reglas.md"), generarCatalogoReglasMd()],
    [
      path.join(CARPETA_DOCS, "evaluaciones-demo.md"),
      generarEvaluacionesDemoMd(),
    ],
  ];

  await mkdir(CARPETA_SALIDA, { recursive: true });
  await mkdir(CARPETA_DOCS, { recursive: true });
  const rutaXlsx = path.join(CARPETA_SALIDA, "SolutaPLUS_BaseDatos.xlsx");
  await escribirXlsx(rutaXlsx, datos);
  for (const [ruta, contenido] of archivos) await writeFile(ruta, contenido);

  const filas = TABLAS.reduce(
    (total, tabla) => total + datos[tabla.nombre].length,
    0,
  );
  console.log(
    `✔ ${path.relative(RAIZ, rutaXlsx)} — ${TABLAS.length} tablas, ${filas} filas, ${REGLAS.length} reglas, ${datos.Evaluaciones.length} evaluaciones`,
  );
  console.log(
    usaUsuariosLocales
      ? `  Usuarios: ${datos.Usuarios.length} cuentas de ${path.relative(RAIZ, RUTA_USUARIOS)}`
      : "  Usuarios: de ejemplo (crea sistema-experto/usuarios.local.json con las cuentas reales)",
  );
  for (const [ruta] of archivos) console.log(`✔ ${path.relative(RAIZ, ruta)}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
