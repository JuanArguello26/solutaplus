import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/admin-auth";

const PUBLIC_ADMIN_API_PATHS = ["/api/admin/login", "/api/admin/logout"];

function isPublicLeadCreation(pathname: string, method: string): boolean {
  return pathname === "/api/leads" && method === "POST";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/admin/login" ||
    PUBLIC_ADMIN_API_PATHS.includes(pathname) ||
    isPublicLeadCreation(pathname, request.method)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isValid = await verifyAdminSessionToken(token);

  if (!isValid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "No autenticado.",
          code: "UNAUTHENTICATED",
        },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/leads/:path*",
    "/api/dashboard/:path*",
  ],
};
