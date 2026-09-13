import { Card } from "@/components/ui/Card";
import { getIcon } from "./icon-map";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { getStepColorScheme } from "@/constants/step-colors";
import type { StepContent } from "@/constants/steps";

export function StepCard({ number, icon, title, description }: StepContent) {
  const Icon = icon === "WhatsApp" ? null : getIcon(icon);
  const colors = getStepColorScheme(number);

  return (
    <Card
      hoverElevate
      bg={colors.cardBg}
      className="group flex h-full flex-col items-start gap-3"
    >
      <div
        className={`${colors.badgeBg} ${colors.badgeText} ring-4 ring-white flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold shadow-md transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100`}
      >
        {number}
      </div>
      {icon === "WhatsApp" ? (
        <WhatsAppIcon className={`${colors.iconText} h-5 w-5`} />
      ) : (
        Icon && <Icon className={`${colors.iconText} h-5 w-5`} aria-hidden="true" />
      )}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </Card>
  );
}
