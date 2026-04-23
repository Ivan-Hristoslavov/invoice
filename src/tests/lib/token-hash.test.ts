import { describe, expect, it } from "vitest";
import { generateRawToken, hashToken } from "@/lib/token-hash";

describe("token-hash", () => {
  it("generates 64-char hex raw tokens by default (32 bytes)", () => {
    const token = generateRawToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hashes tokens deterministically with SHA-256", () => {
    const token = "test-token-value";
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("different raw tokens produce different hashes", () => {
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("is whitespace-stable", () => {
    expect(hashToken("abc")).toBe(hashToken("  abc  "));
  });

  it("does not leak the raw token inside the hash", () => {
    const token = "secret-value-xyz";
    const hash = hashToken(token);
    expect(hash.includes(token)).toBe(false);
  });
});
