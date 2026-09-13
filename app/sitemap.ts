import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/public-env";
import { LEGAL_DOCUMENTS } from "@/lib/legal";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = publicEnv.NEXT_PUBLIC_SITE_URL;
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    // Derivado de LEGAL_DOCUMENTS para que agregar un documento legal no
    // exija acordarse de actualizar el sitemap por separado.
    ...LEGAL_DOCUMENTS.map((doc) => ({
      url: `${baseUrl}${doc.slug}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
