import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloatingButton } from "@/components/layout/WhatsAppFloatingButton";
import { FAQFloatingButton } from "@/components/layout/FAQFloatingButton";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#main-content"
        className="focus:bg-primary sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:outline-none"
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
      <WhatsAppFloatingButton />
      <FAQFloatingButton />
    </>
  );
}
