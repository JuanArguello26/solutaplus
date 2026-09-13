import { Container } from "@/components/ui/Container";
import { PriceCard } from "@/components/shared/PriceCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/FadeIn";
import { PRICING_PLANS } from "@/constants/pricing-plans";

export function Plans() {
  return (
    <section id="planes" className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Planes"
          title="Elige el plan que se ajusta a ti"
          description="Agrupamos los servicios que más se piden en 3 planes simples, con asesoría incluida."
        />
        <FadeInStagger className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <FadeInStaggerItem key={plan.slug} className="h-full">
              <PriceCard {...plan} />
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </Container>
    </section>
  );
}
