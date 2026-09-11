import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { updateSession } from "@/lib/supabase/middleware";
import { getJwtSecret } from "@/lib/secret-policy";

const COOKIE_NAME = "html_manager_session";

const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "api",
  "auth",
  "app",
  "preview",
  "mail",
  "cdn",
  "status",
  "static",
  "assets",
]);

const SYSTEM_PATHS = new Set([
  "explore",
  "pricing",
  "about",
  "privacy",
  "terms",
  "admin",
  "api",
  "auth",
  "_next",
  "p",
  "raw",
]);

function extractSubdomain(hostHeader: string | null): string | null {
  if (!hostHeader) return null;
  const cleanHost = hostHeader.split(":")[0].toLowerCase();

  // 1. Local development (e.g. slug.localhost:3000 -> slug.localhost)
  if (cleanHost.endsWith(".localhost")) {
    const sub = cleanHost.replace(".localhost", "");
    if (sub && !RESERVED_SUBDOMAINS.has(sub) && /^[a-z0-9_-]+$/.test(sub)) {
      return sub;
    }
  }

  // 2. Custom app domain (e.g. process.env.NEXT_PUBLIC_APP_DOMAIN or "pagepod.dev")
  const baseDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN || "pagepod.dev").toLowerCase();
  if (cleanHost.endsWith(`.${baseDomain}`)) {
    const sub = cleanHost.slice(0, -(baseDomain.length + 1));
    if (sub && !RESERVED_SUBDOMAINS.has(sub) && /^[a-z0-9_-]+$/.test(sub)) {
      return sub;
    }
  }

  // 3. Vercel deployment preview domains (e.g. slug.html-manager-five.vercel.app)
  if (cleanHost.endsWith(".vercel.app")) {
    const parts = cleanHost.replace(".vercel.app", "").split(".");
    if (parts.length > 1) {
      const sub = parts[0];
      if (sub && !RESERVED_SUBDOMAINS.has(sub) && /^[a-z0-9_-]+$/.test(sub)) {
        return sub;
      }
    }
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const subdomain = extractSubdomain(host);

  // 1. Dynamic Subdomain Rewrite (e.g. https://my-project.pagepod.dev/ -> /p/my-project)
  if (subdomain) {
    if (pathname === "/" || pathname === "") {
      const runnerUrl = new URL(`/p/${subdomain}`, request.url);
      return NextResponse.rewrite(runnerUrl);
    }

    if (pathname === "/raw" || pathname === "/raw/") {
      const rawUrl = new URL(`/raw/${subdomain}/`, request.url);
      return NextResponse.rewrite(rawUrl);
    }

    if (pathname.startsWith("/raw/") && !pathname.startsWith(`/raw/${subdomain}`)) {
      const subPath = pathname.replace(/^\/raw/, "");
      const directRawUrl = new URL(`/raw/${subdomain}${subPath}`, request.url);
      return NextResponse.rewrite(directRawUrl);
    }

    const firstSegment = pathname.split("/")[1] || "";
    if (!SYSTEM_PATHS.has(firstSegment)) {
      // Relative or root asset request inside subdomain sandbox
      const assetUrl = new URL(`/raw/${subdomain}${pathname}`, request.url);
      return NextResponse.rewrite(assetUrl);
    }
  }

  // 2. Auto-catch Supabase OAuth redirects:
  // If Supabase falls back to Site URL (e.g. /?code=xxx) due to redirect whitelist mismatch,
  // immediately forward to /auth/callback with all query params preserved
  if (searchParams.has("code") && !pathname.startsWith("/auth/callback")) {
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  // 3. Only protect /admin routes (exempting /admin/login)
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
