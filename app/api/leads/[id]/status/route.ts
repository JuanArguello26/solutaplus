import { ok, handleError } from "@/lib/api-response";
import { leadStatusUpdateSchema } from "@/server/validators/lead-status-update.schema";
import { LeadService } from "@/server/services/LeadService";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const input = leadStatusUpdateSchema.parse(body);
    const lead = await LeadService.changeLeadStatus(id, input);
    return ok(lead, "Estado actualizado correctamente.");
  } catch (error) {
    return handleError(error);
  }
}
