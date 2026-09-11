import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { getSetting } from "@/db";
import { createSupabaseServerClient, isCloudMode } from "@/lib/supabase/server";
import { verifyAndConsumeToken } from "@/lib/tokens";

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

export interface CurrentUser {
  id: string;
  email?: string;
  role: "admin" | "user";
  fullName?: string;
  avatarUrl?: string;
  tokenId?: string;
  tokenName?: string;
}

/**
 * Universal session & API Token verification:
 * 1. Bearer / x-api-key Personal Access Token (PAT): Resolves exact user from api_tokens table
 * 2. Cloud mode: Checks Supabase Auth session via cookies
 * 3. Self-hosted mode: Checks local admin JWT cookie
 */
export async function getCurrentUser(request?: Request): Promise<CurrentUser | null> {
  // 1. Check Personal Access Token / API Key from request headers
  try {
    let authHeader: string | null = null;
    let apiKeyHeader: string | null = null;

    if (request) {
      authHeader = request.headers.get("authorization");
      apiKeyHeader = request.headers.get("x-api-key");
    } else {
      const headerList = await headers();
      authHeader = headerList.get("authorization");
      apiKeyHeader = headerList.get("x-api-key");
    }

    let rawToken: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      rawToken = authHeader.slice(7).trim();
    } else if (apiKeyHeader) {
      rawToken = apiKeyHeader.trim();
    }

    if (rawToken && rawToken.startsWith("pp_live_")) {
      const tokenMatch = await verifyAndConsumeToken(rawToken);
      if (tokenMatch) {
        return {
          id: tokenMatch.userId,
          email: tokenMatch.userId === "selfhost-admin" ? "admin@selfhost.local" : undefined,
          role: tokenMatch.userId === "selfhost-admin" ? "admin" : "user",
          tokenId: tokenMatch.tokenId,
          tokenName: tokenMatch.name,
        };
      }
    }
  } catch {
    // Non-fatal, fallback to cookie checks
  }

  // 2. Check Cloud Mode via Supabase cookies (0ms local memory session check)
  if (isCloudMode()) {
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        // First try local session from signed cookie (instant memory decode without blocking HTTP roundtrip)
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
        const user = session?.user;
        if (!sessionErr && user) {
          const metadata = user.user_metadata || {};
          const fullName = metadata.full_name || metadata.name || metadata.user_name;
          const avatarUrl = metadata.avatar_url || metadata.picture;

          return {
            id: user.id,
            email: user.email,
            role: "user",
            fullName: typeof fullName === "string" ? fullName : undefined,
            avatarUrl: typeof avatarUrl === "string" ? avatarUrl : undefined,
          };
        }
      }
    } catch {
      // Fallback
    }
  }

  // 3. Fallback / Self-hosted check
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    const isValid = await verifyAdminSessionToken(token);
    if (isValid) {
      return {
        id: "selfhost-admin",
        email: "admin@selfhost.local",
        role: "admin",
      };
    }
  }

  return null;
}

export async function verifyAdminTokenFromCookies(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user);
}

export async function verifyAdminTokenFromRequest(request: Request): Promise<boolean> {
  try {
    // 1. Bearer Token check
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const validToken = await verifyApiToken(token);
      if (validToken) return true;
    }

    // 2. Cookie check
    const user = await getCurrentUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

export async function verifyApiToken(token: string): Promise<boolean> {
  if (!token) return false;

  if (process.env.API_TOKEN && token === process.env.API_TOKEN) {
    return true;
  }

  const customTokens = await getSetting("api_tokens", "");
  if (customTokens) {
    const list = customTokens.split(",").map((t) => t.trim());
    if (list.includes(token)) return true;
  }

  const adminPwd = await getExpectedAdminPassword();
  if (token === adminPwd) return true;

  return await verifyAdminSessionToken(token);
}

export { COOKIE_NAME };
