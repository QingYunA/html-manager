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
  X,
  Share2,
  Check,
  Sparkles,
  FileCode2,
  FolderArchive,
  Play,
} from "lucide-react";
import type { Project } from "@/db/schema";

interface ShowcaseGalleryProps {
  initialProjects: Project[];
}

const CATEGORIES = [
  { id: "all", label: "全部作品", icon: "✨" },
  { id: "tools", label: "实用工具", icon: "🛠️", gradient: "from-blue-500 to-indigo-600" },
  { id: "games", label: "互动游戏", icon: "🎮", gradient: "from-purple-500 to-pink-600" },
  { id: "visualization", label: "数据可视化", icon: "📊", gradient: "from-emerald-500 to-teal-600" },
  { id: "prototypes", label: "页面原型", icon: "📱", gradient: "from-amber-500 to-orange-600" },
  { id: "animations", label: "动效演示", icon: "🎨", gradient: "from-rose-500 to-red-600" },
  { id: "others", label: "综合其他", icon: "📦", gradient: "from-slate-500 to-slate-700" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export default function ShowcaseGallery({ initialProjects }: ShowcaseGalleryProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    initialProjects.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [initialProjects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return initialProjects.filter((p) => {
      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }
      if (selectedTag && (!Array.isArray(p.tags) || !p.tags.includes(selectedTag))) {
        return false;
      }
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
    <div className="space-y-8">
      {/* Category Tabs & Search Bar */}
      <div className="space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedTag(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]"
                    : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800/80"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter bar: Search + Tag clear + View Mode */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 border border-slate-800/80 rounded-2xl">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索任何单页标题、简介、标签或 slug..."
              className="w-full bg-slate-950/80 border border-slate-750 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            {selectedTag && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs border border-indigo-500/30">
                <Tag className="w-3 h-3" />
                <span>{selectedTag}</span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className="hover:text-white ml-1 cursor-pointer"
                >
                  ×
                </button>
              </div>
            )}

            <div className="text-xs text-slate-400 hidden md:block">
              共找到 <span className="font-semibold text-white">{filteredProjects.length}</span> 个单页作品
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode("grid")}
                title="网格卡片视图"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "grid" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="紧凑列表视图"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === "list" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tag cloud bar */}
        {allTags.length > 0 && !selectedTag && (
          <div className="flex items-center gap-2 overflow-x-auto text-xs py-1 scrollbar-none">
            <span className="text-slate-500 shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3" /> 热门标签:
            </span>
            {allTags.slice(0, 12).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(t)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-400 hover:text-indigo-300 transition whitespace-nowrap cursor-pointer"
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Projects List/Grid */}
      {filteredProjects.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 border border-slate-850 rounded-3xl p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">暂未找到符合条件的 HTML 单页</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            你可以尝试更换搜索关键词、切换分类，或者在管理后台上传并发布新的 AI 单页作品。
          </p>
          <div className="mt-6">
            <Link
              href="/admin/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-lg shadow-indigo-600/30"
            >
              + 前往上传新作品
            </Link>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((p) => {
            const cat = CATEGORY_MAP[p.category] || CATEGORY_MAP["tools"];
            const gradient = cat.gradient || "from-indigo-500 to-violet-600";

            return (
              <div
                key={p.id}
                className="group relative flex flex-col bg-slate-900/70 hover:bg-slate-850/80 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-indigo-500/10"
              >
                {/* Top badges */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white text-lg shadow-md`}
                    >
                      {cat.icon}
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">/p/{p.slug}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {p.isPinned && (
                      <span
                        title="置顶推荐"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-medium border border-amber-500/30"
                      >
                        <Pin className="w-2.5 h-2.5 fill-amber-300" /> 置顶
                      </span>
                    )}
                    <button
                      onClick={(e) => handleShare(p.slug, e)}
                      title="复制分享链接"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      {copiedSlug === p.slug ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Title and Description */}
                <div className="flex-1">
                  <Link href={`/p/${p.slug}`} className="block">
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {p.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {p.description || "一个由 AI 辅助生成的交互式 HTML 单页工具。"}
                  </p>
                </div>

                {/* Tags */}
                {Array.isArray(p.tags) && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 my-3.5">
                    {p.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTag(t);
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 text-[10px] text-slate-400 hover:text-indigo-300 transition cursor-pointer"
                      >
                        #{t}
                      </span>
                    ))}
                    {p.tags.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{p.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Card footer */}
                <div className="pt-3.5 mt-auto border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3" /> {p.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      {p.assetType === "single_html" ? (
                        <FileCode2 className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <FolderArchive className="w-3 h-3 text-amber-400" />
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewProject(p)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-[11px] font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                      <span>试玩预览</span>
                    </button>

                    <Link
                      href={`/p/${p.slug}`}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-[11px] font-medium transition flex items-center gap-1"
                    >
                      <span>进入</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT LIST VIEW */
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
          {filteredProjects.map((p) => {
            const cat = CATEGORY_MAP[p.category] || CATEGORY_MAP["tools"];
            return (
              <div
                key={p.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-850/50 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-base shrink-0">
                    {cat.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/p/${p.slug}`}
                        className="font-bold text-sm text-white hover:text-indigo-300 transition truncate"
                      >
                        {p.title}
                      </Link>
                      {p.isPinned && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-medium">
                          置顶
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {p.description || "无简介"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400">
                      {cat.label}
                    </span>
                    <span>/p/{p.slug}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewProject(p)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                      <span>预览</span>
                    </button>
                    <Link
                      href={`/p/${p.slug}`}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1"
                    >
                      <span>运行</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK PREVIEW MODAL */}
      {previewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative">
            {/* Modal Header */}
            <div className="h-13 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">
                  {CATEGORY_MAP[previewProject.category]?.icon || "🛠️"}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{previewProject.title}</h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    /raw/{previewProject.slug}/
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/p/${previewProject.slug}`}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>打开全功能运行台</span>
                </Link>
                <button
                  onClick={() => setPreviewProject(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Iframe Sandbox Container */}
            <div className="flex-1 bg-white relative">
              <iframe
                src={`/raw/${previewProject.slug}/`}
                title={previewProject.title}
                sandbox="allow-scripts allow-forms allow-downloads allow-popups"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
