import type { NextRequest } from "next/server";
import { ok, fail, handleError } from "@/lib/api-response";
import { enforceRateLimit } from "@/server/middleware/rate-limit";
import { adminLoginSchema } from "@/server/validators/admin-auth.schema";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  try {
    await enforceRateLimit(request, "admin-login");

    const body = await request.json();
    const { password } = adminLoginSchema.parse(body);

    const isValid = await verifyAdminPassword(password);
    if (!isValid) {
      return fail("Contraseña incorrecta.", "INVALID_CREDENTIALS", 401);
    }

    const token = await createAdminSessionToken();
    const response = ok(null, "Sesión iniciada correctamente.");
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
