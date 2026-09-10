"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List,
  Pin,
  Eye,
  ExternalLink,
  Tag,
  Maximize2,
  Share2,
  Check,
  FileCode2,
  FolderArchive,
  Play,
  SlidersHorizontal,
  Wrench,
  Gamepad2,
  BarChart3,
  Smartphone,
  Sparkles,
  Layers,
  X,
} from "lucide-react";
import type { Project } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShowcaseGalleryProps {
  initialProjects: Project[];
}

const CATEGORIES = [
  { id: "all", label: "全部", icon: Layers },
  { id: "tools", label: "实用工具", icon: Wrench },
  { id: "games", label: "互动游戏", icon: Gamepad2 },
  { id: "visualization", label: "数据可视化", icon: BarChart3 },
  { id: "prototypes", label: "页面原型", icon: Smartphone },
  { id: "animations", label: "动效演示", icon: Sparkles },
  { id: "others", label: "其他", icon: Layers },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export default function ShowcaseGallery({ initialProjects }: ShowcaseGalleryProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    initialProjects.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [initialProjects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return initialProjects.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (selectedTag && (!Array.isArray(p.tags) || !p.tags.includes(selectedTag))) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description ? p.description.toLowerCase().includes(q) : false;
        const matchSlug = p.slug.toLowerCase().includes(q);
        const matchTag = Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q));
        return matchTitle || matchDesc || matchSlug || matchTag;
      }
      return true;
    });
  }, [initialProjects, selectedCategory, selectedTag, search]);

  const handleShare = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        {/* Category Pills (Subtle, clean, shadcn-inspired) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedTag(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-foreground text-background font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            共 {filteredProjects.length} 个单页
          </span>
          <div className="flex items-center border border-border rounded-md p-0.5 bg-muted/30">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded-sm"
              onClick={() => setViewMode("grid")}
              title="网格视图"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded-sm"
              onClick={() => setViewMode("list")}
              title="列表视图"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search Input & Tag Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索单页标题、路由、标签..."
            className="pl-8 text-xs bg-muted/20 border-border"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Selected tag chip & Tag cloud */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
          {selectedTag ? (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5">
              <span>#{selectedTag}</span>
              <button
                onClick={() => setSelectedTag(null)}
                className="hover:text-foreground ml-1 cursor-pointer"
              >
                ×
              </button>
            </Badge>
          ) : (
            allTags.slice(0, 8).map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="cursor-pointer hover:bg-muted/60 transition-colors text-muted-foreground"
                onClick={() => setSelectedTag(t)}
              >
                #{t}
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Grid or List View */}
      {filteredProjects.length === 0 ? (
        <Card className="py-16 text-center border-dashed border-border/80">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">没有找到匹配的单页</h3>
              <p className="text-xs text-muted-foreground">
                请尝试更换关键词，或进入控制台上传你的 AI HTML 作品。
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/admin/upload">+ 上传新作品</Link>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* GRID VIEW: High-end card with live sandboxed miniature thumbnail */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const cat = CATEGORY_MAP[p.category] || CATEGORY_MAP["tools"];
            const CategoryIcon = cat.icon;

            return (
              <Card
                key={p.id}
                className="group relative flex flex-col overflow-hidden border-border bg-card/80 hover:border-neutral-600 transition-all duration-150"
              >
                {/* Miniature Thumbnail Viewport */}
                <div className="relative aspect-video w-full bg-neutral-950 border-b border-border/60 overflow-hidden">
                  <iframe
                    src={`/raw/${p.slug}/`}
                    title={p.title}
                    tabIndex={-1}
                    sandbox="allow-scripts"
                    loading="lazy"
                    className="w-[200%] h-[200%] origin-top-left scale-50 border-0 pointer-events-none select-none bg-white opacity-95 group-hover:opacity-100 transition-opacity"
                  />
                  {/* Subtle hover overlay with quick action buttons */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 shadow-md"
                      onClick={() => setPreviewProject(p)}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>试玩预览</span>
                    </Button>
                    <Button size="sm" variant="default" className="h-8 shadow-md" asChild>
                      <Link href={`/p/${p.slug}`}>
                        <span>运行台</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>

                  {/* Badges on top of thumbnail */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                    <Badge variant="subtle" className="text-[10px] gap-1 backdrop-blur-md bg-black/60 border-neutral-800 text-neutral-200">
                      <CategoryIcon className="w-3 h-3" />
                      <span>{cat.label}</span>
                    </Badge>
                    {p.isEncrypted && (
                      <Badge variant="default" className="text-[10px] gap-1 bg-emerald-500/90 text-black font-semibold">
                        <span>🔒 E2EE</span>
                      </Badge>
                    )}
                    {p.isPinned && (
                      <Badge variant="default" className="text-[10px] gap-1 bg-amber-500/90 text-black font-semibold">
                        <Pin className="w-2.5 h-2.5 fill-black" />
                        <span>置顶</span>
                      </Badge>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleShare(p.slug, e)}
                    title="复制分享链接"
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-neutral-300 hover:text-white border border-neutral-800 backdrop-blur-md transition-colors cursor-pointer"
                  >
                    {copiedSlug === p.slug ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Share2 className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Card Body */}
                <CardHeader className="p-4 pb-2 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <Link href={`/p/${p.slug}`}>
                      <CardTitle className="text-sm font-semibold hover:underline truncate">
                        {p.title}
                      </CardTitle>
                    </Link>
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    /p/{p.slug}
                  </div>
                  <CardDescription className="line-clamp-2 text-xs leading-relaxed pt-1">
                    {p.description || "无项目详细描述"}
                  </CardDescription>
                </CardHeader>

                {/* Tags */}
                {Array.isArray(p.tags) && p.tags.length > 0 && (
                  <CardContent className="p-4 pt-0 pb-3 flex flex-wrap gap-1">
                    {p.tags.slice(0, 4).map((t) => (
                      <Badge
                        key={t}
                        variant="subtle"
                        className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(t);
                        }}
                      >
                        #{t}
                      </Badge>
                    ))}
                    {p.tags.length > 4 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        +{p.tags.length - 4}
                      </span>
                    )}
                  </CardContent>
                )}

                {/* Card Footer */}
                <CardFooter className="p-4 pt-2 mt-auto border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3 text-muted-foreground" /> {p.viewCount || 0}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      {p.assetType === "single_html" ? (
                        <>
                          <FileCode2 className="w-3 h-3 text-sky-400" /> 单页
                        </>
                      ) : (
                        <>
                          <FolderArchive className="w-3 h-3 text-amber-400" /> Zip 包
                        </>
                      )}
                    </span>
                  </div>

                  <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-xs">
                    <Link href={`/p/${p.slug}`}>
                      打开 <ExternalLink className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW: Clean tabular rows */
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {filteredProjects.map((p) => {
            const cat = CATEGORY_MAP[p.category] || CATEGORY_MAP["tools"];
            const CategoryIcon = cat.icon;
            return (
              <div
                key={p.id}
                className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                    <CategoryIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/p/${p.slug}`}
                        className="font-medium text-xs text-foreground hover:underline truncate"
                      >
                        {p.title}
                      </Link>
                      {p.isPinned && (
                        <Badge variant="default" className="text-[10px] px-1 py-0 bg-amber-500 text-black">
                          置顶
                        </Badge>
                      )}
                      <span className="text-[11px] font-mono text-muted-foreground hidden md:inline">
                        /p/{p.slug}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-[11px] text-muted-foreground truncate max-w-xl">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {p.viewCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPreviewProject(p)}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>预览</span>
                    </Button>
                    <Button variant="default" size="sm" className="h-7 text-xs" asChild>
                      <Link href={`/p/${p.slug}`}>
                        <span>运行</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK PREVIEW DIALOG (Using Radix Dialog) */}
      <Dialog open={Boolean(previewProject)} onOpenChange={(open) => !open && setPreviewProject(null)}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 flex flex-col gap-0 overflow-hidden border-border bg-card">
          <DialogHeader className="p-3.5 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-sm font-semibold">
                {previewProject?.title}
              </DialogTitle>
              <DialogDescription className="font-mono text-[11px] text-muted-foreground">
                /raw/{previewProject?.slug}/
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-6">
              {previewProject && (
                <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                  <Link href={`/p/${previewProject.slug}`}>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>打开全屏运行台</span>
                  </Link>
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 bg-white relative w-full h-full">
            {previewProject && (
              <iframe
                src={`/raw/${previewProject.slug}/`}
                title={previewProject.title}
                sandbox="allow-scripts allow-forms allow-downloads allow-popups"
                className="w-full h-full border-0"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
