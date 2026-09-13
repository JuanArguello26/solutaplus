import { ok, handleError } from "@/lib/api-response";
import { DashboardService } from "@/server/services/DashboardService";

export async function GET() {
  try {
    const stats = await DashboardService.getStats();
    return ok(stats);
  } catch (error) {
    return handleError(error);
  }
}
