import Link from "next/link";
import Image from "next/image";
import { getAllProjects, getSetting } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import {
  Layers,
  Eye,
  LogOut,
  ExternalLink,
  Plus,
  Globe,
  ShieldAlert,
  Key,
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
  const currentUser = await getCurrentUser();

  // Strict Privacy Enforcement:
  // 1. If selfhost admin: can view all public projects and local projects.
  // 2. In Cloud mode:
  //    - If standard user: ONLY views projects belonging to their own userId.
  //    - If platform admin: ONLY permitted to manage and inspect PUBLIC projects. User-private projects are strictly hidden!
  let projects = [];
  if (currentUser?.id === "selfhost-admin") {
    projects = await getAllProjects({ includePrivate: true });
  } else if (currentUser?.id) {
    // User sees their own projects (including their own private ones)
    const myProjects = await getAllProjects({ userId: currentUser.id });
    if (currentUser.role === "admin") {
      // Platform admin also sees public items from everyone for moderation, but NEVER others' private items!
      const publicProjects = await getAllProjects({ includePrivate: false });
      const map = new Map();
      [...myProjects, ...publicProjects].forEach((p) => map.set(p.id, p));
      projects = Array.from(map.values());
    } else {
      projects = myProjects;
    }
  } else {
    projects = await getAllProjects({ includePrivate: false });
  }

  const apiTokens = await getSetting("api_tokens", "");
  const totalViews = projects.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const publicCount = projects.filter((p) => p.visibility === "public").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-xs px-4 sm:px-8 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2 font-semibold text-xs tracking-tight">
            <div className="relative w-5 h-5 rounded-md overflow-hidden flex items-center justify-center shrink-0">
              <Image
                src="/brand/pagepod-logo-monochrome.png"
                alt="Pagepod"
                width={20}
                height={20}
                className="w-5 h-5 object-contain dark:hidden"
                priority
              />
              <Image
                src="/brand/pagepod-logo-dark.png"
                alt="Pagepod"
                width={20}
                height={20}
                className="w-5 h-5 object-contain hidden dark:block"
                priority
              />
            </div>
            <span>Pagepod</span>
          </Link>
          <span className="text-border">/</span>
          <Badge variant="outline" className="text-[10px] font-mono">
            {currentUser?.role === "admin" ? "console (admin)" : "workspace"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="h-8 text-xs text-muted-foreground hover:text-foreground">
            <Link href="/" target="_blank">
              <span>公开画廊</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5 border-border">
            <Link href="/admin/settings/tokens">
              <Key className="w-3.5 h-3.5" />
              <span>API 密钥</span>
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
                {currentUser?.role === "admin" ? "平台公开单页与个人项目" : "你的个人项目总数"}
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

        {/* Privacy Boundary Banner */}
        <div className="rounded-lg border border-border bg-card/60 p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-muted-foreground">
              <strong>隐私安全承诺</strong>：管理员仅可监管公开内容，用户的私有项目（Private / E2EE）受物理权限隔离，管理员及第三方绝对无法接触。
            </span>
          </div>
          <ApiTokenGuideModal configuredTokens={apiTokens} />
        </div>

        {/* Projects Management Table */}
        <AdminTable initialProjects={projects} />
      </main>
    </div>
  );
}
