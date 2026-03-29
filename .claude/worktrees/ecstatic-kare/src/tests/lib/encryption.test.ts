import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { encrypt, decrypt } from "@/lib/encryption";

// AES-256-GCM requires a 32-byte (64 hex char) key
const TEST_KEY = "a".repeat(64); // valid 64-char hex key

describe("encrypt / decrypt", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY;
  });

  afterAll(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  it("encrypts and decrypts a simple string", () => {
    const plaintext = "hello world";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("encrypts and decrypts an empty string", () => {
    const encrypted = encrypt("");
    expect(decrypt(encrypted)).toBe("");
  });

  it("encrypts and decrypts special characters", () => {
    const plaintext = "пароля!@#$%^&*()_+日本語";
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("encrypts and decrypts a long string", () => {
    const plaintext = "x".repeat(10000);
    const encrypted = encrypt(plaintext);
    expect(decrypt(encrypted)).toBe(plaintext);
  });

  it("produces different ciphertext each call (random IV)", () => {
    const plaintext = "same input";
    const enc1 = encrypt(plaintext);
    const enc2 = encrypt(plaintext);
    expect(enc1).not.toBe(enc2);
    // But both decrypt to same plaintext
    expect(decrypt(enc1)).toBe(plaintext);
    expect(decrypt(enc2)).toBe(plaintext);
  });

  it("encrypted format is iv:tag:ciphertext (3 colon-separated parts)", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    // IV = 12 bytes = 24 hex chars
    expect(parts[0]).toHaveLength(24);
    // Auth tag = 16 bytes = 32 hex chars
    expect(parts[1]).toHaveLength(32);
    // Ciphertext is non-empty
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it("throws on invalid encrypted format", () => {
    expect(() => decrypt("invalid")).toThrow("Invalid encrypted value format");
    expect(() => decrypt("a:b")).toThrow("Invalid encrypted value format");
  });

  it("throws when ENCRYPTION_KEY is missing", () => {
    const saved = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");
    process.env.ENCRYPTION_KEY = saved;
  });

  it("throws when ENCRYPTION_KEY is wrong length", () => {
    const saved = process.env.ENCRYPTION_KEY;
    process.env.ENCRYPTION_KEY = "short";
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");
    process.env.ENCRYPTION_KEY = saved;
  });

  it("throws when tampered ciphertext is decrypted (auth tag mismatch)", () => {
    const encrypted = encrypt("secret");
    const parts = encrypted.split(":");
    // Flip last byte of ciphertext
    const badHex = parts[2].slice(0, -2) + "00";
    const tampered = [parts[0], parts[1], badHex].join(":");
    expect(() => decrypt(tampered)).toThrow();
  });
});
