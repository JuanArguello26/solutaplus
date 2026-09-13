// FUENTE ÚNICA del catálogo de servicios.
//
// La landing renderiza directamente desde aquí (Server Component estático,
// así la página no depende de que la base de datos esté disponible) y
// `prisma/seed.ts` IMPORTA esta misma lista para poblar la tabla Service
// que consume el cotizador. Por eso no pueden divergir: para añadir o
// renombrar un servicio se edita este archivo y se corre `npm run prisma:seed`.
//
// `benefits` es solo para las tarjetas de la landing: el modelo Service de
// Prisma no tiene ese campo (los beneficios versionados viven en Plan).

export interface ServiceContent {
  slug: string;
  name: string;
  icon: string;
  description: string;
  benefits: string[];
}

export const SERVICES: ServiceContent[] = [
  {
    slug: "salud",
    name: "Salud",
    icon: "HeartPulse",
    description: "Afiliación y planes de salud para ti y tu familia.",
    benefits: [
      "Atención personalizada",
      "Cobertura nacional",
      "Asesor dedicado",
    ],
  },
  {
    slug: "pension",
    name: "Pensión",
    icon: "PiggyBank",
    description: "Afiliación y gestión de tu fondo de pensión.",
    benefits: ["Asesoría en traslado de fondo", "Acompañamiento permanente"],
  },
  {
    slug: "arl",
    name: "ARL",
    icon: "ShieldCheck",
    description:
      "Afiliación a riesgos laborales para independientes y empresas.",
    benefits: ["Cobertura nacional", "Atención personalizada"],
  },
  {
    slug: "seguridad-social-integral",
    name: "Seguridad Social Integral",
    icon: "Users",
    description: "Salud, Pensión y ARL gestionados en un solo trámite.",
    benefits: ["Gestión centralizada", "Un solo asesor para todo"],
  },
];
