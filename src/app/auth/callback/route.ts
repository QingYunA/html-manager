import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeNextParam } from "@/lib/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const safeNext = sanitizeNextParam(rawNext, "/admin");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // 1. If provider returned an explicit OAuth error
  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(errorParam)}&msg=${encodeURIComponent(errorDescription || errorParam)}`
    );
  }

  // 2. Exchange authorization code for user session
  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.session) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
      console.error("Supabase OAuth exchange failed:", error);
      const errorMsg = error?.message || "oauth_exchange_failed";
      return NextResponse.redirect(
        `${origin}/admin/login?error=oauth_exchange_failed&msg=${encodeURIComponent(errorMsg)}`
      );
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/admin/login?error=oauth_exchange_failed&msg=no_code_or_client`);
}
