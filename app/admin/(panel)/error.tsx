"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { logError } from "@/lib/logger";

export default function AdminPanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, { digest: error.digest });
  }, [error]);

  return (
    <Card className="mx-auto max-w-md text-center">
      <h2 className="text-lg font-semibold text-gray-900">
        No pudimos cargar esta sección
      </h2>
      <p role="alert" className="mt-2 text-sm text-gray-600">
        Ocurrió un error de conexión. Puede ser temporal — intenta de nuevo.
      </p>
      <Button onClick={reset} className="mt-6">
        Reintentar
      </Button>
    </Card>
  );
}
