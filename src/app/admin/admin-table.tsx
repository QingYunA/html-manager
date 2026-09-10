"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  Pin,
  FileCode2,
  FolderArchive,
  Eye,
  Calendar,
} from "lucide-react";
import type { Project } from "@/db/schema";
import { togglePinAction, updateVisibilityAction, deleteProjectAction } from "@/app/actions/manage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
    if (!confirm(`确定要删除项目 "${title}" 吗？`)) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteProjectAction(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Table Header Filter Controls */}
      <div className="p-3.5 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索项目标题、Slug、标签..."
            className="pl-8 text-xs bg-muted/20 border-border"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {["all", "tools", "games", "visualization", "prototypes", "animations", "others"].map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setCategoryFilter(cat)}
              className="h-7 px-2.5 text-[11px] rounded-sm"
            >
              {cat === "all" ? "全部" : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[11px] font-medium text-muted-foreground bg-muted/20">
              <th className="py-2.5 px-3 w-10 text-center">置顶</th>
              <th className="py-2.5 px-3">项目</th>
              <th className="py-2.5 px-3">格式</th>
              <th className="py-2.5 px-3">访问量</th>
              <th className="py-2.5 px-3">可见性</th>
              <th className="py-2.5 px-3">创建时间</th>
              <th className="py-2.5 px-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  暂无匹配的 HTML 项目。
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
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

                  {/* Title and slug */}
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-medium text-foreground truncate">{item.title}</div>
                    <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                      <span>/p/{item.slug}</span>
                      <Link href={`/p/${item.slug}`} target="_blank" className="hover:text-foreground">
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </td>

                  {/* Category and Asset Type */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {item.category}
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
                    <select
                      value={item.visibility}
                      onChange={(e) =>
                        handleUpdateVisibility(
                          item.id,
                          e.target.value as "public" | "unlisted" | "private"
                        )
                      }
                      className="bg-muted/40 border border-border text-[11px] text-foreground rounded-md px-2 py-1 outline-none"
                    >
                      <option value="public">公开 (Public)</option>
                      <option value="unlisted">仅链接 (Unlisted)</option>
                      <option value="private">私有 (Private)</option>
                    </select>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
