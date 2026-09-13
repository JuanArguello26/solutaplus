import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import {
  LEGAL_DOCUMENTS,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_VERSION,
  type LegalBlock,
  type LegalSection,
} from "@/lib/legal";

interface LegalDocumentProps {
  /** Slug del documento actual, para excluirlo de los enlaces cruzados. */
  slug: string;
  title: string;
  intro?: string;
  sections: LegalSection[];
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case "subheading":
      return (
        <h3 className="mt-2 text-base font-semibold text-gray-900">
          {block.content}
        </h3>
      );

    case "list":
      return (
        <ul className="flex flex-col gap-2">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-gray-700">
              <Check
                className="text-secondary mt-1 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    // Bloque destacado para condiciones que el usuario no debería pasar por
    // alto (ej. que la cotización no es una oferta contractual).
    case "note":
      return (
        <p className="bg-primary-light border-primary rounded-r-lg border-l-4 px-4 py-3 text-gray-800">
          {block.content}
        </p>
      );

    default:
      return <p className="text-gray-700">{block.content}</p>;
  }
}

export function LegalDocument({
  slug,
  title,
  intro,
  sections,
}: LegalDocumentProps) {
  const otherDocuments = LEGAL_DOCUMENTS.filter((doc) => doc.slug !== slug);

  return (
    <Container className="max-w-3xl py-12 md:py-16">
      <Link
        href="/"
        className="hover:text-primary inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver al inicio
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-balance text-gray-900 sm:text-4xl">
        {title}
      </h1>

      <p className="mt-3 text-sm text-gray-500">
        Versión {LEGAL_VERSION} · Vigente desde el {LEGAL_EFFECTIVE_DATE}
      </p>

      {intro && <p className="mt-4 text-lg text-gray-600">{intro}</p>}

      <div className="mt-10 flex flex-col gap-10">
        {sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-gray-900">
              {section.heading}
            </h2>
            {section.blocks.map((block, index) => (
              <Block key={`${section.heading}-${index}`} block={block} />
            ))}
          </section>
        ))}
      </div>

      <nav
        aria-label="Otros documentos legales"
        className="mt-14 border-t border-gray-200 pt-8"
      >
        <p className="text-sm font-semibold text-gray-900">
          Otros documentos legales
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {otherDocuments.map((doc) => (
            <li key={doc.slug}>
              <Link
                href={doc.slug}
                className="hover:border-primary group block rounded-xl border border-gray-200 p-4 transition-colors"
              >
                <span className="group-hover:text-primary font-medium text-gray-900 transition-colors">
                  {doc.shortTitle}
                </span>
                <span className="mt-1 block text-sm text-gray-600">
                  {doc.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
