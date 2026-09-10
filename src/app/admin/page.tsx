import Link from "next/link";
import { getAllProjects, getSetting } from "@/db";
import {
  UploadCloud,
  Layers,
  Eye,
  LogOut,
  ExternalLink,
  Plus,
  Globe,
} from "lucide-react";
import { logoutAdmin } from "@/app/actions/auth";
import AdminTable from "./admin-table";
import ApiTokenGuideModal from "./api-token-guide";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const projects = await getAllProjects({ includePrivate: true });
  const apiTokens = await getSetting("api_tokens", "");

  const totalViews = projects.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const publicCount = projects.filter((p) => p.visibility === "public").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-xs px-4 sm:px-8 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xs tracking-tight">
            <div className="w-5 h-5 rounded-md bg-foreground text-background flex items-center justify-center font-mono text-[11px] font-bold">
              H
            </div>
            <span>HTML Manager</span>
          </Link>
          <span className="text-border">/</span>
          <Badge variant="outline" className="text-[10px] font-mono">console</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/" target="_blank">
              <span>公开画廊</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>

          <Button size="sm" asChild className="h-8 text-xs">
            <Link href="/admin/upload">
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>发布新单页</span>
            </Link>
          </Button>

          <ThemeToggle />

          <form action={logoutAdmin}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Metric Cards (Standard shadcn Card styling) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                托管项目总量
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight">{projects.length}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                包含公开与私密单页
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                公开展示中
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight">{publicCount}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                向所有访客公开可见
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                累计运行访问
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono tracking-tight">{totalViews}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                沙箱与直链加载总和
              </p>
            </CardContent>
          </Card>
        </div>

        {/* API Token Bar */}
        <div className="rounded-lg border border-border bg-card/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-foreground">API 自动化推送支持 (CLI / Cursor / AI Agent)</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              通过 <code className="font-mono text-foreground">POST /api/upload</code> 接口由脚本或 AI 生成后一键推送。
            </p>
          </div>
          <ApiTokenGuideModal configuredTokens={apiTokens} />
        </div>

        {/* Projects Management Table */}
        <AdminTable initialProjects={projects} />
      </main>
    </div>
  );
}
