import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { publicEnv } from "@/lib/public-env";
import type { PricingPlanContent } from "@/constants/pricing-plans";

export function PriceCard({
  name,
  badge,
  idealFor,
  includes,
  priceNote,
  extra,
  whatsappMessage,
  featured = false,
}: PricingPlanContent) {
  const whatsappLink = buildWhatsAppLink(
    publicEnv.NEXT_PUBLIC_WHATSAPP_NUMBER,
    whatsappMessage,
  );

  return (
    <Card
      hoverElevate
      className={`relative flex h-full flex-col gap-5 ${
        featured ? "ring-primary ring-2" : ""
      }`}
    >
      {badge && (
        <span className="bg-primary text-primary-foreground absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap shadow-md">
          {badge}
        </span>
      )}

      <div className={badge ? "mt-2" : ""}>
        <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        <p className="mt-1 text-sm text-gray-500">Ideal para: {idealFor}</p>
      </div>

      <ul className="flex flex-1 flex-col gap-2">
        {includes.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm text-gray-700"
          >
            <Check
              className="text-secondary mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-semibold text-gray-900">{priceNote}</p>
        {extra && <p className="mt-1 text-xs text-gray-500">{extra}</p>}
      </div>

      <Button
        href={whatsappLink}
        variant={featured ? "primary" : "outline"}
        className="w-full"
      >
        <WhatsAppIcon className="h-4 w-4" />
        Consultar este plan
      </Button>
    </Card>
  );
}
