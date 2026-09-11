import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { updateSession } from "@/lib/supabase/middleware";
import { getJwtSecret } from "@/lib/secret-policy";

const COOKIE_NAME = "html_manager_session";

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Auto-catch Supabase OAuth redirects:
  // If Supabase falls back to Site URL (e.g. /?code=xxx) due to redirect whitelist mismatch,
  // immediately forward to /auth/callback with all query params preserved
  if (searchParams.has("code") && !pathname.startsWith("/auth/callback")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  // 2. Only protect /admin routes (exempting /admin/login)
  // Public pages (/explore, /pricing, /) bypass middleware network checks completely!
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const { supabaseResponse, user } = await updateSession(request);
    let isValid = Boolean(user);

    // If not authenticated via Supabase, check Self-hosted Mode: JWT token
    if (!isValid) {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      const secret = getJwtSecret();
      if (token && secret) {
        try {
          const { payload } = await jwtVerify(token, secret);
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

    return supabaseResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
