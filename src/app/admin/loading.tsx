import { BrandLogo } from "@/components/brand-logo";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Navbar Skeleton */}
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-xs px-3 sm:px-8 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 font-semibold text-xs tracking-tight shrink-0">
            <BrandLogo size={22} className="w-5.5 h-5.5 shrink-0" />
            <span>Pagepod</span>
          </div>
          <span className="text-border">/</span>
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Skeleton className="h-8 w-20 hidden sm:inline-block" />
          <Skeleton className="h-8 w-20 hidden sm:inline-block" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "托管项目总量" },
            { label: "公开展示中" },
            { label: "累计运行访问" },
          ].map((item, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Privacy Boundary Banner Skeleton */}
        <div className="rounded-lg border border-border bg-card/60 p-4 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-muted-foreground">
              <strong>隐私安全承诺</strong>：管理员仅可监管公开内容，用户的私有项目（Private / E2EE）受物理权限隔离，管理员及第三方绝对无法接触。
            </span>
          </div>
          <Skeleton className="h-8 w-24 shrink-0" />
        </div>

        {/* Projects Management Table Skeleton */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Table Header Filter Controls */}
          <div className="p-3.5 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between">
            <Skeleton className="h-8 w-full sm:w-72" />
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <Skeleton className="h-7 w-12 rounded-sm" />
              <Skeleton className="h-7 w-12 rounded-sm" />
              <Skeleton className="h-7 w-12 rounded-sm" />
              <Skeleton className="h-7 w-16 rounded-sm" />
            </div>
          </div>

          {/* Table Rows Skeleton */}
          <div className="divide-y divide-border">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Skeleton className="h-6 w-16 hidden sm:inline-block" />
                  <Skeleton className="h-7 w-20 hidden sm:inline-block" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
