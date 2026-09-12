"use client";

import { useState, useActionState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { loginAdmin, loginWithEmailAction } from "@/app/actions/auth";
import { createSupabaseClient, isClientCloudMode } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Key, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/i18n/context";

function LoginForm() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/workspace";
  const errorParam = searchParams.get("error");
  const errorMsg = searchParams.get("msg");
  const initialTab = searchParams.get("tab") === "signup";
  const [adminState, adminFormAction, isAdminPending] = useActionState(loginAdmin, null);
  const [emailState, emailFormAction, isEmailPending] = useActionState(loginWithEmailAction, null);
  const [isSignUp, setIsSignUp] = useState(initialTab);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [isCloud, setIsCloud] = useState(false);

  useEffect(() => {
    setIsCloud(isClientCloudMode());
  }, []);

  const handleOAuthLogin = async (provider: "github" | "google") => {
    setOauthError(null);
    setOauthLoading(provider);

    const supabase = createSupabaseClient();
    if (!supabase) {
      setOauthError("Supabase environment variables not detected");
      setOauthLoading(null);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(from)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setOauthError(error.message);
        setOauthLoading(null);
      }
    } catch (err: unknown) {
      setOauthError((err as Error)?.message || "OAuth initiation failed");
      setOauthLoading(null);
    }
  };

  // 1. CLOUD SAAS AUTHENTICATION (Authentic shadcn/ui minimal clean design)
  if (isCloud) {
    return (
      <div className="space-y-6">
        {/* Title & Subtitle */}
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isSignUp ? t.auth.signupTitle : t.auth.loginTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? t.auth.signupSubtitle : t.auth.loginSubtitle}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(oauthLoading)}
            onClick={() => handleOAuthLogin("github")}
            className="h-9 text-xs gap-2 font-medium border-border hover:bg-muted cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>GitHub</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={Boolean(oauthLoading)}
            onClick={() => handleOAuthLogin("google")}
            className="h-9 text-xs gap-2 font-medium border-border hover:bg-muted cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Google</span>
          </Button>
        </div>

        {(oauthError || errorMsg || (errorParam && errorParam !== "oauth_exchange_failed")) && (
          <div role="alert" className="p-2.5 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-md text-center">
            {oauthError || errorMsg || errorParam}
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-background px-2 text-muted-foreground font-mono">
              {t.auth.orDivider}
            </span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form action={emailFormAction} className="space-y-3.5">
          <input type="hidden" name="from" value={from} />
          <input type="hidden" name="isSignUp" value={String(isSignUp)} />

          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-xs font-medium text-foreground">
              {t.auth.emailLabel}
            </label>
            <Input
              id="login-email"
              type="email"
              name="email"
              required
              autoFocus
              placeholder={t.auth.emailPlaceholder}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="text-xs font-medium text-foreground">
              {t.auth.passwordLabel}
            </label>
            <Input
              id="login-password"
              type="password"
              name="password"
              required
              placeholder={t.auth.passwordPlaceholder}
              className="h-9 text-xs"
            />
          </div>

          {emailState?.error && (
            <p role="alert" className="text-[11px] text-destructive font-medium">
              {emailState.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isEmailPending}
            className="w-full h-9 text-xs font-medium cursor-pointer"
          >
            {isEmailPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                <span>{t.auth.loading}</span>
              </>
            ) : isSignUp ? (
              t.auth.signupBtn
            ) : (
              t.auth.loginBtn
            )}
          </Button>
        </form>

        <div className="flex flex-col space-y-2 text-center text-xs">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
          >
            {isSignUp ? t.auth.hasAccount : t.auth.noAccount}
          </button>
          <p className="text-[11px] text-muted-foreground px-4 leading-relaxed">
            {t.auth.termsNotice}
          </p>
        </div>
      </div>
    );
  }

  // 2. SELFHOSTED ADMIN AUTH (Pure, minimal password input without AI feel)
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          {t.auth.selfhostTitle}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t.auth.selfhostSubtitle}
        </p>
      </div>

      <form action={adminFormAction} className="space-y-4">
        <input type="hidden" name="from" value={from} />

        <div className="space-y-1.5">
          <label htmlFor="admin-password" className="text-xs font-medium text-foreground">
            {t.auth.adminPasswordLabel}
          </label>
          <Input
            id="admin-password"
            type="password"
            name="password"
            required
            autoFocus
            placeholder="••••••••••••"
            className="h-9 text-xs"
          />
          {adminState?.error && (
            <p role="alert" className="text-[11px] text-destructive font-medium">
              {adminState.error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isAdminPending}
          className="w-full h-9 text-xs font-medium cursor-pointer"
        >
          {isAdminPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              <span>{t.auth.loading}</span>
            </>
          ) : (
            t.auth.selfhostBtn
          )}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top minimal bar with back button & language/theme controls */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/" className="gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.auth.backHome}</span>
          </Link>
        </Button>

        <div className="flex items-center gap-1.5">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Center Auth Container (Direct, unboxed, authentic shadcn authentication layout) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {/* Logo mark */}
          <div className="mx-auto flex items-center justify-center gap-2.5 font-semibold text-sm">
            <BrandLogo size={26} className="w-7 h-7" />
            <span>Pagepod</span>
          </div>

          <Suspense fallback={<div className="text-center text-xs text-muted-foreground py-6">{t.auth.loading}</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
