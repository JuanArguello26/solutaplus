import { Hero } from "@/features/landing/components/Hero";
import { Benefits } from "@/features/landing/components/Benefits";
import { Services } from "@/features/landing/components/Services";
import { Plans } from "@/features/landing/components/Plans";
import { HowItWorks } from "@/features/landing/components/HowItWorks";
import { Quotation } from "@/features/landing/components/Quotation";
import { Testimonials } from "@/features/landing/components/Testimonials";
import { Location } from "@/features/landing/components/Location";
import { FAQSection } from "@/features/landing/components/FAQSection";
import { buildLocalBusinessJsonLd } from "@/lib/json-ld";

// Sin metadata propio: el home usa el `default` del layout raíz. Definir
// aquí el mismo título completo duplicaba el sufijo, porque el layout
// raíz ya le aplica su `template` ("%s | <nombre de marca>") a cualquier
// título que un hijo declare explícitamente.
export default function HomePage() {
  const jsonLd = buildLocalBusinessJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <Benefits />
      <Services />
      <Plans />
      <HowItWorks />
      <Quotation />
      <Testimonials />
      <Location />
      <FAQSection />
    </>
  );
}
