const DEFAULT_ERROR_MESSAGE =
  "No pudimos procesar tu solicitud. Intenta nuevamente en unos segundos.";

/**
 * Cliente-side mirror del contrato de lib/api-response.ts: hace fetch,
 * parsea el JSON y lanza un Error con el mensaje del servidor cuando
 * success es false, o devuelve `data` cuando success es true.
 */
export async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message ?? DEFAULT_ERROR_MESSAGE);
  }

  return json.data as T;
}

export function apiPost<T>(url: string, body: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
