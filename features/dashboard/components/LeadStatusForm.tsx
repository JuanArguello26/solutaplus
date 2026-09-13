"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { LEAD_STATUS_OPTIONS } from "@/constants/lead-status";
import { useUpdateLeadStatus } from "../hooks/useUpdateLeadStatus";
import type { LeadDetail } from "../types/leads";

interface LeadStatusFormProps {
  leadId: string;
  currentStatus: LeadDetail["status"];
}

export function LeadStatusForm({ leadId, currentStatus }: LeadStatusFormProps) {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [comment, setComment] = useState("");
  const { addToast } = useToast();
  const mutation = useUpdateLeadStatus(leadId);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    mutation.mutate(
      { newStatus, comment: comment || undefined },
      {
        onSuccess: () => {
          addToast("Estado actualizado correctamente.", "success");
          setComment("");
        },
        onError: (error) => addToast(error.message, "error"),
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Select
        label="Nuevo estado"
        name="newStatus"
        options={LEAD_STATUS_OPTIONS}
        value={newStatus}
        onChange={(event) =>
          setNewStatus(event.target.value as LeadDetail["status"])
        }
      />
      <Textarea
        label="Comentario (opcional)"
        name="comment"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <Button
        type="submit"
        loading={mutation.isPending}
        disabled={newStatus === currentStatus && !comment}
      >
        Actualizar estado
      </Button>
    </form>
  );
}
