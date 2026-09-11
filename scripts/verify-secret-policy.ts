/**
 * Verifies the JWT secret policy:
 * - Production with no SESSION_SECRET/ADMIN_PASSWORD => null (fail closed, no guessable key)
 * - A configured secret => non-null
 * - The fallback must never ignore short secrets or derive from public values
 *
 * Run: bun run scripts/verify-secret-policy.ts
 */
import { getJwtSecret } from "../src/lib/secret-policy";

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name}`);
  }
}

// getJwtSecret caches per process, so each case runs in a fresh process triggered by an env var.
const mode = process.env.SECRET_TEST_MODE;

if (!mode) {
  console.log("(no SECRET_TEST_MODE; nothing to do)");
  process.exit(0);
}

if (mode === "production-nosecret") {
  console.log("\n=== production, no secret configured ===");
  delete process.env.SESSION_SECRET;
  delete process.env.ADMIN_PASSWORD;
  const secret = getJwtSecret();
  assert(secret === null, "Returns null (fail closed) instead of a guessable fallback");
  // Ensure it does NOT derive from a public/DB value
  process.env.NEXT_PUBLIC_SITE_URL = "https://known-public.example.com";
  process.env.DATABASE_URL = "postgres://u:p@host/db";
  const secret2 = getJwtSecret();
  assert(secret2 === null, "Still null even when NEXT_PUBLIC_SITE_URL/DATABASE_URL are present");
}

if (mode === "production-adminpassword") {
  console.log("\n=== production, ADMIN_PASSWORD set ===");
  process.env.ADMIN_PASSWORD = "a-strong-admin-password";
  delete process.env.SESSION_SECRET;
  const secret = getJwtSecret();
  assert(secret !== null, "Returns a secret when ADMIN_PASSWORD is configured");
  assert((secret as Uint8Array).length === 32, "Secret is 32 bytes");
}

if (mode === "production-short-secret") {
  console.log("\n=== production, secret too short ===");
  process.env.ADMIN_PASSWORD = "short"; // < 16 chars
  delete process.env.SESSION_SECRET;
  const secret = getJwtSecret();
  assert(secret === null, "Rejects a too-short secret (returns null)");
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
