import { FadeIn } from "./FadeIn";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className = "",
}: SectionHeadingProps) {
  return (
    <FadeIn className={`mx-auto max-w-2xl text-center ${className}`}>
      <span className="text-primary text-sm font-semibold tracking-widest uppercase">
        {eyebrow}
      </span>
      <h2 className="mt-3 text-3xl font-bold text-balance text-gray-900 sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-balance text-gray-600">
          {description}
        </p>
      )}
    </FadeIn>
  );
}
