"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loginAdmin } from "@/app/actions/auth";
import { Lock, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";
  const [state, formAction, isPending] = useActionState(loginAdmin, null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="from" value={from} />

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          管理员密码
        </label>
        <div className="relative">
          <input
            type="password"
            name="password"
            required
            autoFocus
            placeholder="••••••••••••"
            className="w-full bg-slate-950/70 border border-slate-750 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-600"
          />
        </div>
        {state?.error && (
          <p className="text-xs text-rose-400 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
            {state.error}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 active:scale-[0.99] disabled:opacity-50 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
      >
        {isPending ? (
          <span>正在验证...</span>
        ) : (
          <>
            <span>进入控制台</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-slate-950 text-slate-50 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 -translate-x-1/2 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30 mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            管理后台登录 <Sparkles className="w-4 h-4 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            请输入部署时设置的 <code className="text-indigo-300 font-mono">ADMIN_PASSWORD</code>
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-xs text-slate-500 py-4">加载中...</div>}>
          <LoginForm />
        </Suspense>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-200 transition-colors">
            ← 返回公开画廊
          </Link>
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 沙箱与身份双重隔离
          </span>
        </div>
      </div>
    </div>
  );
}
