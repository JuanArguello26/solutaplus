import { publicEnv } from "@/lib/public-env";
import { WHATSAPP_GENERIC_MESSAGE } from "@/constants/messages";
import { formatCurrency } from "@/lib/currency";

export function buildWhatsAppLink(
  phoneNumber: string,
  message: string,
): string {
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

export function getGenericWhatsAppLink(): string {
  return buildWhatsAppLink(
    publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
    WHATSAPP_GENERIC_MESSAGE,
  );
}

interface LeadWhatsAppMessageInput {
  fullName: string;
  serviceName: string;
  planName?: string;
  estimatedPrice?: number;
  currency?: string;
  city: string;
  phone: string;
}

export function buildLeadWhatsAppMessage(
  input: LeadWhatsAppMessageInput,
): string {
  const lines = [
    "Hola.",
    `Mi nombre es ${input.fullName}.`,
    `Estoy interesado en el servicio de ${input.serviceName}.`,
  ];

  if (input.planName) {
    lines.push(`Plan: ${input.planName}.`);
  }

  // Solo se incluye el valor si las tarifas del catálogo están confirmadas
  // (ver NEXT_PUBLIC_PRICES_CONFIRMED). El lead sí guarda el precio en base
  // de datos para el asesor; lo que se evita es afirmárselo al usuario.
  if (input.estimatedPrice != null && publicEnv.NEXT_PUBLIC_PRICES_CONFIRMED) {
    lines.push(
      `Valor aproximado: ${formatCurrency(input.estimatedPrice, input.currency ?? "COP")}.`,
    );
  }

  lines.push(`Ciudad: ${input.city}.`);
  lines.push(`Mi teléfono es: ${input.phone}.`);
  lines.push("Quedo atento para recibir asesoría.");
  lines.push("Muchas gracias.");

  return lines.join("\n");
}
