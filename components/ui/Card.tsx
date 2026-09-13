interface CardProps {
  className?: string;
  children: React.ReactNode;
  hoverElevate?: boolean;
  /** Utilidad de fondo (ej. "bg-primary-light"). No pases un bg-* por
   * className: dos clases bg-* en conflicto no tienen un ganador
   * predecible en Tailwind (el orden de cascada no sigue el orden de
   * aparición en el string de clases). */
  bg?: string;
}

export function Card({
  className = "",
  children,
  hoverElevate = false,
  bg = "bg-white",
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 ${bg} p-6 shadow-sm ${hoverElevate ? "transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl motion-reduce:hover:translate-y-0" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
