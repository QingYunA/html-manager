"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  Pin,
  Globe,
  EyeOff,
  Lock,
  FileCode2,
  FolderArchive,
  Eye,
  Calendar,
} from "lucide-react";
import type { Project } from "@/db/schema";
import { togglePinAction, updateVisibilityAction, deleteProjectAction } from "@/app/actions/manage";

interface AdminTableProps {
  initialProjects: Project[];
}

export default function AdminTable({ initialProjects }: AdminTableProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = projects.filter((p) => {
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

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
    if (!confirm(`确定要删除项目 "${title}" 吗？此操作不可恢复。`)) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteProjectAction(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
    });
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
      {/* Table Header Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-850 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题、路由 Slug、标签..."
            className="w-full bg-slate-950/80 border border-slate-750 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", "tools", "games", "visualization", "prototypes", "animations", "others"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                categoryFilter === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              {cat === "all" ? "全部" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Project Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-950/40">
              <th className="py-3 px-4 w-12 text-center">置顶</th>
              <th className="py-3 px-4">项目基本信息</th>
              <th className="py-3 px-4">分类与格式</th>
              <th className="py-3 px-4">访问量</th>
              <th className="py-3 px-4">可见性</th>
              <th className="py-3 px-4">发布时间</th>
              <th className="py-3 px-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  暂无匹配的 HTML 项目，点击右上角发布第一个单页吧！
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/40 transition">
                  {/* Pin toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      disabled={isPending}
                      onClick={() => handleTogglePin(item.id, item.isPinned)}
                      title={item.isPinned ? "取消置顶" : "置顶推荐"}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        item.isPinned
                          ? "bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
                          : "text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  </td>

                  {/* Title and slug */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-white truncate">{item.title}</div>
                    <div className="text-[11px] font-mono text-indigo-300 mt-0.5 flex items-center gap-1">
                      <span>/p/{item.slug}</span>
                      <Link
                        href={`/p/${item.slug}`}
                        target="_blank"
                        className="text-slate-500 hover:text-indigo-400"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    {item.description && (
                      <div className="text-[11px] text-slate-400 truncate mt-1">
                        {item.description}
                      </div>
                    )}
                  </td>

                  {/* Category and Asset Type */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium">
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        {item.assetType === "single_html" ? (
                          <>
                            <FileCode2 className="w-3 h-3 text-cyan-400" /> 单页 HTML
                          </>
                        ) : (
                          <>
                            <FolderArchive className="w-3 h-3 text-amber-400" /> Zip 资源包
                          </>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Views */}
                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Eye className="w-3 h-3 text-slate-500" /> {item.viewCount || 0}
                    </span>
                  </td>

                  {/* Visibility selector */}
                  <td className="py-3.5 px-4">
                    <select
                      value={item.visibility}
                      onChange={(e) =>
                        handleUpdateVisibility(
                          item.id,
                          e.target.value as "public" | "unlisted" | "private"
                        )
                      }
                      className="bg-slate-950 border border-slate-750 text-xs text-slate-300 rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                    >
                      <option value="public">🌐 公开</option>
                      <option value="unlisted">🔗 仅链接</option>
                      <option value="private">🔒 私有</option>
                    </select>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </td>

                  {/* Action buttons */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Link
                        href={`/p/${item.slug}`}
                        target="_blank"
                        title="运行查看"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        href={`/admin/projects/${item.id}/edit`}
                        title="编辑代码与配置"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        disabled={deletingId === item.id || isPending}
                        title="删除项目"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
