// NEXT_PUBLIC_PHONE se guarda sin indicativo (ej. "3128769624") porque es
// el formato en que el cliente entrega el número. Estas dos funciones
// centralizan el prefijo +57 para que el número se marque y se lea igual
// en toda la aplicación (Footer, documentos legales, JSON-LD) en vez de
// repetir la concatenación del indicativo en cada lugar que lo necesita.
const COLOMBIA_COUNTRY_CODE = "57";

function digitsOf(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Formato internacional, sin espacios: para enlaces `tel:` y schema.org. */
export function toInternationalPhone(phone: string): string {
  return `+${COLOMBIA_COUNTRY_CODE}${digitsOf(phone)}`;
}

/** Formato legible en pantalla, agrupado 3-3-4: "+57 312 876 9624". */
export function formatPhoneForDisplay(phone: string): string {
  const digits = digitsOf(phone);
  const groups = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6),
  ].filter(Boolean);

  return `+${COLOMBIA_COUNTRY_CODE} ${groups.join(" ")}`;
}
