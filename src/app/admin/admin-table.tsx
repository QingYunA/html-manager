"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List,
  ExternalLink,
  Edit3,
  Trash2,
  Pin,
  FileCode2,
  FolderArchive,
  Eye,
  Calendar,
  Play,
  Share2,
  Check,
  Wrench,
  Gamepad2,
  BarChart3,
  Smartphone,
  Sparkles,
  Layers,
  Boxes,
} from "lucide-react";
import type { Project } from "@/db/schema";
import { togglePinAction, updateVisibilityAction, deleteProjectAction } from "@/app/actions/manage";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/lib/i18n/context";

interface AdminTableProps {
  initialProjects: Project[];
}

const CATEGORY_ICONS = {
  all: Layers,
  tools: Wrench,
  games: Gamepad2,
  visualization: BarChart3,
  prototypes: Smartphone,
  animations: Sparkles,
  others: Boxes,
};

export default function AdminTable({ initialProjects }: AdminTableProps) {
  const { t } = useLanguage();
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync viewMode with localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pagepod_admin_view_mode");
      if (saved === "grid" || saved === "table") {
        setViewMode(saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    try {
      localStorage.setItem("pagepod_admin_view_mode", mode);
    } catch {
      // Ignore
    }
  };

  const categories = useMemo(() => [
    { id: "all", label: t.categories.all || "全部", icon: CATEGORY_ICONS.all },
    { id: "tools", label: t.categories.tools || "实用工具", icon: CATEGORY_ICONS.tools },
    { id: "games", label: t.categories.games || "互动游戏", icon: CATEGORY_ICONS.games },
    { id: "visualization", label: t.categories.visualization || "数据可视化", icon: CATEGORY_ICONS.visualization },
    { id: "prototypes", label: t.categories.prototypes || "页面原型", icon: CATEGORY_ICONS.prototypes },
    { id: "animations", label: t.categories.animations || "动效演示", icon: CATEGORY_ICONS.animations },
    { id: "others", label: t.categories.others || "其他", icon: CATEGORY_ICONS.others },
  ], [t]);

  const categoryMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  // Compute item count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: projects.length };
    projects.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [projects, categoryFilter, search]);

  const handleTogglePin = (id: string, current: boolean) => {
    startTransition(async () => {
      await togglePinAction(id, current);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isPinned: !current } : p))
      );
    });
  };

  const handleUpdateVisibility = (id: string, next: "public" | "unlisted" | "private") => {
    startTransition(async () => {
      await updateVisibilityAction(id, next);
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, visibility: next } : p))
      );
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`确定要删除项目 "${title}" 吗？此操作不可逆。`)) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteProjectAction(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
    });
  };

  const handleShare = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden space-y-0">
      {/* Table Header Filter & View Controls Toolbar */}
      <div className="p-3.5 border-b border-border flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card/60">
        {/* Left: Search Bar */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题、Slug、描述或标签..."
            aria-label="搜索项目标题、Slug、标签"
            className="pl-8 text-xs bg-muted/20 border-border h-8"
          />
        </div>

        {/* Center: Enhanced Category Pills with Icons & Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none flex-1 lg:justify-center">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = categoryFilter === cat.id;
            const count = categoryCounts[cat.id] || 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-foreground text-background font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-background/20 text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: View Mode Toggle (Grid vs Table) */}
        <div className="flex items-center justify-end gap-1 shrink-0">
          <div className="inline-flex items-center rounded-md border border-border p-0.5 bg-muted/20">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("grid")}
              className="h-7 px-2.5 text-xs gap-1.5 rounded-sm"
              title="网格卡片视口视图"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">卡片</span>
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleViewModeChange("table")}
              className="h-7 px-2.5 text-xs gap-1.5 rounded-sm"
              title="数据表格列表视图"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">表格</span>
            </Button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: GRID CARDS (Live Miniature Sandboxed Previews) */}
      {viewMode === "grid" ? (
        <div className="p-4 bg-muted/5 min-h-[300px]">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
              <Layers className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="font-medium text-foreground">没有找到匹配的 HTML 项目</p>
              <p>请尝试调整搜索关键词或分类筛选条件。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => {
                const cat = categoryMap[item.category] || categoryMap["tools"];
                const CategoryIcon = cat?.icon || Layers;

                return (
                  <Card
                    key={item.id}
                    className="group relative flex flex-col overflow-hidden border-border bg-card/80 hover:border-neutral-500 transition-all duration-150 shadow-xs"
                  >
                    {/* Miniature 16:9 Sandbox Viewport with live HTML rendering */}
                    <div className="relative aspect-video w-full bg-neutral-950 border-b border-border/60 overflow-hidden">
                      <iframe
                        src={`/raw/${item.slug}`}
                        title={item.title}
                        tabIndex={-1}
                        sandbox="allow-scripts"
                        loading="lazy"
                        className="w-[200%] h-[200%] origin-top-left scale-50 border-0 pointer-events-none select-none bg-white opacity-95 group-hover:opacity-100 transition-opacity"
                      />

                      {/* Hover Quick Actions Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px] z-10">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8 text-xs gap-1.5 shadow-lg font-medium"
                          asChild
                        >
                          <Link href={`/p/${item.slug}`} target="_blank">
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>运行单页</span>
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5 shadow-lg font-medium bg-black/40 border-neutral-700 text-neutral-200 hover:text-white"
                          asChild
                        >
                          <Link href={`/admin/projects/${item.id}/edit`}>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>编辑</span>
                          </Link>
                        </Button>
                      </div>

                      {/* Badges on top of miniature viewport */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none z-20">
                        <Badge variant="subtle" className="text-[10px] gap-1 backdrop-blur-md bg-black/70 border-neutral-800 text-neutral-200">
                          <CategoryIcon className="w-3 h-3" />
                          <span>{cat?.label || item.category}</span>
                        </Badge>
                        {item.isPinned && (
                          <Badge variant="default" className="text-[10px] gap-1 bg-amber-500/90 text-black font-semibold">
                            <Pin className="w-2.5 h-2.5 fill-black" />
                            <span>置顶</span>
                          </Badge>
                        )}
                        {item.visibility === "private" && (
                          <Badge variant="outline" className="text-[10px] gap-1 backdrop-blur-md bg-black/70 border-red-900/50 text-red-300">
                            私有
                          </Badge>
                        )}
                      </div>

                      {/* Top right quick share button */}
                      <button
                        type="button"
                        onClick={(e) => handleShare(item.slug, e)}
                        title="复制运行链接"
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-black/70 hover:bg-black/90 text-neutral-300 hover:text-white border border-neutral-800 backdrop-blur-md transition-colors cursor-pointer z-20"
                      >
                        {copiedSlug === item.slug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Card Body: Title, Slug, Description */}
                    <CardHeader className="p-3.5 pb-2 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/p/${item.slug}`} className="hover:underline">
                          <CardTitle className="text-sm font-semibold truncate text-foreground leading-snug">
                            {item.title}
                          </CardTitle>
                        </Link>
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground truncate">
                        /p/{item.slug}
                      </div>
                      {item.description ? (
                        <CardDescription className="line-clamp-2 text-xs leading-relaxed pt-0.5 text-muted-foreground">
                          {item.description}
                        </CardDescription>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60 italic pt-0.5">暂无描述</p>
                      )}
                    </CardHeader>

                    {/* Card Bottom: Metadata & Management Controls */}
                    <CardContent className="p-3.5 pt-0 pb-3 space-y-2.5 flex-1 flex flex-col justify-end">
                      {/* Meta stats */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-2 border-t border-border/60">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{item.viewCount || 0} 次加载</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>

                      {/* Management Row: Visibility Select & Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                        <Select
                          aria-label="修改可见性"
                          value={item.visibility}
                          onChange={(e) =>
                            handleUpdateVisibility(
                              item.id,
                              e.target.value as "public" | "unlisted" | "private"
                            )
                          }
                          className="text-[11px] h-7 px-2 py-0.5 max-w-[130px]"
                        >
                          <option value="public">公开 (Public)</option>
                          <option value="unlisted">仅链接 (Unlisted)</option>
                          <option value="private">私有 (Private)</option>
                        </Select>

                        <div className="flex items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                            onClick={() => handleTogglePin(item.id, item.isPinned)}
                            className={`h-7 w-7 rounded-sm ${
                              item.isPinned
                                ? "text-amber-400 hover:text-amber-300"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            title={item.isPinned ? "取消置顶" : "置顶推荐"}
                          >
                            <Pin className={`w-3.5 h-3.5 ${item.isPinned ? "fill-current" : ""}`} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            asChild
                          >
                            <Link href={`/admin/projects/${item.id}/edit`} title="在线编辑代码">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id, item.title)}
                            disabled={deletingId === item.id || isPending}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="删除项目"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW MODE 2: TABLE VIEW (Enhanced with 16:9 Thumbnail Column) */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] font-medium text-muted-foreground bg-muted/20">
                <th className="py-2.5 px-3 w-10 text-center">置顶</th>
                <th className="py-2.5 px-3 w-20">预览</th>
                <th className="py-2.5 px-3">项目</th>
                <th className="py-2.5 px-3">分类与格式</th>
                <th className="py-2.5 px-3">访问量</th>
                <th className="py-2.5 px-3">可见性</th>
                <th className="py-2.5 px-3">创建时间</th>
                <th className="py-2.5 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    暂无匹配的 HTML 项目。
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const cat = categoryMap[item.category] || categoryMap["tools"];
                  const CategoryIcon = cat?.icon || Layers;

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      {/* Pin toggle */}
                      <td className="py-3 px-3 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onClick={() => handleTogglePin(item.id, item.isPinned)}
                          className={`h-7 w-7 rounded-sm ${
                            item.isPinned
                              ? "text-amber-400 hover:text-amber-300"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          title={item.isPinned ? "取消置顶" : "置顶推荐"}
                        >
                          <Pin className={`w-3.5 h-3.5 ${item.isPinned ? "fill-current" : ""}`} />
                        </Button>
                      </td>

                      {/* 16:9 Miniature Preview Snapshot */}
                      <td className="py-3 px-3">
                        <div className="w-16 aspect-video rounded overflow-hidden bg-neutral-950 border border-border/80 shrink-0 relative group/thumb shadow-xs">
                          <iframe
                            src={`/raw/${item.slug}`}
                            tabIndex={-1}
                            sandbox="allow-scripts"
                            loading="lazy"
                            className="w-[200%] h-[200%] origin-top-left scale-50 border-0 pointer-events-none select-none bg-white opacity-90 group-hover/thumb:opacity-100 transition-opacity"
                          />
                        </div>
                      </td>

                      {/* Title, slug & description */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-medium text-foreground truncate">{item.title}</div>
                        <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span>/p/{item.slug}</span>
                          <Link href={`/p/${item.slug}`} target="_blank" className="hover:text-foreground">
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-muted-foreground/80 truncate mt-0.5">
                            {item.description}
                          </div>
                        )}
                      </td>

                      {/* Category and Asset Type */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 font-normal">
                            <CategoryIcon className="w-2.5 h-2.5 opacity-70" />
                            <span>{cat?.label || item.category}</span>
                          </Badge>
                          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                            {item.assetType === "single_html" ? (
                              <FileCode2 className="w-3 h-3 text-sky-400" />
                            ) : (
                              <FolderArchive className="w-3 h-3 text-amber-400" />
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Views */}
                      <td className="py-3 px-3 text-muted-foreground font-mono text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-3 h-3 text-muted-foreground" /> {item.viewCount || 0}
                        </span>
                      </td>

                      {/* Visibility selector */}
                      <td className="py-3 px-3">
                        <Select
                          aria-label="修改可见性"
                          value={item.visibility}
                          onChange={(e) =>
                            handleUpdateVisibility(
                              item.id,
                              e.target.value as "public" | "unlisted" | "private"
                            )
                          }
                          className="text-[11px] h-auto px-2 py-1"
                        >
                          <option value="public">公开 (Public)</option>
                          <option value="unlisted">仅链接 (Unlisted)</option>
                          <option value="private">私有 (Private)</option>
                        </Select>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 text-muted-foreground text-[11px] font-mono">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
                            <Link href={`/p/${item.slug}`} target="_blank" title="在新标签页运行">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </Button>

                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
                            <Link href={`/admin/projects/${item.id}/edit`} title="在线编辑代码">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id, item.title)}
                            disabled={deletingId === item.id || isPending}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="删除项目"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
