import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getIcon } from "./icon-map";
import { getServiceColorScheme } from "@/constants/service-colors";
import type { ServiceContent } from "@/constants/services";

interface ServiceCardProps {
  service: ServiceContent;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const Icon = getIcon(service.icon);
  const colors = getServiceColorScheme(service.slug);

  return (
    <Card
      hoverElevate
      bg={colors.cardBg}
      className={`group flex h-full flex-col gap-4 border-t-4 ${colors.accentBorder}`}
    >
      <div
        className={`${colors.iconBg} ${colors.iconText} flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
        <p className="mt-1 text-sm text-gray-600">{service.description}</p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {service.benefits.map((benefit) => (
          <li
            key={benefit}
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <Check
              className={`${colors.iconText} h-4 w-4 shrink-0`}
              aria-hidden="true"
            />
            {benefit}
          </li>
        ))}
      </ul>
      <Button href="#cotizador" variant="outline" className="mt-auto bg-white">
        Cotizar
      </Button>
    </Card>
  );
}
