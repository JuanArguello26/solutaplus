import { Container } from "@/components/ui/Container";
import { TestimonialCard } from "@/components/shared/TestimonialCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/FadeIn";
import { TESTIMONIALS } from "@/constants/testimonials";

export function Testimonials() {
  // Sin testimonios reales no se muestra la sección, en vez de rellenarla
  // con ejemplos inventados (mismo criterio que Location.tsx).
  if (TESTIMONIALS.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Testimonios"
          title="Lo que dicen nuestros clientes"
        />
        <FadeInStagger className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <FadeInStaggerItem
              key={`${testimonial.name}-${testimonial.city}`}
              className="h-full"
            >
              <TestimonialCard {...testimonial} />
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </Container>
    </section>
  );
}
