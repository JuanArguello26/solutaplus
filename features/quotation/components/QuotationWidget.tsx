"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  quotationSchema,
  type QuotationInput,
} from "@/server/validators/quotation.schema";
import { useQuotation } from "../hooks/useQuotation";
import { fetchServices, fetchPlansByService } from "../services/catalog-client";
import type { QuotationResultDto } from "../services/quotation-client";
import { CITIES } from "@/constants/cities";

// Catálogo de servicios/planes cambia poco; evita refetch en cada
// focus de ventana.
const CATALOG_STALE_TIME_MS = 60_000;

interface QuotationWidgetProps {
  onCalculated: (result: QuotationResultDto, context: QuotationInput) => void;
}

export function QuotationWidget({ onCalculated }: QuotationWidgetProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationInput>({
    resolver: zodResolver(quotationSchema),
    defaultValues: { serviceSlug: "", planId: "", city: "" },
  });

  const serviceSlug = watch("serviceSlug");

  const servicesQuery = useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
    staleTime: CATALOG_STALE_TIME_MS,
  });
  const plansQuery = useQuery({
    queryKey: ["plans", serviceSlug],
    queryFn: () => fetchPlansByService(serviceSlug),
    enabled: serviceSlug.length > 0,
    staleTime: CATALOG_STALE_TIME_MS,
  });

  useEffect(() => {
    setValue("planId", "");
  }, [serviceSlug, setValue]);

  const quotationMutation = useQuotation();

  function onSubmit(values: QuotationInput) {
    quotationMutation.mutate(values, {
      onSuccess: (data) => onCalculated(data, values),
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Select
        label="Servicio"
        placeholder={
          servicesQuery.isLoading ? "Cargando..." : "Selecciona un servicio"
        }
        options={(servicesQuery.data ?? []).map((service) => ({
          value: service.slug,
          label: service.name,
        }))}
        error={
          errors.serviceSlug?.message ??
          (servicesQuery.isError
            ? "No pudimos cargar los servicios. Intenta de nuevo en unos segundos."
            : undefined)
        }
        {...register("serviceSlug")}
      />
      <Select
        label="Plan"
        placeholder={
          !serviceSlug
            ? "Primero selecciona un servicio"
            : plansQuery.isLoading
              ? "Cargando..."
              : "Selecciona un plan"
        }
        options={(plansQuery.data ?? []).map((plan) => ({
          value: plan.id,
          label: plan.name,
        }))}
        disabled={!serviceSlug}
        error={errors.planId?.message}
        {...register("planId")}
      />
      <Select
        label="Ciudad"
        placeholder="Selecciona tu ciudad"
        options={CITIES.map((cityName) => ({
          value: cityName,
          label: cityName,
        }))}
        error={errors.city?.message}
        {...register("city")}
      />

      {quotationMutation.isError && (
        <p role="alert" className="text-sm text-red-600">
          {quotationMutation.error.message}
        </p>
      )}

      <Button type="submit" loading={quotationMutation.isPending}>
        Calcular
      </Button>
    </form>
  );
}
