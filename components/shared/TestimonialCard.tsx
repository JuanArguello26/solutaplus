import { Quote } from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { TestimonialContent } from "@/constants/testimonials";

export function TestimonialCard({
  name,
  city,
  service,
  quote,
}: TestimonialContent) {
  return (
    <Card hoverElevate className="flex h-full flex-col gap-4">
      <Quote
        className="text-primary/20 h-8 w-8"
        aria-hidden="true"
        fill="currentColor"
      />
      <p className="text-sm text-gray-700">&ldquo;{quote}&rdquo;</p>
      <div className="mt-auto border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">
          {city} · {service}
        </p>
      </div>
    </Card>
  );
}
