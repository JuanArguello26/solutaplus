import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/currency";
import { publicEnv } from "@/lib/public-env";

interface QuotationResultProps {
  service: string;
  plan: string;
  estimatedPrice: number;
  currency: string;
  benefits: string[];
}

export function QuotationResult({
  service,
  plan,
  estimatedPrice,
  currency,
  benefits,
}: QuotationResultProps) {
  // Mientras las tarifas del catálogo no estén confirmadas por el cliente,
  // se muestra el servicio y el plan elegidos pero NO la cifra: publicar un
  // precio de ejemplo como si fuera comercial sería engañoso.
  const showPrice = publicEnv.NEXT_PUBLIC_PRICES_CONFIRMED;

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-gray-500">
          {showPrice ? "Cotización estimada" : "Tu selección"}
        </p>
        <p className="text-xl font-bold text-gray-900">
          {service} · {plan}
        </p>
        {showPrice ? (
          <>
            <p className="text-primary mt-1 text-3xl font-bold">
              {formatCurrency(estimatedPrice, currency)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Este valor es una referencia y puede variar según la validación
              final de un asesor.
            </p>
          </>
        ) : (
          <p className="text-primary mt-2 text-base font-semibold">
            Un asesor te confirma el valor por WhatsApp
          </p>
        )}
      </div>
      {benefits.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {benefits.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <Check
                className="text-secondary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {benefit}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
