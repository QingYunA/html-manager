"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loginAdmin } from "@/app/actions/auth";
import Link from "next/link";
import { Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";
  const [state, formAction, isPending] = useActionState(loginAdmin, null);

  return (
    <form action={formAction} className="space-y-4">
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
        {state?.error && (
          <p className="text-[11px] text-destructive mt-1 font-medium">
            {state.error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-9 text-xs font-medium"
      >
        {isPending ? "正在验证..." : "登录控制台"}
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background text-foreground antialiased">
      <Card className="w-full max-w-sm border-border shadow-lg">
        <CardHeader className="space-y-1 text-center p-6 pb-4">
          <div className="mx-auto w-8 h-8 rounded-md bg-muted flex items-center justify-center text-foreground mb-1 border border-border">
            <Lock className="w-4 h-4" />
          </div>
          <CardTitle className="text-base font-semibold tracking-tight">管理中台验证</CardTitle>
          <CardDescription className="text-xs">
            输入环境变量 <code className="font-mono text-foreground">ADMIN_PASSWORD</code> 登录
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
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> 沙箱身份隔离
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}
