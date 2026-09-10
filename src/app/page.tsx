import Link from "next/link";
import { getAllProjects } from "@/db";
import ShowcaseGallery from "@/components/showcase-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Plus, Terminal, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await getAllProjects({ includePrivate: false });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Navigation: Strict, clean, 1px border like shadcn/ui / Vercel */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-xs px-4 sm:px-8 h-12 flex items-center">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-sm text-foreground">
              <div className="w-5 h-5 rounded-md bg-foreground text-background flex items-center justify-center font-mono text-[11px] font-bold">
                H
              </div>
              <span>HTML Manager</span>
            </Link>
            <span className="text-border">/</span>
            <span className="text-xs text-muted-foreground font-mono">showcase</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground hover:text-foreground">
              <a href="https://github.com/QingYunA/html-manager" target="_blank" rel="noopener noreferrer">
                <svg className="w-3.5 h-3.5 mr-1 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </Button>

            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <Link href="/admin">控制台</Link>
            </Button>

            <ThemeToggle />

            <Button size="sm" asChild className="h-8 text-xs">
              <Link href="/admin/upload">
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>发布单页</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Header: Restrained typography, no generic purple blur spots */}
      <section className="border-b border-border/60 py-10 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[11px] font-mono font-normal">
              Self-hosted AI Artifacts
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            AI 单页应用发现与托管画廊
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            集中归档由 Claude Artifacts、ChatGPT Canvas 与 AI 编写的交互式小工具、小游戏、数据可视化与页面原型。安全沙箱隔离渲染，秒级直达。
          </p>
        </div>
      </section>

      {/* Main Showcase Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <ShowcaseGallery initialProjects={projects} />
      </main>

      {/* Footer: Crisp hairline layout */}
      <footer className="border-t border-border/80 py-6 px-4 sm:px-8 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> 沙箱安全隔离
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3 text-sky-400" /> REST API 自动化上传
            </span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground">
            Open source & self-hosted on Vercel.
          </div>
        </div>
      </footer>
    </div>
  );
}
