import { z } from "zod";
import { LeadStatus } from "@/generated/prisma/client";

export const leadStatusUpdateSchema = z.object({
  newStatus: z.enum(LeadStatus, {
    error: "Selecciona un estado válido.",
  }),
  comment: z.string().max(500).optional(),
});

export type LeadStatusUpdateInput = z.infer<typeof leadStatusUpdateSchema>;
