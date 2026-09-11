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
  if (envSecret && envSecret.trim().length >= 16) {
    cachedSecret = new TextEncoder().encode(envSecret.trim().padEnd(32, "0"));
    return cachedSecret;
  }

  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (isProduction) {
    throw new Error(
      "[FATAL] SESSION_SECRET environment variable is missing in production. " +
        "Refusing to use an insecure fallback secret. Please configure SESSION_SECRET."
    );
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
    // If filesystem not writable, fall back to process-memory random secret
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
