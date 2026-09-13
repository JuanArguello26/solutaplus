"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { publicEnv } from "@/lib/public-env";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { leadFormSchema } from "../schemas/lead-form.schema";
import { useCreateLead } from "../hooks/useCreateLead";

interface LeadFormProps {
  serviceSlug: string;
  planId: string;
  city: string;
  onBack: () => void;
}

type LeadFormInput = z.input<typeof leadFormSchema>;
type LeadFormOutput = z.output<typeof leadFormSchema>;

export function LeadForm({ serviceSlug, planId, city, onBack }: LeadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<LeadFormInput, unknown, LeadFormOutput>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      fullName: "",
      document: "",
      phone: "",
      email: "",
      observations: "",
      consentAccepted: false,
      website: "",
    },
  });

  const createLead = useCreateLead();
  const { addToast } = useToast();

  function onSubmit(values: LeadFormOutput) {
    createLead.mutate(
      { ...values, serviceSlug, planId, city, source: "Directo" },
      {
        onSuccess: (data) => {
          addToast("¡Listo! Te estamos redirigiendo a WhatsApp.", "success");
          window.location.href = data.whatsappUrl;
        },
        onError: (error) => {
          addToast(error.message, "error");
        },
      },
    );
  }

  if (isSubmitSuccessful && createLead.isSuccess) {
    return (
      <p className="text-sm text-gray-600">
        Redirigiéndote a WhatsApp para continuar con tu asesoría...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        label="Nombre completo"
        {...register("fullName")}
        error={errors.fullName?.message}
      />
      <Input
        label="Documento (opcional)"
        {...register("document")}
        error={errors.document?.message}
      />
      <Input
        label="Teléfono"
        type="tel"
        {...register("phone")}
        error={errors.phone?.message}
      />
      <Input
        label="Correo electrónico"
        type="email"
        {...register("email")}
        error={errors.email?.message}
      />
      <Textarea
        label="Observaciones (opcional)"
        {...register("observations")}
        error={errors.observations?.message}
      />
      {/* Autorización de tratamiento de datos (Ley 1581 de 2012): debe ser
          previa, expresa e informada, por eso el texto enuncia la finalidad
          concreta en vez de un "acepto los términos" genérico. La casilla
          no viene marcada y el schema la exige para poder enviar. */}
      <Checkbox
        label={
          <>
            Autorizo de manera libre, previa, expresa e informada a{" "}
            {publicEnv.NEXT_PUBLIC_COMPANY_NAME} a recolectar, almacenar, usar
            y tratar mis datos personales con el fin de brindarme información,
            cotizaciones, asesoría y seguimiento sobre servicios de Salud,
            Pensión y ARL, conforme a la{" "}
            <Link
              href="/politica-de-privacidad"
              className="text-primary underline"
            >
              Política de Privacidad
            </Link>{" "}
            y a la Ley 1581 de 2012.
          </>
        }
        {...register("consentAccepted")}
        error={errors.consentAccepted?.message}
      />

      <p className="text-xs text-gray-500">
        Al enviar este formulario también aceptas nuestros{" "}
        <Link href="/terminos-y-condiciones" className="text-primary underline">
          Términos y Condiciones
        </Link>
        . El valor mostrado es orientativo y será validado por un asesor.
      </p>

      {/* Honeypot anti-spam: oculto para personas, visible para bots que
          autocompletan todos los campos de un formulario. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 opacity-0"
        {...register("website")}
      />

      {createLead.isError && (
        <p role="alert" className="text-sm text-red-600">
          {createLead.error.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button
          type="submit"
          loading={createLead.isPending}
          className="sm:flex-1"
        >
          Solicitar asesoría por WhatsApp
        </Button>
      </div>
    </form>
  );
}
