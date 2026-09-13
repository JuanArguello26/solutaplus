import type { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api-response";
import { enforceRateLimit } from "@/server/middleware/rate-limit";
import { quotationSchema } from "@/server/validators/quotation.schema";
import { QuotationService } from "@/server/services/QuotationService";

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "quotation");

    const body = await request.json();
    const input = quotationSchema.parse(body);
    const quotation = await QuotationService.getQuotation(input);

    return ok(quotation);
  } catch (error) {
    return handleError(error);
  }
}
