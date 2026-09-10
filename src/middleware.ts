import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { updateSession } from "@/lib/supabase/middleware";

const COOKIE_NAME = "html_manager_session";

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "html-manager-default-secret-key-change-in-production-123456";
  return new TextEncoder().encode(secret.padEnd(32, "0"));
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Auto-catch Supabase OAuth redirects:
  // If Supabase falls back to Site URL (e.g. /?code=xxx) due to redirect whitelist mismatch,
  // immediately forward to /auth/callback with all query params preserved
  if (searchParams.has("code") && !pathname.startsWith("/auth/callback")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  // 2. Official Supabase Auth Session Refresh and Cookie Forwarding
  const { supabaseResponse, user } = await updateSession(request);

  // 3. Protect /admin routes, exempting /admin/login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    let isValid = Boolean(user);

    // If not authenticated via Supabase, check Self-hosted Mode: JWT token
    if (!isValid) {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (token) {
        try {
          const { payload } = await jwtVerify(token, getJwtSecret());
          if (payload.role === "admin") {
            isValid = true;
          }
        } catch {
          isValid = false;
        }
      }
    }

    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/admin/:path*", "/auth/:path*"],
};
