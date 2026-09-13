import { MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FadeIn } from "@/components/shared/FadeIn";
import { publicEnv } from "@/lib/public-env";
import { getGenericWhatsAppLink } from "@/lib/whatsapp";

export function Location() {
  if (!publicEnv.NEXT_PUBLIC_ADDRESS || !publicEnv.NEXT_PUBLIC_MAPS_EMBED_URL) {
    return null;
  }

  return (
    <section
      id="ubicacion"
      className="relative overflow-hidden py-16 md:py-24"
    >
      {/* Fondo con profundidad: manchas de color muy suaves, estáticas
          (no animadas) — evita que la sección se vea plana sin depender
          de movimiento. */}
      <div
        className="bg-primary/10 pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="bg-secondary/10 pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full blur-3xl"
        aria-hidden="true"
      />

      <Container className="relative z-10 max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="mx-auto w-full max-w-xl lg:mx-0">
            <SectionHeading
              eyebrow="Ubicación"
              title="Visítanos"
              description="Conoce nuestra oficina y resuelve tus dudas en persona, o escríbenos por WhatsApp si prefieres una atención inmediata."
              className="lg:mx-0 lg:max-w-none lg:text-left"
            />
            <FadeIn className="mt-8 flex flex-col gap-6">
              <p className="flex items-start gap-2 text-base text-gray-700">
                <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                  <span
                    className="bg-primary/50 motion-reduce:hidden absolute inline-flex h-full w-full animate-ping rounded-full [animation-duration:2s]"
                    aria-hidden="true"
                  />
                  <MapPin
                    className="text-primary relative h-5 w-5"
                    aria-hidden="true"
                  />
                </span>
                <span>{publicEnv.NEXT_PUBLIC_ADDRESS}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <Button href={getGenericWhatsAppLink()} variant="primary">
                  Escríbenos por WhatsApp
                </Button>
                {publicEnv.NEXT_PUBLIC_MAPS_URL && (
                  <Button href={publicEnv.NEXT_PUBLIC_MAPS_URL} variant="outline">
                    Cómo llegar
                  </Button>
                )}
              </div>
            </FadeIn>
          </div>

          <FadeIn className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 lg:aspect-auto lg:h-full lg:min-h-[420px]">
              <iframe
                src={publicEnv.NEXT_PUBLIC_MAPS_EMBED_URL}
                title={`Mapa de ubicación de ${publicEnv.NEXT_PUBLIC_COMPANY_NAME}`}
                loading="lazy"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
