import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSetting } from "@/db";

const COOKIE_NAME = "html_manager_session";

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "html-manager-default-secret-key-change-in-production-123456";
  return new TextEncoder().encode(secret.padEnd(32, "0"));
}

export async function getExpectedAdminPassword(): Promise<string> {
  const dbPassword = await getSetting("admin_password");
  if (dbPassword) return dbPassword;
  return process.env.ADMIN_PASSWORD || "admin888";
}

export async function verifyPassword(password: string): Promise<boolean> {
  const expected = await getExpectedAdminPassword();
  return password === expected;
}

export async function createAdminSessionToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function verifyAdminTokenFromCookies(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return false;
    return await verifyAdminSessionToken(token);
  } catch {
    return false;
  }
}

export async function verifyAdminTokenFromRequest(request: Request): Promise<boolean> {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
    if (match && match[1]) {
      return await verifyAdminSessionToken(decodeURIComponent(match[1]));
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      return await verifyApiToken(token);
    }

    return false;
  } catch {
    return false;
  }
}

export async function verifyApiToken(token: string): Promise<boolean> {
  if (!token) return false;

  // 1. Env var API_TOKEN
  if (process.env.API_TOKEN && token === process.env.API_TOKEN) {
    return true;
  }

  // 2. Or token stored in settings
  const customTokens = await getSetting("api_tokens", "");
  if (customTokens) {
    const list = customTokens.split(",").map((t) => t.trim());
    if (list.includes(token)) return true;
  }

  // 3. Allow using ADMIN_PASSWORD as fallback Bearer token
  const adminPwd = await getExpectedAdminPassword();
  if (token === adminPwd) return true;

  // 4. Or valid admin JWT
  return await verifyAdminSessionToken(token);
}

export { COOKIE_NAME };
