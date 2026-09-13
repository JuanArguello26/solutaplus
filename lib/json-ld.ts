import { publicEnv } from "@/lib/public-env";
import { toInternationalPhone } from "@/lib/phone";

/**
 * Datos estructurados schema.org para que Google entienda que la landing
 * representa un negocio local de servicios (no un artículo/producto).
 * La dirección se completa desde NEXT_PUBLIC_ADDRESS/NEXT_PUBLIC_ADDRESS_CITY
 * cuando están configuradas; si no lo están, solo se declara el país para
 * no inventar un dato falso.
 */
export function buildLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: publicEnv.NEXT_PUBLIC_COMPANY_NAME,
    description:
      "Afiliación a seguridad social en Pereira y toda Colombia: EPS, pensión, ARL y planilla PILA.",
    url: publicEnv.NEXT_PUBLIC_SITE_URL,
    telephone: publicEnv.NEXT_PUBLIC_PHONE
      ? toInternationalPhone(publicEnv.NEXT_PUBLIC_PHONE)
      : undefined,
    email: publicEnv.NEXT_PUBLIC_EMAIL,
    areaServed: "CO",
    address: {
      "@type": "PostalAddress",
      ...(publicEnv.NEXT_PUBLIC_ADDRESS
        ? { streetAddress: publicEnv.NEXT_PUBLIC_ADDRESS }
        : {}),
      ...(publicEnv.NEXT_PUBLIC_ADDRESS_CITY
        ? { addressLocality: publicEnv.NEXT_PUBLIC_ADDRESS_CITY }
        : {}),
      addressCountry: "CO",
    },
  };
}
