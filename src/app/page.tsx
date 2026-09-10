import Link from "next/link";
import { getAllProjects } from "@/db";
import ShowcaseGallery from "@/components/showcase-gallery";
import { Sparkles, Shield, UploadCloud, Terminal } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await getAllProjects({ includePrivate: false });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-850 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
              H
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                HTML Manager <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">AI Artifacts Showcase</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>上传单页</span>
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
            >
              <span>后台管理</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-850/60 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>自建专属 AI 单页托管与发现画廊</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            散落的 AI 网页创意，
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400 bg-clip-text text-transparent">
              在这里沉淀、检索与即刻运行。
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            专为 Claude Artifacts、ChatGPT Canvas 与 AI 交互式单页打造。多端响应式沙箱隔离、秒级直达路由、支持一键部署到 Vercel。
          </p>
        </div>
      </section>

      {/* Main Showcase Gallery Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <ShowcaseGallery initialProjects={projects} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-850 bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-4 text-slate-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-400" /> Iframe 严格沙箱隔离
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Terminal className="w-3.5 h-3.5 text-violet-400" /> 支持 API 自动化推送
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Vercel 一键自建
          </span>
        </div>
        <p>© {new Date().getFullYear()} HTML Manager. Open source & self-hosted.</p>
      </footer>
    </div>
  );
}
