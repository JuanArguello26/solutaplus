import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { publicEnv } from "@/lib/public-env";
import { SERVICES } from "@/constants/services";
import { BUSINESS_HOURS, LEGAL_DOCUMENTS } from "@/lib/legal";
import { formatPhoneForDisplay, toInternationalPhone } from "@/lib/phone";

export function Footer() {
  const year = new Date().getFullYear();
  const company = publicEnv.NEXT_PUBLIC_COMPANY_NAME;

  return (
    <footer id="contacto" className="border-t border-gray-200 bg-gray-50">
      <Container className="grid gap-10 py-12 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-gray-900">{company}</p>
          <p className="mt-2 text-sm text-gray-600">
            Afiliación a Salud, Pensión, ARL y Seguridad Social en Colombia.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">Servicios</p>
          <ul className="mt-3 flex flex-col gap-2">
            {SERVICES.map((service) => (
              <li key={service.slug}>
                <a
                  href="#servicios"
                  className="hover:text-primary text-sm text-gray-600"
                >
                  {service.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">Contacto</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
            {publicEnv.NEXT_PUBLIC_PHONE && (
              <li>
                <a
                  href={`tel:${toInternationalPhone(publicEnv.NEXT_PUBLIC_PHONE)}`}
                  className="hover:text-primary"
                >
                  {formatPhoneForDisplay(publicEnv.NEXT_PUBLIC_PHONE)}
                </a>
              </li>
            )}
            {publicEnv.NEXT_PUBLIC_EMAIL && (
              <li>
                <a
                  href={`mailto:${publicEnv.NEXT_PUBLIC_EMAIL}`}
                  className="hover:text-primary"
                >
                  {publicEnv.NEXT_PUBLIC_EMAIL}
                </a>
              </li>
            )}
            {publicEnv.NEXT_PUBLIC_ADDRESS && (
              <li>
                {publicEnv.NEXT_PUBLIC_MAPS_URL ? (
                  <a
                    href={publicEnv.NEXT_PUBLIC_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary"
                  >
                    {publicEnv.NEXT_PUBLIC_ADDRESS}
                  </a>
                ) : (
                  publicEnv.NEXT_PUBLIC_ADDRESS
                )}
              </li>
            )}
            <li>{BUSINESS_HOURS}</li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">Legal</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-gray-600">
            {LEGAL_DOCUMENTS.map((doc) => (
              <li key={doc.slug}>
                <Link href={doc.slug} className="hover:text-primary">
                  {doc.shortTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* Aviso legal: los valores del cotizador son orientativos, no una
          oferta contractual. Va en el footer para que acompañe a todas las
          páginas, no solo al cotizador. */}
      <div className="border-t border-gray-200">
        <Container className="py-6">
          <p className="text-xs leading-relaxed text-gray-500">
            {company} es una plataforma de asesoría y acompañamiento en
            procesos relacionados con Salud, Pensión y ARL en Colombia. La
            información y los valores presentados en esta Landing Page tienen
            carácter informativo y orientativo: la afiliación, la cobertura y
            los valores finales estarán sujetos a validación por parte de un
            asesor y a las condiciones aplicables al servicio solicitado.
          </p>
        </Container>
      </div>

      <div className="border-t border-gray-200 py-6">
        <Container>
          <p className="text-center text-xs text-gray-500">
            © {year} {company}. Todos los derechos reservados.
          </p>
          {/* text-gray-500, no gray-400: a 11px el gris más claro daba
              2.49:1 de contraste y no pasaba WCAG AA (mínimo 4.5:1). */}
          <p className="mt-1 text-center text-[11px] text-gray-500">
            Developed by Juan Argüello
          </p>
        </Container>
      </div>
    </footer>
  );
}
