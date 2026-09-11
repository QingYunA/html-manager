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
import { useLanguage } from "@/lib/i18n/context";
import HoverSandboxPreview from "@/components/hover-sandbox-preview";

interface ShowcaseGalleryProps {
  initialProjects: Project[];
}

const CATEGORY_ICONS = {
  all: Layers,
  tools: Wrench,
  games: Gamepad2,
  visualization: BarChart3,
  prototypes: Smartphone,
  animations: Sparkles,
  others: Layers,
};

export default function ShowcaseGallery({ initialProjects }: ShowcaseGalleryProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const categories = [
    { id: "all", label: t.categories.all, icon: CATEGORY_ICONS.all },
    { id: "tools", label: t.categories.tools, icon: CATEGORY_ICONS.tools },
    { id: "games", label: t.categories.games, icon: CATEGORY_ICONS.games },
    { id: "visualization", label: t.categories.visualization, icon: CATEGORY_ICONS.visualization },
    { id: "prototypes", label: t.categories.prototypes, icon: CATEGORY_ICONS.prototypes },
    { id: "animations", label: t.categories.animations, icon: CATEGORY_ICONS.animations },
    { id: "others", label: t.categories.others, icon: CATEGORY_ICONS.others },
  ];

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  // Unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    initialProjects.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((tag) => set.add(tag));
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
        const matchTag = Array.isArray(p.tags) && p.tags.some((tag) => tag.toLowerCase().includes(q));
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border w-full min-w-0 max-w-full overflow-hidden">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full min-w-0 max-w-full">
          {categories.map((cat) => {
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
            {t.gallery.totalCount.replace("{count}", String(filteredProjects.length))}
          </span>
          <div className="flex items-center border border-border rounded-md p-0.5 bg-muted/30">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded-sm"
              onClick={() => setViewMode("grid")}
              title="Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7 rounded-sm"
              onClick={() => setViewMode("list")}
              title="List"
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
            placeholder={t.gallery.searchPlaceholder}
            aria-label={t.gallery.searchPlaceholder}
            className="pl-8 text-xs bg-muted/20 border-border"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="清除搜索"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Selected tag chip & Tag cloud */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs min-w-0 max-w-full pb-1 scrollbar-none">
          {selectedTag ? (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5">
              <span>#{selectedTag}</span>
              <button
                onClick={() => setSelectedTag(null)}
                aria-label="移除标签筛选"
                className="hover:text-foreground ml-1 cursor-pointer"
              >
                ×
              </button>
            </Badge>
          ) : (
            allTags.slice(0, 8).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                role="button"
                tabIndex={0}
                aria-pressed={selectedTag === tag}
                className="cursor-pointer hover:bg-muted/60 transition-colors text-muted-foreground"
                onClick={() => setSelectedTag(tag)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedTag(tag);
                  }
                }}
              >
                #{tag}
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
              <h3 className="text-sm font-medium text-foreground">{t.gallery.noProjectsTitle}</h3>
              <p className="text-xs text-muted-foreground">
                {t.gallery.noProjectsDesc}
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="mt-2">
              <Link href="/admin/upload">{t.gallery.uploadNow}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        /* GRID VIEW: High-end card with live sandboxed miniature thumbnail */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const cat = categoryMap[p.category] || categoryMap["tools"];
            const CategoryIcon = cat.icon;

            return (
              <Card
                key={p.id}
                className="group relative flex flex-col overflow-hidden border-border bg-card/80 hover:border-neutral-600 transition-all duration-150"
              >
                {/* Miniature Thumbnail Viewport with Hover-Activated Sandbox */}
                <div className="relative aspect-video w-full bg-neutral-950 border-b border-border/60 overflow-hidden">
                  <HoverSandboxPreview
                    slug={p.slug}
                    title={p.title}
                    category={p.category}
                    openRunnerText={t.gallery.openRunner}
                  />

                  {/* Badges on top of thumbnail */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none z-20">
                    <Badge variant="subtle" className="text-[10px] gap-1 backdrop-blur-md bg-black/60 border-neutral-800 text-neutral-200">
                      <CategoryIcon className="w-3 h-3" />
                      <span>{cat.label}</span>
                    </Badge>
                    {p.isPinned && (
                      <Badge variant="default" className="text-[10px] gap-1 bg-amber-500/90 text-black font-semibold">
                        <Pin className="w-2.5 h-2.5 fill-black" />
                        <span>{t.gallery.pinned}</span>
                      </Badge>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleShare(p.slug, e)}
                    title={t.runner.copyLink}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-neutral-300 hover:text-white border border-neutral-800 backdrop-blur-md transition-colors cursor-pointer z-20"
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
                    {p.description || ""}
                  </CardDescription>
                </CardHeader>

                {/* Tags */}
                {Array.isArray(p.tags) && p.tags.length > 0 && (
                  <CardContent className="p-4 pt-0 pb-3 flex flex-wrap gap-1">
                    {p.tags.slice(0, 4).map((tag) => (
                      <Badge
                        key={tag}
                        variant="subtle"
                        role="button"
                        tabIndex={0}
                        aria-label={`按标签 #${tag} 筛选`}
                        className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(tag);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedTag(tag);
                          }
                        }}
                      >
                        #{tag}
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
                          <FileCode2 className="w-3 h-3 text-sky-400" /> {t.gallery.singleHtml}
                        </>
                      ) : (
                        <>
                          <FolderArchive className="w-3 h-3 text-amber-400" /> {t.gallery.zipBundle}
                        </>
                      )}
                    </span>
                  </div>

                  <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-xs">
                    <Link href={`/p/${p.slug}`}>
                      {t.gallery.openDirect} <ExternalLink className="w-3 h-3 ml-1" />
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
            const cat = categoryMap[p.category] || categoryMap["tools"];
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
                          {t.gallery.pinned}
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
                    <Button variant="default" size="sm" className="h-7 text-xs gap-1" asChild>
                      <Link href={`/p/${p.slug}`}>
                        <Play className="w-3 h-3 fill-current" />
                        <span>{t.gallery.openRunner}</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
