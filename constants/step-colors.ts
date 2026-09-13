interface StepColorScheme {
  cardBg: string;
  badgeBg: string;
  badgeText: string;
  iconText: string;
}

// Misma paleta de 4 acentos que ya usan las tarjetas de servicio
// (primary/amber/violet/secondary) — se reutiliza en vez de inventar
// colores nuevos, para que el lenguaje visual de la página sea uno solo.
const STEP_COLOR_SCHEMES: Record<number, StepColorScheme> = {
  1: {
    cardBg: "bg-primary-light",
    badgeBg: "bg-primary",
    badgeText: "text-primary-foreground",
    iconText: "text-primary",
  },
  2: {
    cardBg: "bg-accent-amber-light",
    badgeBg: "bg-accent-amber",
    badgeText: "text-accent-amber-foreground",
    iconText: "text-accent-amber",
  },
  3: {
    cardBg: "bg-accent-violet-light",
    badgeBg: "bg-accent-violet",
    badgeText: "text-accent-violet-foreground",
    iconText: "text-accent-violet",
  },
  4: {
    cardBg: "bg-secondary-light",
    badgeBg: "bg-secondary",
    badgeText: "text-secondary-foreground",
    iconText: "text-secondary",
  },
};

const DEFAULT_SCHEME: StepColorScheme = STEP_COLOR_SCHEMES[1];

export function getStepColorScheme(number: number): StepColorScheme {
  return STEP_COLOR_SCHEMES[number] ?? DEFAULT_SCHEME;
}
