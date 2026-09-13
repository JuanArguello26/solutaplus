import { publicEnv } from "@/lib/public-env";

export interface StepContent {
  number: number;
  icon: string;
  title: string;
  description: string;
}

export const STEPS: StepContent[] = [
  {
    number: 1,
    icon: "ListChecks",
    title: "Selecciona tu plan",
    description:
      "Elige si necesitas Seguridad Social Integral (Salud, Pensión, ARL) o solo un servicio específico.",
  },
  {
    number: 2,
    icon: "Calculator",
    title: "Usa nuestro cotizador",
    description:
      "Ingresa tus datos en la calculadora para descubrir al instante cuánto vale afiliarte según tu nivel de riesgo.",
  },
  {
    number: 3,
    icon: "FileEdit",
    title: "Obtén total transparencia",
    description:
      "Recibes una estimación orientativa de referencia. Un asesor valida el valor final contigo antes de iniciar cualquier trámite.",
  },
  {
    number: 4,
    icon: "WhatsApp",
    title: "Actívate por WhatsApp",
    description: `Da clic y un experto de ${publicEnv.NEXT_PUBLIC_COMPANY_NAME} te contactará de inmediato para generar tu planilla PILA y finalizar el trámite.`,
  },
];
