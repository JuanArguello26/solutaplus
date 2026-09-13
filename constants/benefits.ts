export interface BenefitContent {
  icon: string;
  title: string;
  description: string;
}

export const BENEFITS: BenefitContent[] = [
  {
    icon: "UserCheck",
    title: "Atención humana y sin enredos",
    description:
      "No eres un número más. Te asignamos un asesor dedicado que te guiará paso a paso en tu afiliación a seguridad social, resolviendo todas tus dudas por WhatsApp.",
  },
  {
    icon: "Zap",
    title: "Trámites rápidos y sin filas",
    description:
      "Sabemos que tu tiempo vale dinero. Gestiona el pago de tu EPS y pensión desde tu celular en minutos, sin papeleos interminables ni salir de casa.",
  },
  {
    icon: "BadgeCheck",
    title: "Asesoría 100% legal y segura",
    description:
      "Evita dolores de cabeza y multas. Te asesoramos para que tus aportes cumplan con toda la normativa vigente en Colombia, blindando tu tranquilidad.",
  },
  {
    icon: "MapPin",
    title: "Desde Pereira para toda Colombia",
    description:
      "Visítanos en nuestra oficina física en el Eje Cafetero para mayor confianza, o gestiona tu afiliación a EPS, ARL y pensión desde cualquier ciudad del país.",
  },
];
