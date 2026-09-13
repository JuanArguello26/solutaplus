import { ok, handleError } from "@/lib/api-response";
import { CatalogService } from "@/server/services/CatalogService";

export async function GET() {
  try {
    const services = await CatalogService.listServices();
    return ok(services);
  } catch (error) {
    return handleError(error);
  }
}
