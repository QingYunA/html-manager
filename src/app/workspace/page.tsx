import Link from "next/link";
import { getAllProjects } from "@/db";
import type { Project } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  Layers,
  Eye,
  Globe,
  ShieldAlert,
  Key,
} from "lucide-react";
import AdminTable from "./admin-table";
import ApiTokenGuideModal from "./api-token-guide";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HomeHeader } from "@/components/home-header";

export const dynamic = "force-dynamic";

export default async function WorkspacePage() {
  const currentUser = await getCurrentUser();

  // Strict Privacy Enforcement:
  // 1. If selfhost admin: can view all public projects and local projects.
  // 2. In Cloud mode:
  //    - If standard user: ONLY views projects belonging to their own userId.
  //    - If platform admin: ONLY permitted to manage and inspect PUBLIC projects. User-private projects are strictly hidden!
  let projects: Project[] = [];

  if (currentUser?.id === "selfhost-admin") {
    projects = await getAllProjects({ includePrivate: true });
  } else if (currentUser?.id) {
    if (currentUser.role === "admin") {
      // Platform admin also sees public items from everyone for moderation, but NEVER others' private items!
      const [myProjects, publicProjects] = await Promise.all([
        getAllProjects({ userId: currentUser.id }),
        getAllProjects({ includePrivate: false }),
      ]);
      const map = new Map<string, Project>();
      [...myProjects, ...publicProjects].forEach((p) => map.set(p.id, p));
      projects = Array.from(map.values());
    } else {
      // User sees their own projects (including their own private ones)
      projects = await getAllProjects({ userId: currentUser.id });
    }
  } else {
    projects = await getAllProjects({ includePrivate: false });
  }

  const totalViews = projects.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const publicCount = projects.filter((p) => p.visibility === "public").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Universal Top Header */}
      <HomeHeader
        currentUser={currentUser}
        extraActions={
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 text-xs gap-1.5 border-border hidden sm:inline-flex"
          >
            <Link href="/workspace/settings/tokens" prefetch={true}>
              <Key className="w-3.5 h-3.5" />
              <span>API 密钥</span>
            </Link>
          </Button>
        }
      />

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
                {currentUser?.role === "admin" && currentUser.id !== "selfhost-admin" ? "平台公开单页与个人项目" : "你的个人项目总数"}
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
              <strong>隐私安全承诺</strong>：用户的私有项目（Private）受物理权限隔离，任何第三方绝对无法接触。
            </span>
          </div>
          <ApiTokenGuideModal />
        </div>

        {/* Projects Management Table */}
        <AdminTable initialProjects={projects} />
      </main>
    </div>
  );
}
