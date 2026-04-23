import crypto from "crypto";

/**
 * Hashes a raw security token (password reset, email verification, magic link)
 * before it lands in the database. The raw token stays only in the email link.
 *
 * We use plain SHA-256 because:
 *   1. The tokens are already 32 random bytes (256 bits), so no rainbow-table risk.
 *   2. We need fast lookup by hash, not password-style KDF.
 *   3. A DB leak exposes only the hash, not a usable token.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

/**
 * Generate a cryptographically random raw token (hex, 64 chars).
 */
export function generateRawToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}
