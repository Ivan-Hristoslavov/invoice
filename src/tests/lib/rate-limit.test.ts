import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("rateLimit (in-memory fallback)", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit and blocks after the cap", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");

    const key = `test-${Date.now()}`;
    const first = await rateLimit(key, { windowMs: 10_000, maxRequests: 2 });
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(1);

    const second = await rateLimit(key, { windowMs: 10_000, maxRequests: 2 });
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(0);

    const third = await rateLimit(key, { windowMs: 10_000, maxRequests: 2 });
    expect(third.success).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.resetIn).toBeGreaterThan(0);
  });

  it("isolates keys — one blocked key does not block another", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");

    const keyA = `isoA-${Date.now()}`;
    const keyB = `isoB-${Date.now()}`;

    await rateLimit(keyA, { windowMs: 10_000, maxRequests: 1 });
    const aSecond = await rateLimit(keyA, { windowMs: 10_000, maxRequests: 1 });
    expect(aSecond.success).toBe(false);

    const bFirst = await rateLimit(keyB, { windowMs: 10_000, maxRequests: 1 });
    expect(bFirst.success).toBe(true);
  });
});
