export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas

// Se lee process.env directamente (acceso estático, no vía lib/env.ts)
// porque este módulo lo importa middleware.ts, que corre en el runtime
// Edge. lib/env.ts valida TODAS las variables del proyecto (incluidas
// DATABASE_URL/DIRECT_URL) y no tiene sentido tirar abajo el gate de
// admin si alguna variable no relacionada falla en ese runtime.
function requireEnvVar(name: "ADMIN_SESSION_SECRET" | "ADMIN_PASSWORD"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}.`);
  }
  return value;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(requireEnvVar("ADMIN_SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Sesion firmada sin modelo de usuarios (gate MVP): el payload solo
 * lleva la fecha de expiracion, la firma HMAC es lo que garantiza que
 * el cookie no fue fabricado por un cliente. crypto.subtle funciona
 * igual en el middleware (Edge) y en los route handlers (Node), asi
 * que una sola implementacion sirve para firmar y verificar.
 */
export async function createAdminSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = toBase64Url(new TextEncoder().encode(String(expiresAt)));

  const key = await getSigningKey();
  const signatureBytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const signature = toBase64Url(new Uint8Array(signatureBytes));

  return `${payload}.${signature}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const key = await getSigningKey();
  const isValidSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signature) as BufferSource,
    new TextEncoder().encode(payload),
  );
  if (!isValidSignature) return false;

  const expiresAt = Number(new TextDecoder().decode(fromBase64Url(payload)));
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

async function sha256(value: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return new Uint8Array(digest);
}

/**
 * Compara en tiempo constante para no filtrar la contraseña por
 * temporización. Se hashea antes de comparar para que ambos buffers
 * tengan siempre el mismo tamaño (SHA-256 = 32 bytes), sin importar
 * la longitud de la contraseña candidata.
 */
export async function verifyAdminPassword(candidate: string): Promise<boolean> {
  const [candidateHash, expectedHash] = await Promise.all([
    sha256(candidate),
    sha256(requireEnvVar("ADMIN_PASSWORD")),
  ]);

  let diff = 0;
  for (let i = 0; i < expectedHash.length; i++) {
    diff |= candidateHash[i] ^ expectedHash[i];
  }
  return diff === 0;
}
