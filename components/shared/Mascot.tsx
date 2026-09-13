import Image from "next/image";
import { FadeIn } from "./FadeIn";
import { FOXY_MASCOT } from "@/constants/mascot";

interface MascotProps {
  /** Ancho del badge en px, aplicado por `style` (nunca como clase
   * `w-*` en `className` — ver la misma nota de `Card.tsx` sobre por
   * qué dos utilidades en conflicto no tienen ganador predecible en
   * Tailwind). No responsive: para tamaños distintos por breakpoint,
   * renderizar dos `Mascot` cada uno con su propio `hidden lg:block`. */
  size?: number;
  /** Solo visibilidad/posición/z-index (hidden, lg:block, absolute,
   * top-*, right-*, z-*). Nunca clases de ancho o alto aquí. */
  className?: string;
  /** Entrada fade+rise de una sola vez (reusa FadeIn). false = estático. */
  animate?: boolean;
  alt?: string;
  priority?: boolean;
}

export function Mascot({
  size = 112,
  className = "",
  animate = true,
  alt = "",
  priority = false,
}: MascotProps) {
  const badge = (
    <div style={{ width: size }}>
      <Image
        src={FOXY_MASCOT.src}
        alt={alt}
        width={FOXY_MASCOT.width}
        height={FOXY_MASCOT.height}
        priority={priority}
        className="h-auto w-full drop-shadow-xl"
      />
    </div>
  );

  return (
    <div aria-hidden="true" className={`pointer-events-none select-none ${className}`}>
      {animate ? <FadeIn>{badge}</FadeIn> : badge}
    </div>
  );
}
