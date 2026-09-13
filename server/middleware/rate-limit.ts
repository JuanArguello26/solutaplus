import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";
import { getClientIp } from "@/lib/get-client-ip";
import { rateLimitError } from "@/server/errors/AppError";

const ratelimit =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: env.UPSTASH_REDIS_REST_URL,
          token: env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(10, "60 s"),
      })
    : null;

let warnedOnce = false;

export async function checkRateLimit(
  identifier: string,
): Promise<{ success: boolean }> {
  if (!ratelimit) {
    if (!warnedOnce) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN no configuradas: rate limiting deshabilitado.",
      );
      warnedOnce = true;
    }
    return { success: true };
  }

  const { success } = await ratelimit.limit(identifier);
  return { success };
}

/**
 * Combina getClientIp + checkRateLimit y lanza RATE_LIMITED si se excede.
 * Uso en Route Handlers: await enforceRateLimit(request, "leads");
 */
export async function enforceRateLimit(
  request: NextRequest,
  key: string,
): Promise<void> {
  const ip = getClientIp(request);
  const { success } = await checkRateLimit(`${key}:${ip}`);
  if (!success) {
    throw rateLimitError();
  }
}
