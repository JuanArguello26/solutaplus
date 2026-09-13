import { ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { StepCard } from "@/components/shared/StepCard";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/FadeIn";
import { Mascot } from "@/components/shared/Mascot";
import { STEPS } from "@/constants/steps";

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-14 md:py-20">
      <Container>
        <SectionHeading
          eyebrow="Proceso"
          title="Tu afiliación en 4 pasos simples"
        />
        <FadeInStagger className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <FadeInStaggerItem key={step.number} className="relative h-full">
              <StepCard {...step} />
              {/* Flecha conectora entre pasos: refuerza que es una
                  secuencia, no 4 tarjetas sueltas. Solo en desktop, donde
                  quedan en una sola fila; centrada en el gap entre
                  tarjetas para no depender de medir la posición de otras
                  tarjetas. */}
              {index < STEPS.length - 1 && (
                <div
                  className="absolute top-[33px] -right-4 z-10 hidden lg:flex"
                  aria-hidden="true"
                >
                  <ChevronRight className="h-6 w-6 text-gray-300" />
                </div>
              )}
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
