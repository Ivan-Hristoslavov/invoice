/**
 * Symmetric encryption utility for sensitive fields (e.g., NAP credentials).
 *
 * Requires environment variable:
 *   ENCRYPTION_KEY — 64 hex characters (32 bytes), generate with:
 *     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 *
 * Usage:
 *   import { encrypt, decrypt } from "@/lib/encryption";
 *   const stored = encrypt(plaintext);   // store in DB
 *   const plain  = decrypt(stored);      // read from DB
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;    // 96-bit IV for GCM
const TAG_LENGTH = 16;   // 128-bit auth tag

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypts a plaintext string.
 * Returns a colon-separated string: `iv:authTag:ciphertext` (all hex).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    tag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

/**
 * Decrypts a value previously encrypted with `encrypt()`.
 * Returns the original plaintext string.
 */
export function decrypt(encrypted: string): string {
  const key = getKey();
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted value format");
  }
  const [ivHex, tagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
