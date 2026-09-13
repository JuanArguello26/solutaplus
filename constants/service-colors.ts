interface ServiceColorScheme {
  cardBg: string;
  iconBg: string;
  iconText: string;
  accentBorder: string;
}

// Un acento por servicio para que las 4 tarjetas se distingan entre sí
// en vez de verse todas iguales en blanco — reutiliza los tokens de
// marca (primary/secondary) más dos acentos nuevos (amber/violet), no
// colores sueltos sin relación con la paleta.
const SERVICE_COLOR_SCHEMES: Record<string, ServiceColorScheme> = {
  salud: {
    cardBg: "bg-primary-light",
    iconBg: "bg-white",
    iconText: "text-primary",
    accentBorder: "border-t-primary",
  },
  pension: {
    cardBg: "bg-accent-amber-light",
    iconBg: "bg-white",
    iconText: "text-accent-amber",
    accentBorder: "border-t-accent-amber",
  },
  arl: {
    cardBg: "bg-accent-violet-light",
    iconBg: "bg-white",
    iconText: "text-accent-violet",
    accentBorder: "border-t-accent-violet",
  },
  "seguridad-social-integral": {
    cardBg: "bg-secondary-light",
    iconBg: "bg-white",
    iconText: "text-secondary",
    accentBorder: "border-t-secondary",
  },
};

const DEFAULT_SCHEME: ServiceColorScheme = SERVICE_COLOR_SCHEMES.salud;

export function getServiceColorScheme(slug: string): ServiceColorScheme {
  return SERVICE_COLOR_SCHEMES[slug] ?? DEFAULT_SCHEME;
}
