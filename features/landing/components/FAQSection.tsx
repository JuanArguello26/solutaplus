import { Container } from "@/components/ui/Container";
import { FAQItem } from "@/components/shared/FAQItem";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { FAQ } from "@/constants/faq";

export function FAQSection() {
  return (
    <section id="faq" className="bg-gray-50 py-16 md:py-24">
      <Container className="max-w-3xl">
        <SectionHeading eyebrow="Ayuda" title="Preguntas frecuentes" />
        <div className="mt-10 rounded-2xl border border-gray-200 bg-white px-6 shadow-sm">
          {FAQ.map((item) => (
            <FAQItem key={item.question} {...item} />
          ))}
        </div>
      </Container>
    </section>
  );
}
