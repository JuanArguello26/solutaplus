import { Container } from "@/components/ui/Container";
import { BenefitCard } from "@/components/shared/BenefitCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/FadeIn";
import { BENEFITS } from "@/constants/benefits";
import { publicEnv } from "@/lib/public-env";

export function Benefits() {
  return (
    <section id="beneficios" className="pt-8 pb-16 md:pt-12 md:pb-24">
      <Container>
        <SectionHeading
          eyebrow="Beneficios"
          title={`¿Por qué elegir a ${publicEnv.NEXT_PUBLIC_COMPANY_NAME}?`}
        />
        {/* Las 4 tarjetas se agrupan en un solo bloque con separadores
            finos (truco gap-px + fondo gris de fondo) en vez de flotar
            sueltas con mucho aire entre ellas y el título. */}
        <FadeInStagger className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit) => (
            <FadeInStaggerItem key={benefit.title} className="bg-white">
              <BenefitCard {...benefit} />
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </Container>
    </section>
  );
}
