import { Container } from "@/components/ui/Container";
import { ServiceCard } from "@/components/shared/ServiceCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/FadeIn";
import { Mascot } from "@/components/shared/Mascot";
import { SERVICES } from "@/constants/services";

export function Services() {
  return (
    <section id="servicios" className="relative bg-gray-50 py-16 md:py-24">
      <Container>
        <SectionHeading
          eyebrow="Servicios"
          title="Nuestros servicios"
          description="Elige el servicio que necesitas y cotiza en minutos."
        />
        <FadeInStagger className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <FadeInStaggerItem key={service.slug} className="h-full">
              <ServiceCard service={service} />
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </Container>
      <Mascot
        size={128}
        className="absolute top-14 right-4 z-10 hidden lg:block xl:top-16 xl:right-10"
      />
    </section>
  );
}
