import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/app/providers";
import { publicEnv } from "@/lib/public-env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const siteName = publicEnv.NEXT_PUBLIC_COMPANY_NAME;
const defaultTitle = `${siteName} | Afiliación a Seguridad Social en Pereira y Colombia`;
const description =
  "Afiliación a seguridad social en Pereira y toda Colombia: EPS, pensión, ARL y PILA. Cotiza en minutos y habla con un asesor por WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description,
  keywords: [
    // Locales (Pereira / Eje Cafetero)
    "afiliación a seguridad social en Pereira",
    "pago de EPS y pensión Pereira",
    "cotizar ARL independientes Pereira",
    "oficina de aportes seguridad social Eje Cafetero",
    // De intención
    "cotizador de seguridad social independientes",
    "cuánto vale afiliarse a EPS y ARL",
    "pagar planilla PILA rápido",
    "afiliar empleada doméstica a seguridad social",
    // Generales
    "afiliación a EPS",
    "pago de seguridad social independientes",
    "caja de compensación",
    "seguridad social integral",
    siteName,
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName,
    title: defaultTitle,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
