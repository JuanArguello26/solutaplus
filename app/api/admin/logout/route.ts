import { ok } from "@/lib/api-response";
import { ADMIN_SESSION_COOKIE } from "@/lib/admin-auth";

export async function POST() {
  const response = ok(null, "Sesión cerrada.");
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  return response;
}
