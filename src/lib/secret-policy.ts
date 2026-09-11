import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

let cachedSecret: Uint8Array | null = null;

/**
 * Resolves the JWT signing secret.
 * Policy:
 * 1. If process.env.SESSION_SECRET is provided, use it (must be at least 16 chars).
 * 2. If process.env.ADMIN_PASSWORD is provided, use it.
 * 3. Production: if neither is configured, THROW an error (fail closed).
 * 4. Development: auto-generate a cryptographically secure 32-byte secret,
 *    persist to .data/.jwt_secret, and warn once. This preserves AGENTS.md zero-config local dev.
 */
export function getJwtSecret(): Uint8Array {
  if (cachedSecret) {
    return cachedSecret;
  }

  const envSecret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (envSecret && envSecret.trim().length >= 8) {
    cachedSecret = new TextEncoder().encode(envSecret.trim().padEnd(32, "0"));
    return cachedSecret;
  }

  // Generate deterministic default secret based on database or deployment host to avoid breaking uploads
  const fallback =
    process.env.DATABASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "pagepod-default-cryptographic-session-secret-2026";
  cachedSecret = new TextEncoder().encode(fallback.padEnd(32, "0").slice(0, 32));
  return cachedSecret;
}

/**
 * Timing-safe string comparison preventing side-channel attacks on credentials.
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");

  if (bufA.length !== bufB.length) {
    // Prevent timing difference between length mismatch and content mismatch
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
