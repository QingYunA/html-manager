"use client";

import { useState, useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loginAdmin, loginWithEmailAction } from "@/app/actions/auth";
import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck, Mail, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";
  const [adminState, adminFormAction, isAdminPending] = useActionState(loginAdmin, null);
  const [emailState, emailFormAction, isEmailPending] = useActionState(loginWithEmailAction, null);
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <Tabs defaultValue="admin" className="w-full">
      <TabsList className="grid grid-cols-2 w-full h-8 mb-4">
        <TabsTrigger value="admin" className="text-xs gap-1.5">
          <Key className="w-3 h-3" />
          <span>自建管理密码</span>
        </TabsTrigger>
        <TabsTrigger value="supabase" className="text-xs gap-1.5">
          <Mail className="w-3 h-3" />
          <span>SaaS 账号登录</span>
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Self-hosted Admin Password */}
      <TabsContent value="admin">
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
            className="w-full h-9 text-xs font-medium"
          >
            {isAdminPending ? "正在验证..." : "自建密码进入"}
          </Button>
        </form>
      </TabsContent>

      {/* Tab 2: Supabase Auth Email/Password */}
      <TabsContent value="supabase">
        <form action={emailFormAction} className="space-y-3.5">
          <input type="hidden" name="from" value={from} />
          <input type="hidden" name="isSignUp" value={String(isSignUp)} />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">邮箱地址</label>
            <Input
              type="email"
              name="email"
              required
              placeholder="user@example.com"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">密码</label>
            <Input
              type="password"
              name="password"
              required
              placeholder="••••••••••••"
              className="h-9 text-xs"
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
            className="w-full h-9 text-xs font-medium mt-1"
          >
            {isEmailPending
              ? "处理中..."
              : isSignUp
              ? "立即注册新账号"
              : "登录个人控制台"}
          </Button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
            >
              {isSignUp ? "已有账号？直接登录" : "没有账号？点击快速注册"}
            </button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background text-foreground antialiased">
      <Card className="w-full max-w-sm border-border shadow-lg">
        <CardHeader className="space-y-1 text-center p-6 pb-3">
          <div className="mx-auto w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground mb-1 border border-border">
            <Lock className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight">控制台认证</CardTitle>
          <CardDescription className="text-xs">
            支持自建管理员密码 或 Supabase 云端账号多租户登录
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <Suspense fallback={<div className="text-center text-xs text-muted-foreground py-4">加载中...</div>}>
            <LoginForm />
          </Suspense>
        </CardContent>

        <CardFooter className="p-6 pt-0 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground mt-2">
          <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> 返回画廊
          </Link>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> 零知识双模认证
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
