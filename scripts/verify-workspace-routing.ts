import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";
import { sanitizeRedirectPath, sanitizeNextParam } from "../src/lib/safe-redirect";

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

async function runTests() {
  console.log("\n=== 1. Proxy Middleware /admin Backward Compatibility Redirects ===");
  
  // 1. /admin/login -> /login (308)
  const reqAdminLogin = new NextRequest("https://pagepod.dev/admin/login?tab=signup");
  const resAdminLogin = await proxy(reqAdminLogin);
  assert(resAdminLogin.status === 308, "/admin/login returns 308");
  assert(resAdminLogin.headers.get("location")?.includes("/login?tab=signup") === true, "/admin/login redirects to /login preserving params");

  // 2. /admin -> /workspace (308)
  const reqAdmin = new NextRequest("https://pagepod.dev/admin");
  const resAdmin = await proxy(reqAdmin);
  assert(resAdmin.status === 308, "/admin returns 308");
  assert(resAdmin.headers.get("location")?.includes("/workspace") === true, "/admin redirects to /workspace");

  // 3. /admin/upload -> /workspace/upload (308)
  const reqAdminUpload = new NextRequest("https://pagepod.dev/admin/upload");
  const resAdminUpload = await proxy(reqAdminUpload);
  assert(resAdminUpload.status === 308, "/admin/upload returns 308");
  assert(resAdminUpload.headers.get("location")?.includes("/workspace/upload") === true, "/admin/upload redirects to /workspace/upload");

  // 4. /admin/settings/tokens -> /workspace/settings/tokens (308)
  const reqAdminTokens = new NextRequest("https://pagepod.dev/admin/settings/tokens");
  const resAdminTokens = await proxy(reqAdminTokens);
  assert(resAdminTokens.status === 308, "/admin/settings/tokens returns 308");
  assert(resAdminTokens.headers.get("location")?.includes("/workspace/settings/tokens") === true, "/admin/settings/tokens redirects to /workspace/settings/tokens");

  console.log("\n=== 2. Proxy Middleware /workspace Auth Protection ===");
  
  // 5. /workspace without session redirects to /login?from=/workspace (307)
  const reqWorkspaceUnauth = new NextRequest("https://pagepod.dev/workspace");
  const resWorkspaceUnauth = await proxy(reqWorkspaceUnauth);
  assert(resWorkspaceUnauth.status === 307, "/workspace unauthenticated returns 307");
  assert(resWorkspaceUnauth.headers.get("location")?.includes("/login?from=%2Fworkspace") === true, "/workspace unauthenticated redirects to /login?from=/workspace");

  // 6. /workspace/upload without session redirects to /login?from=/workspace/upload (307)
  const reqUploadUnauth = new NextRequest("https://pagepod.dev/workspace/upload");
  const resUploadUnauth = await proxy(reqUploadUnauth);
  assert(resUploadUnauth.status === 307, "/workspace/upload unauthenticated returns 307");
  assert(resUploadUnauth.headers.get("location")?.includes("/login?from=%2Fworkspace%2Fupload") === true, "/workspace/upload unauthenticated redirects to /login");

  // 7. Public pages bypass protection
  const reqPublic = new NextRequest("https://pagepod.dev/explore");
  const resPublic = await proxy(reqPublic);
  assert(resPublic.status === 200, "Public route /explore passes without redirect");

  const reqLogin = new NextRequest("https://pagepod.dev/login");
  const resLogin = await proxy(reqLogin);
  assert(resLogin.status === 200, "Public route /login passes without redirect");

  console.log("\n=== 3. Safe Redirect & Normalization ===");
  assert(sanitizeRedirectPath(null) === "/workspace", "Null input falls back to /workspace");
  assert(sanitizeRedirectPath("/admin") === "/workspace", "/admin normalizes to /workspace");
  assert(sanitizeRedirectPath("/admin/upload") === "/workspace/upload", "/admin/upload normalizes to /workspace/upload");
  assert(sanitizeRedirectPath("/admin/settings/tokens") === "/workspace/settings/tokens", "/admin/settings/tokens normalizes to /workspace/settings/tokens");
  assert(sanitizeNextParam(undefined) === "/workspace", "Next param falls back to /workspace");

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner threw uncaught error:", err);
  process.exit(1);
});
