import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiter with Upstash Redis backend (production) and an in-memory
 * fallback for local development. The in-memory map is not shared across
 * serverless instances, so it is ONLY suitable for dev. Production must
 * set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

function rateLimitInMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + config.windowMs });
    return { success: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

let redisClient: Redis | null = null;
let redisUnavailableLogged = false;

function getRedis(): Redis | null {
  if (redisClient) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!redisUnavailableLogged && process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not configured; rate limit falls back to in-memory store (NOT safe for multi-instance production)."
      );
      redisUnavailableLogged = true;
    }
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

// Cache per (windowMs, maxRequests) so we don't rebuild limiters on hot paths.
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(config: RateLimitConfig): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const key = `${config.windowMs}:${config.maxRequests}`;
  const cached = limiterCache.get(key);
  if (cached) return cached;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs} ms`),
    analytics: false,
    prefix: "rl",
  });
  limiterCache.set(key, limiter);
  return limiter;
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60_000, maxRequests: 5 }
): Promise<RateLimitResult> {
  const limiter = getLimiter(config);
  if (!limiter) {
    return rateLimitInMemory(identifier, config);
  }
  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      resetIn: Math.max(0, result.reset - Date.now()),
    };
  } catch (error) {
    console.error("[rate-limit] Upstash call failed, falling back to memory:", error);
    return rateLimitInMemory(identifier, config);
  }
}

export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
