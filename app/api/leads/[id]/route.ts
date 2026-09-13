import { ok, handleError } from "@/lib/api-response";
import { LeadService } from "@/server/services/LeadService";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const lead = await LeadService.getLeadDetail(id);
    return ok(lead);
  } catch (error) {
    return handleError(error);
  }
}
