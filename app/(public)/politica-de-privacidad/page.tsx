import type { Metadata } from "next";
import { LegalDocument } from "@/components/shared/LegalDocument";
import { buildPrivacyPolicy, LEGAL_DOCUMENTS } from "@/lib/legal";

const DOC = LEGAL_DOCUMENTS[0];

export const metadata: Metadata = {
  title: DOC.shortTitle,
  description: DOC.description,
  alternates: { canonical: DOC.slug },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      slug={DOC.slug}
      title={DOC.title}
      intro={DOC.description}
      sections={buildPrivacyPolicy()}
    />
  );
}
