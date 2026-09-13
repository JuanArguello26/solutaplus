import type { NextRequest } from "next/server";
import { ok, handleError } from "@/lib/api-response";
import { enforceRateLimit } from "@/server/middleware/rate-limit";
import { getClientIp } from "@/lib/get-client-ip";
import { createLeadSchema } from "@/server/validators/lead.schema";
import { leadQuerySchema } from "@/server/validators/lead-query.schema";
import { LeadService } from "@/server/services/LeadService";

export async function GET(request: NextRequest) {
  try {
    const query = leadQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await LeadService.listLeads(query);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "leads");

    const body = await request.json();
    const input = createLeadSchema.parse(body);

    // Honeypot: campo oculto que solo un bot completaría. Se responde
    // como si hubiera tenido éxito, sin tocar la base de datos.
    if (input.website) {
      return ok(null, "Lead registrado correctamente.", 201);
    }

    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const result = await LeadService.createLead(input, {
      ipAddress: ip,
      userAgent,
    });

    return ok(result, "Lead registrado correctamente.", 201);
  } catch (error) {
    return handleError(error);
  }
}
