export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function validationError(message: string, code = "VALIDATION_ERROR") {
  return new AppError(code, message, 422);
}

export function notFoundError(message: string, code = "NOT_FOUND") {
  return new AppError(code, message, 404);
}

export function conflictError(message: string, code = "CONFLICT") {
  return new AppError(code, message, 409);
}

export function rateLimitError(
  message = "Demasiadas solicitudes. Intenta de nuevo en unos minutos.",
) {
  return new AppError("RATE_LIMITED", message, 429);
}
