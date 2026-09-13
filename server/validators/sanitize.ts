export function sanitizeText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizePhone(input: string): string {
  return input.replace(/\D/g, "");
}

export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase();
}
