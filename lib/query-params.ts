/**
 * Serializa un objeto plano a URLSearchParams, omitiendo valores
 * undefined/vacíos y, opcionalmente, claves específicas (ej. page/limit
 * al construir un link de exportación que debe ignorar la paginación).
 */
export function buildSearchParams<T extends object>(
  values: T,
  omitKeys: (keyof T)[] = [],
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values) as [keyof T, unknown][]) {
    if (value === undefined || value === "" || omitKeys.includes(key)) continue;
    params.set(String(key), String(value));
  }
  return params;
}
