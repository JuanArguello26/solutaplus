import type { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api-response";
import { CatalogService } from "@/server/services/CatalogService";
import { validationError } from "@/server/errors/AppError";

export async function GET(request: NextRequest) {
  try {
    const serviceSlug = request.nextUrl.searchParams.get("service");
    if (!serviceSlug) {
      throw validationError("Debes indicar el parámetro 'service'.");
    }

    const plans = await CatalogService.listPlansByServiceSlug(serviceSlug);
    return ok(plans);
  } catch (error) {
    return handleError(error);
  }
}
