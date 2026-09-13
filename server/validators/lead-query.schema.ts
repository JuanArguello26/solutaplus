import { z } from "zod";
import { LeadStatus } from "@/generated/prisma/client";

const SORTABLE_FIELDS = ["createdAt", "fullName", "status"] as const;

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(LeadStatus).optional(),
  serviceId: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(SORTABLE_FIELDS).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type LeadQueryInput = z.infer<typeof leadQuerySchema>;
