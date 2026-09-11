import { timingSafeEqualStrings } from "../src/lib/secret-policy";
import {
  uploadPayloadSchema,
  updateProjectInputSchema,
  visibilitySchema,
  tokenNameSchema,
  MAX_UPLOAD_BYTES,
} from "../src/lib/validation";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${name}`);
  }
}

console.log("\n=== 1. Timing-Safe Comparison ===");
assert(timingSafeEqualStrings("secret-abc", "secret-abc") === true, "Equal strings match");
assert(timingSafeEqualStrings("secret-abc", "secret-abd") === false, "Different strings mismatch");
assert(timingSafeEqualStrings("short", "longer-value") === false, "Length mismatch returns false");
assert(timingSafeEqualStrings("", "") === true, "Empty strings match");

console.log("\n=== 2. Visibility Enum Validation ===");
assert(visibilitySchema.safeParse("public").success, "Accepts 'public'");
assert(visibilitySchema.safeParse("unlisted").success, "Accepts 'unlisted'");
assert(visibilitySchema.safeParse("private").success, "Accepts 'private'");
assert(!visibilitySchema.safeParse("internal").success, "REJECTS invalid 'internal' (privacy bypass)");
assert(!visibilitySchema.safeParse("").success, "Rejects empty visibility");

console.log("\n=== 3. Upload Payload Validation ===");
const validUpload = uploadPayloadSchema.safeParse({
  title: "My App",
  tags: "a, b，c",
  visibility: "public",
});
assert(validUpload.success, "Accepts valid upload payload");
if (validUpload.success) {
  assert(Array.isArray(validUpload.data.tags) && validUpload.data.tags.length === 3, "Parses comma/Chinese-comma tags");
  assert(validUpload.data.visibility === "public", "Defaults visibility correctly");
}

const badVisibility = uploadPayloadSchema.safeParse({ visibility: "super-secret" });
assert(!badVisibility.success, "Rejects arbitrary visibility value");

const badSlug = uploadPayloadSchema.safeParse({ slug: "evil/../path" });
assert(!badSlug.success, "Rejects slug with path characters");

console.log("\n=== 4. Project Update Validation ===");
const validUpdate = updateProjectInputSchema.safeParse({
  title: "Valid Title",
  visibility: "unlisted",
  tags: ["x", "y"],
});
assert(validUpdate.success, "Accepts valid project update");

const emptyTitle = updateProjectInputSchema.safeParse({ title: "", visibility: "public" });
assert(!emptyTitle.success, "Rejects empty title");

const badUpdateVisibility = updateProjectInputSchema.safeParse({ title: "T", visibility: "hidden" });
assert(!badUpdateVisibility.success, "Rejects invalid update visibility");

console.log("\n=== 5. Token Name Validation ===");
assert(tokenNameSchema.safeParse("My Cursor Key").success, "Accepts valid token name");
assert(!tokenNameSchema.safeParse("").success, "Rejects empty token name");
assert(!tokenNameSchema.safeParse("x".repeat(200)).success, "Rejects overly long token name");

console.log("\n=== 6. Upload Size Limits ===");
assert(MAX_UPLOAD_BYTES === 50 * 1024 * 1024, "Max upload size is 50MB");

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
