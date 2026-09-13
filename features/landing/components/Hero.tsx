import Image from "next/image";
import { Calculator, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { TypewriterText } from "@/components/shared/TypewriterText";
import { getGenericWhatsAppLink } from "@/lib/whatsapp";

const HERO_TITLE = "Protege lo que más importa";

export function Hero() {
  const whatsappLink = getGenericWhatsAppLink();

  return (
    <section id="inicio" className="relative bg-primary-light">
      <Container className="hero-grid pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="hero-grid__text text-center md:text-left">
          <h1
            aria-label={HERO_TITLE}
            className="animate-fade-in-up min-h-[2lh] text-4xl font-bold tracking-tight text-balance text-gray-900 sm:text-5xl md:text-6xl"
          >
            <TypewriterText text={HERO_TITLE} />
          </h1>
          <p className="animate-fade-in-up mt-6 text-lg text-balance text-gray-600">
            Soluciones integrales en Salud, Pensión y ARL para ti, tu familia
            y tu empresa.
          </p>

          <div
            className="animate-fade-in-up mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start"
            style={{ animationDelay: "120ms" }}
          >
            <Button href="#cotizador" variant="primary">
              <Calculator className="h-4 w-4" aria-hidden="true" />
              Cotiza ahora
            </Button>
            <Button href={whatsappLink} variant="outline">
              <WhatsAppIcon className="h-4 w-4" />
              Hablar con un asesor
            </Button>
          </div>
        </div>

        {/* Imagen decorativa: refuerza el tono (familia, confianza,
            ambiente profesional de salud) pero no aporta información que
            no esté ya en el texto real de esta sección — por eso alt="" y
            aria-hidden, para que lectores de pantalla la salten en vez de
            describir una foto de stock sin valor informativo propio. */}
        <div
          className="hero-grid__image relative z-10 aspect-[4/5] w-full max-w-md justify-self-center overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 md:aspect-auto md:h-full md:max-h-[560px] md:min-h-[420px] md:max-w-none md:justify-self-end lg:-mb-10"
          aria-hidden="true"
        >
          <Image
            src="/images/hero-family.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 45vw, 90vw"
            className="object-cover object-center"
          />
        </div>

        <p
          className="hero-grid__support animate-fade-in-up flex items-center justify-center gap-2 text-sm text-gray-600 md:justify-start"
          style={{ animationDelay: "200ms" }}
        >
          <ShieldCheck
            className="h-4 w-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          Asesoría gratuita y sin compromiso
        </p>
      </Container>

      {/* Separador curvo hacia la siguiente sección: evita el corte
          visual brusco entre el azul del Hero y el blanco de Beneficios,
          sin agregar contenido ni animación (puro SVG/CSS). z-0 para que
          la imagen (z-10) quede por encima donde se solapan. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 overflow-hidden leading-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="h-10 w-full text-white md:h-16 lg:h-20"
        >
          <path
            d="M0,80 C360,20 1080,20 1440,80 L1440,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </section>
  );
}
