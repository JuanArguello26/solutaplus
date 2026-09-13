import { getIcon } from "./icon-map";
import type { BenefitContent } from "@/constants/benefits";

export function BenefitCard({ icon, title, description }: BenefitContent) {
  const Icon = getIcon(icon);

  return (
    <div className="group flex h-full flex-col items-start gap-3 p-6 transition-colors duration-300 hover:bg-gray-50/80">
      <div className="bg-secondary-light text-secondary flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
