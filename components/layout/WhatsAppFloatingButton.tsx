import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { getGenericWhatsAppLink } from "@/lib/whatsapp";

export function WhatsAppFloatingButton() {
  const href = getGenericWhatsAppLink();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-secondary hover:bg-secondary-hover focus-visible:ring-secondary fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label="Hablar por WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
}
