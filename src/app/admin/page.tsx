import Link from "next/link";
import { getAllProjects, getSetting } from "@/db";
import {
  UploadCloud,
  Layers,
  Eye,
  Key,
  LogOut,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { logoutAdmin } from "@/app/actions/auth";
import AdminTable from "./admin-table";
import ApiTokenGuideModal from "./api-token-guide";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const projects = await getAllProjects({ includePrivate: true });
  const apiTokens = await getSetting("api_tokens", "");

  const totalViews = projects.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const publicCount = projects.filter((p) => p.visibility === "public").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-850 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            H
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              HTML Manager <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">Console</span>
            </h1>
            <p className="text-xs text-slate-400">AI Artifacts 托管与展示中台</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 rounded-lg transition"
          >
            <span>公开画廊</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/admin/upload"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg shadow-sm shadow-indigo-600/30 transition"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>发布新单页</span>
          </Link>

          <form action={logoutAdmin}>
            <button
              type="submit"
              title="退出登录"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">托管项目总量</div>
              <div className="text-2xl font-bold text-white mt-1">{projects.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">含公开与私密单页</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">公开可访问</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{publicCount}</div>
              <div className="text-xs text-slate-500 mt-0.5">展示在首页画廊中</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">累计运行访问量</div>
              <div className="text-2xl font-bold text-violet-400 mt-1">{totalViews}</div>
              <div className="text-xs text-slate-500 mt-0.5">沙箱与直链加载总和</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* API Token banner */}
        <div className="bg-gradient-to-r from-indigo-950/40 to-slate-900/80 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">自动化推送 API (CLI / AI Agent 支持)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                支持通过 <code className="text-indigo-300 font-mono">POST /api/upload</code> 接口由 Cursor、Claude Code 或脚本一键上传。
              </p>
            </div>
          </div>
          <ApiTokenGuideModal configuredTokens={apiTokens} />
        </div>

        {/* Table of projects */}
        <AdminTable initialProjects={projects} />
      </main>
    </div>
  );
}
