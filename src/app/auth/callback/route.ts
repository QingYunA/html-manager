import { NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sanitizeNextParam } from "@/lib/safe-redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next");
  const safeNext = sanitizeNextParam(rawNext, "/workspace");
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // 1. If provider returned an explicit OAuth error
  if (errorParam) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorParam)}&msg=${encodeURIComponent(errorDescription || errorParam)}`
    );
  }

  const supabase = await createSupabaseServerClient();

  // 2. Exchange authorization code for user session (OAuth / PKCE flow)
  if (code && supabase) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.session) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    console.error("Supabase OAuth exchange failed:", error);
    const errorMsg = error?.message || "oauth_exchange_failed";
    return NextResponse.redirect(
      `${origin}/login?error=oauth_exchange_failed&msg=${encodeURIComponent(errorMsg)}`
    );
  }

  // 3. Verify OTP from email confirmation links (token_hash flow)
  if (token_hash && type && supabase) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error && data?.session) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/login?step=reset-password`);
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    console.error("Supabase email token verification failed:", error);
    const errorMsg = error?.message || "email_verification_failed";
    return NextResponse.redirect(
      `${origin}/login?error=email_verification_failed&msg=${encodeURIComponent(errorMsg)}`
    );
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed&msg=no_code_or_client`);
}
