import { NextRequest, NextResponse } from "next/server";
import { formatApiError } from "@/lib/api-utils";
import { ApiStatusCode } from "@/types/api";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

interface RateLimitConfig {
  /** Максимален брой заявки в интервала */
  maxRequests: number;
  /** Продължителност на интервала в секунди */
  interval: number;
  excludeApiRoutes?: boolean;
  ignoreStaticFiles?: boolean;
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  public: {
    maxRequests: 60,
    interval: 60,
    excludeApiRoutes: false,
  },
  webhooks: {
    maxRequests: 30,
    interval: 60,
  },
  auth: {
    maxRequests: 10,
    interval: 60,
  },
};

/**
 * Distributed rate limiter backed by Upstash Redis (see src/lib/rate-limit.ts).
 * Falls back to per-instance in-memory storage when Redis is not configured;
 * production deployments must set UPSTASH_REDIS_REST_URL / _TOKEN.
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  configKey: keyof typeof rateLimitConfigs = "public"
): Promise<NextResponse> {
  const config = rateLimitConfigs[configKey];

  const path = request.nextUrl.pathname;
  const isApiRoute = path.startsWith("/api/");

  if (config.excludeApiRoutes !== false && !isApiRoute) {
    return handler();
  }
  if (config.ignoreStaticFiles !== false && isStaticFile(path)) {
    return handler();
  }

  const ip = getClientIp(request.headers);
  const key = `${configKey}:${ip}:${path}`;

  const { success, remaining, resetIn } = await rateLimit(key, {
    windowMs: config.interval * 1000,
    maxRequests: config.maxRequests,
  });

  const responseHeaders = new Headers();
  responseHeaders.set("X-RateLimit-Limit", config.maxRequests.toString());
  responseHeaders.set("X-RateLimit-Remaining", Math.max(0, remaining).toString());
  responseHeaders.set(
    "X-RateLimit-Reset",
    Math.ceil((Date.now() + resetIn) / 1000).toString()
  );

  if (!success) {
    const retryAfter = Math.max(1, Math.ceil(resetIn / 1000));
    responseHeaders.set("Retry-After", retryAfter.toString());
    return NextResponse.json(
      formatApiError(
        "RATE_LIMIT_EXCEEDED",
        "Твърде много заявки. Моля, опитайте отново по-късно.",
        { retryAfter },
        ApiStatusCode.SERVICE_UNAVAILABLE
      ),
      { status: 429, headers: responseHeaders }
    );
  }

  return handler().then((response) => {
    responseHeaders.forEach((value, key) => {
      response.headers.set(key, value);
    });
    return response;
  });
}

function isStaticFile(path: string): boolean {
  const staticExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".ico",
    ".css",
    ".js",
    ".json",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
  ];
  return (
    staticExtensions.some((ext) => path.endsWith(ext)) ||
    path.includes("/_next/") ||
    path.startsWith("/static/")
  );
}
