"use client";

import { useState } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FadeIn } from "@/components/shared/FadeIn";
import { QuotationWidget } from "@/features/quotation/components/QuotationWidget";
import { QuotationResult } from "@/features/quotation/components/QuotationResult";
import type { QuotationResultDto } from "@/features/quotation/services/quotation-client";
import type { QuotationInput } from "@/server/validators/quotation.schema";
import { LeadForm } from "@/features/leads/components/LeadForm";

interface CalculatedQuotation {
  data: QuotationResultDto;
  context: QuotationInput;
}

export function Quotation() {
  const [calculated, setCalculated] = useState<CalculatedQuotation | null>(
    null,
  );

  return (
    <section id="cotizador" className="bg-primary-light py-16 md:py-24">
      <Container className="max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          {/* Encabezado + formulario: primero en el DOM para que en mobile
              (una sola columna) el formulario quede antes que la imagen. */}
          <div className="mx-auto w-full max-w-xl lg:order-2 lg:mx-0 lg:max-w-none">
            <SectionHeading
              eyebrow="Cotizador"
              title="Cotiza en minutos"
              description="Completa tus datos y descubre la opción que mejor se adapta a tus necesidades."
              className="lg:mx-0 lg:max-w-none lg:text-left"
            />
            <FadeIn className="mt-10">
              <Card className="shadow-lg">
                {calculated ? (
                  <div className="flex flex-col gap-6">
                    <QuotationResult
                      service={calculated.data.service.name}
                      plan={calculated.data.plan.name}
                      estimatedPrice={calculated.data.estimatedPrice}
                      currency={calculated.data.currency}
                      benefits={calculated.data.benefits}
                    />
                    <LeadForm
                      serviceSlug={calculated.context.serviceSlug}
                      planId={calculated.context.planId}
                      city={calculated.context.city}
                      onBack={() => setCalculated(null)}
                    />
                  </div>
                ) : (
                  <QuotationWidget
                    onCalculated={(data, context) =>
                      setCalculated({ data, context })
                    }
                  />
                )}
              </Card>
            </FadeIn>
          </div>

          {/* Imagen decorativa: refuerza la idea de asesoría cercana, pero
              no aporta información que no esté ya en el texto/formulario. */}
          <FadeIn className="mx-auto w-full max-w-md lg:order-1 lg:mx-0 lg:max-w-none">
            <div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 lg:aspect-auto lg:h-full lg:max-h-[560px] lg:min-h-[420px]"
              aria-hidden="true"
            >
              <Image
                src="/images/quotation-family.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 42vw, 90vw"
                className="object-cover object-center"
              />
            </div>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}
