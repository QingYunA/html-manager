import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

let cachedSecret: Uint8Array | null = null;

/**
 * Resolves the JWT signing secret.
 * Policy:
 * 1. If SESSION_SECRET (or ADMIN_PASSWORD) is configured, use it. Minimum 16 chars.
 * 2. Production: if neither is configured, return null. Callers MUST treat null as
 *    "no valid session" (fail closed) rather than signing/verifying with a guessable key.
 *    We return null instead of throwing so that a misconfiguration degrades to
 *    "admin login unavailable" rather than a 500 on every request.
 * 3. Development: auto-generate a cryptographically secure 32-byte secret, persist it
 *    to .data/.jwt_secret, and warn once. This preserves zero-config local development.
 *
 * NOTE: the fallback must never be derived from a public or semi-public value
 * (e.g. NEXT_PUBLIC_* or DATABASE_URL). Anyone who can read such a value could then
 * forge an admin JWT and call privileged endpoints with it.
 */
export function getJwtSecret(): Uint8Array | null {
  if (cachedSecret) {
    return cachedSecret;
  }

  const envSecret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (envSecret && envSecret.trim().length >= 16) {
    cachedSecret = new TextEncoder().encode(envSecret.trim().padEnd(32, "0"));
    return cachedSecret;
  }

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (isProduction) {
    // Fail closed without throwing: callers treat null as an invalid session.
    console.error(
      "[AUTH] No usable SESSION_SECRET/ADMIN_PASSWORD (min 16 chars) in production. " +
        "Admin session tokens are disabled until one is configured."
    );
    return null;
  }

  // Development auto-generation & persistence
  try {
    const dataDir = path.join(process.cwd(), ".data");
    const secretFile = path.join(dataDir, ".jwt_secret");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(secretFile)) {
      const saved = fs.readFileSync(secretFile, "utf-8").trim();
      if (saved.length >= 32) {
        cachedSecret = new TextEncoder().encode(saved);
        return cachedSecret;
      }
    }

    const generated = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(secretFile, generated, { mode: 0o600 });
    console.warn(
      "[AUTH NOTICE] Generated local development JWT secret at .data/.jwt_secret. " +
        "Configure SESSION_SECRET in .env for production."
    );
    cachedSecret = new TextEncoder().encode(generated);
    return cachedSecret;
  } catch {
    // If the filesystem is not writable, use an ephemeral in-memory secret.
    // Sessions will not survive a restart, but no guessable value is ever used.
    const inMemory = crypto.randomBytes(32).toString("hex");
    cachedSecret = new TextEncoder().encode(inMemory);
    return cachedSecret;
  }
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
