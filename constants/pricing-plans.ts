import { publicEnv } from "@/lib/public-env";

const company = publicEnv.NEXT_PUBLIC_COMPANY_NAME;

export interface PricingPlanContent {
  slug: string;
  name: string;
  badge?: string;
  idealFor: string;
  includes: string[];
  priceNote: string;
  extra?: string;
  whatsappMessage: string;
  featured?: boolean;
}

export const PRICING_PLANS: PricingPlanContent[] = [
  {
    slug: "basico",
    name: "Plan Básico",
    badge: "El plan más vendido y recomendado",
    idealFor: "Independientes, auxiliares, secretariado, tenderos.",
    includes: ["Afiliación a EPS", "Afiliación a ARL (Riesgo 1)"],
    priceNote: "Costo de ley + tarifa administrativa mensual",
    extra: "Asesoría prioritaria por WhatsApp",
    whatsappMessage: `Hola, quiero más información sobre el Plan Básico (Salud + ARL) de ${company}.`,
    featured: true,
  },
  {
    slug: "integral",
    name: "Plan Integral",
    idealFor:
      "Independientes que piensan en su futuro, familias y trabajadores que quieren todos los beneficios.",
    includes: [
      "Afiliación a EPS",
      "Afiliación a Pensión",
      "Afiliación a ARL (Riesgo 1, 3, 4 o 5)",
    ],
    priceNote: "Costo de ley + tarifa administrativa mensual",
    extra: "Asesoría prioritaria por WhatsApp",
    whatsappMessage: `Hola, quiero más información sobre el Plan Integral (Salud + Pensión + ARL) de ${company}.`,
  },
  {
    slug: "empresarial",
    name: "Plan Empresarial",
    idealFor: "Pymes o negocios que necesitan afiliar a 5 o más empleados.",
    includes: [
      "Afiliación grupal a EPS, Pensión y ARL",
      "Gestión centralizada de tu equipo",
    ],
    priceNote: "Precio especial por volumen (cotización manual)",
    whatsappMessage: `Hola, quiero cotizar el Plan Empresarial de ${company} para afiliar a mi equipo.`,
  },
];
