"use client";

import { useState, useActionState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { loginAdmin, loginWithEmailAction } from "@/app/actions/auth";
import { createSupabaseClient, isClientCloudMode } from "@/lib/supabase/client";
import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck, Mail, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";
  const initialTab = searchParams.get("tab") === "signup" ? true : false;
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
      setOauthError("当前未配置 Supabase 环境变量，无法调用 OAuth 登录");
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
      setOauthError((err as Error)?.message || "OAuth 登录唤起失败");
      setOauthLoading(null);
    }
  };

  const renderSaaSAuth = () => (
    <div className="space-y-4">
      {/* Quick OAuth Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {/* GitHub OAuth */}
        <Button
          type="button"
          variant="outline"
          disabled={Boolean(oauthLoading)}
          onClick={() => handleOAuthLogin("github")}
          className="h-9 text-xs gap-1.5 font-medium border-border hover:bg-muted cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>{oauthLoading === "github" ? "跳转中..." : "GitHub 登录"}</span>
        </Button>

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          disabled={Boolean(oauthLoading)}
          onClick={() => handleOAuthLogin("google")}
          className="h-9 text-xs gap-1.5 font-medium border-border hover:bg-muted cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{oauthLoading === "google" ? "跳转中..." : "Google 登录"}</span>
        </Button>
      </div>

      {oauthError && (
        <p className="text-[11px] text-destructive font-medium text-center">
          {oauthError}
        </p>
      )}

      <div className="relative flex items-center justify-center">
        <div className="border-t border-border w-full" />
        <span className="bg-card px-2 text-[10px] text-muted-foreground uppercase font-mono tracking-wider absolute">
          或使用邮箱
        </span>
      </div>

      {/* Email Password Form */}
      <form action={emailFormAction} className="space-y-3">
        <input type="hidden" name="from" value={from} />
        <input type="hidden" name="isSignUp" value={String(isSignUp)} />

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-foreground">邮箱地址</label>
          <Input
            type="email"
            name="email"
            required
            placeholder="user@example.com"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-medium text-foreground">密码</label>
          <Input
            type="password"
            name="password"
            required
            placeholder="••••••••••••"
            className="h-8 text-xs"
          />
        </div>

        {emailState?.error && (
          <p className="text-[11px] text-destructive mt-1 font-medium">
            {emailState.error}
          </p>
        )}

        <Button
          type="submit"
          disabled={isEmailPending}
          className="w-full h-8 text-xs font-medium mt-1 cursor-pointer"
        >
          {isEmailPending
            ? "处理中..."
            : isSignUp
            ? "立即注册新账号"
            : "登录个人控制台"}
        </Button>

        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
          >
            {isSignUp ? "已有账号？直接登录" : "没有账号？点击快速注册"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderSelfhostAuth = () => (
    <form action={adminFormAction} className="space-y-4">
      <input type="hidden" name="from" value={from} />

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">
          管理员密码
        </label>
        <Input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="••••••••••••"
          className="h-9 text-xs"
        />
        {adminState?.error && (
          <p className="text-[11px] text-destructive mt-1 font-medium">
            {adminState.error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isAdminPending}
        className="w-full h-9 text-xs font-medium cursor-pointer"
      >
        {isAdminPending ? "正在验证..." : "自建密码进入"}
      </Button>
    </form>
  );

  // In Cloud mode: Strictly ONLY render SaaS Account Login (No self-hosted password tab!)
  if (isCloud) {
    return renderSaaSAuth();
  }

  // In Self-hosted mode: Clean single password form (or tabs if both configured)
  return renderSelfhostAuth();
}

export default function AdminLoginPage() {
  const isCloud = isClientCloudMode();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background text-foreground antialiased">
      <Card className="w-full max-w-sm border-border shadow-lg">
        <CardHeader className="space-y-1 text-center p-6 pb-4">
          <div className="mx-auto w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground mb-1 border border-border">
            <Lock className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight">
            {isCloud ? "SaaS 控制台登录" : "自建管理员验证"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isCloud
              ? "使用 GitHub、Google 或邮箱登录管理你的个人项目"
              : "输入环境变量 ADMIN_PASSWORD 进入控制台"}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <Suspense fallback={<div className="text-center text-xs text-muted-foreground py-4">加载中...</div>}>
            <LoginForm />
          </Suspense>
        </CardContent>

        <CardFooter className="p-6 pt-0 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground mt-2">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> 返回画廊
          </Link>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> {isCloud ? "多租户安全隔离" : "单机隐私保护"}
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
