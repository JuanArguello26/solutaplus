import type {
  BaseDatos,
  Fila,
  NombreTabla,
} from "@/sistema-experto/base-conocimiento/esquema";
import { SEMILLA } from "@/sistema-experto/base-conocimiento/semilla";

/** Copia de la semilla con una fila modificada (o agregada si no existe). */
export function conCambio(
  tabla: NombreTabla,
  buscar: (fila: Fila) => boolean,
  cambios: Fila,
): BaseDatos {
  const filas = SEMILLA[tabla];
  const indice = filas.findIndex(buscar);
  const nuevas =
    indice === -1
      ? [...filas, cambios]
      : filas.map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila));
  return { ...SEMILLA, [tabla]: nuevas };
}
