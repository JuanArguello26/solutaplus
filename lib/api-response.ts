import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/server/errors/AppError";
import { logError } from "@/lib/logger";

export function ok<T>(data: T, message = "OK", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function fail(message: string, code: string, status: number) {
  return NextResponse.json({ success: false, message, code }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return fail(error.message, error.code, error.status);
  }

  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Datos inválidos.";
    return fail(message, "VALIDATION_ERROR", 422);
  }

  // `await request.json()` lanza SyntaxError cuando el cuerpo no es JSON
  // válido. Es un error del cliente, no del servidor: devolver 500 lo
  // clasificaba mal y ensuciaba el registro de errores internos.
  if (error instanceof SyntaxError) {
    return fail(
      "El cuerpo de la solicitud no es un JSON válido.",
      "INVALID_JSON",
      400,
    );
  }

  logError(error);
  return fail(
    "No pudimos procesar tu solicitud. Intenta nuevamente en unos segundos.",
    "INTERNAL_ERROR",
    500,
  );
}
