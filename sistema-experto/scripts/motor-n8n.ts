// Empaqueta el motor (`motor/motor.ts`) como un script autónomo para el nodo
// Code de n8n. No hace falta bundler: el motor no importa nada en tiempo de
// ejecución, así que basta con quitarle los tipos (compilador de TypeScript)
// y envolverlo en una función que expone el global `SolutaPLUSMotor`.

import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

export const NOMBRE_GLOBAL_MOTOR = "SolutaPLUSMotor";
const RUTA_MOTOR = path.join("sistema-experto", "motor", "motor.ts");

export function compilarMotorParaN8n(raiz: string = process.cwd()): string {
  const fuente = readFileSync(path.join(raiz, RUTA_MOTOR), "utf8");
  const { outputText, diagnostics = [] } = ts.transpileModule(fuente, {
    reportDiagnostics: true,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });

  if (diagnostics.length > 0) {
    const detalle = diagnostics
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"))
      .join("; ");
    throw new Error(`El motor no compila: ${detalle}`);
  }
  if (/\brequire\(/.test(outputText)) {
    throw new Error(
      "El motor importa módulos en tiempo de ejecución y n8n no puede resolverlos.",
    );
  }

  return [
    "// Motor de inferencia SolutaPLUS para el nodo Code de n8n.",
    "// Generado por `npm run sistema-experto:generar` desde sistema-experto/motor/motor.ts. No editar a mano.",
    "//",
    `// Uso: ${NOMBRE_GLOBAL_MOTOR}.evaluarSolicitud(idSolicitud, tablas, { ahora: new Date() })`,
    `const ${NOMBRE_GLOBAL_MOTOR} = (function () {`,
    // "use strict" solo cuenta si es la primera sentencia de la función.
    '"use strict";',
    "const exports = {};",
    outputText.replace(/^"use strict";\r?\n/, "").trimEnd(),
    "return exports;",
    "})();",
    "",
  ].join("\n");
}
