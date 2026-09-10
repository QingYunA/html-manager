"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Code2,
  Settings,
  Eye,
  Check,
  AlertCircle,
  Wrench,
  Gamepad2,
  BarChart3,
  Smartphone,
  Sparkles,
  Layers,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import type { Project } from "@/db/schema";
import { updateProjectFullAction } from "@/app/actions/edit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface EditorClientProps {
  project: Project;
  initialCode: string;
}

const CATEGORIES = [
  { id: "tools", label: "实用工具", icon: Wrench },
  { id: "games", label: "互动游戏", icon: Gamepad2 },
  { id: "visualization", label: "数据可视化", icon: BarChart3 },
  { id: "prototypes", label: "页面原型", icon: Smartphone },
  { id: "animations", label: "动效演示", icon: Sparkles },
  { id: "others", label: "其他", icon: Layers },
];

export default function ProjectEditorClient({ project, initialCode }: EditorClientProps) {
  const [activeTab, setActiveTab] = useState<"code" | "settings">("code");
  const [code, setCode] = useState(initialCode);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || "");
  const [category, setCategory] = useState(project.category);
  const [tags, setTags] = useState<string[]>((project.tags as string[]) || []);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState(project.visibility as "public" | "unlisted" | "private");
  const [isPinned, setIsPinned] = useState(project.isPinned);

  const [previewKey, setPreviewKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddTag = (t: string) => {
    const trimmed = t.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleSave = () => {
    setErrorMsg("");
    setSavedSuccess(false);

    startTransition(async () => {
      try {
        await updateProjectFullAction(project.id, {
          title,
          description,
          category,
          tags,
          visibility,
          isPinned,
          htmlCode: project.assetType === "single_html" ? code : undefined,
        });
        setSavedSuccess(true);
        setPreviewKey((k) => k + 1);
        setTimeout(() => setSavedSuccess(false), 3000);
      } catch (err: unknown) {
        setErrorMsg((err as Error)?.message || "保存失败");
      }
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden antialiased">
      {/* Top Header */}
      <header className="h-12 border-b border-border bg-background/95 backdrop-blur-xs px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground max-w-xs truncate">
              {title || "编辑单页"}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">/p/{project.slug}</span>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center border border-border rounded-md p-0.5 bg-muted/40">
          <Button
            variant={activeTab === "code" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("code")}
            className="h-7 px-3 text-xs gap-1.5 rounded-sm"
          >
            <Code2 className="w-3.5 h-3.5" /> 代码与即时预览
          </Button>
          <Button
            variant={activeTab === "settings" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("settings")}
            className="h-7 px-3 text-xs gap-1.5 rounded-sm"
          >
            <Settings className="w-3.5 h-3.5" /> 项目元数据
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-7 text-xs">
            <Link href={`/p/${project.slug}`} target="_blank">
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>运行台</span>
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="h-7 text-xs"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>已保存</span>
              </>
            ) : isPending ? (
              <span>保存中...</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>保存修改</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {/* Main Tab View */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "code" ? (
          project.assetType === "single_html" ? (
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
              {/* Left: CodeMirror Editor */}
              <div className="h-full flex flex-col bg-neutral-950 overflow-hidden">
                <div className="h-8 px-4 border-b border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
                  <span className="font-mono flex items-center gap-1.5 text-[11px]">
                    <Code2 className="w-3 h-3 text-sky-400" /> {project.entryPath}
                  </span>
                  <span className="text-[11px]">快捷保存 Ctrl/Cmd+S</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <CodeMirror
                    value={code}
                    height="100%"
                    theme="dark"
                    extensions={[html()]}
                    onChange={(val) => setCode(val)}
                    className="text-xs h-full"
                  />
                </div>
              </div>

              {/* Right: Live Preview */}
              <div className="h-full flex flex-col bg-background overflow-hidden">
                <div className="h-8 px-4 border-b border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
                  <span className="text-[11px]">沙箱隔离实时预览</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => setPreviewKey((k) => k + 1)}
                  >
                    刷新预览
                  </Button>
                </div>
                <div className="flex-1 p-2 bg-neutral-950">
                  <iframe
                    key={previewKey}
                    src={`/raw/${project.slug}/`}
                    title="Live Preview"
                    sandbox="allow-scripts allow-forms allow-downloads allow-popups"
                    className="w-full h-full rounded-md bg-white border border-border"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
              <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">此项目为 Zip 多资源包</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                包含独立引用的相对路径图片与脚本资源，不支持单文件行内编辑。如需更新静态资源，请在发布页重新上传新的压缩包。
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => setActiveTab("settings")}
              >
                前往编辑项目元数据
              </Button>
            </div>
          )
        ) : (
          /* Settings Tab */
          <div className="h-full overflow-y-auto p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold text-foreground">
                  基本信息与展示属性
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">项目标题</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">简介描述</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent border border-input rounded-md p-2.5 text-xs text-foreground outline-none resize-none focus:border-ring"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">所属分类</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`flex items-center justify-center gap-1.5 p-2 rounded-md border text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-foreground text-background font-semibold border-foreground"
                              : "bg-muted/20 border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">标签管理</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[11px] gap-1 px-2 py-0.5">
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-destructive text-muted-foreground ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag(tagInput);
                        }
                      }}
                      placeholder="输入标签按回车..."
                      className="text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddTag(tagInput)}
                      className="text-xs shrink-0"
                    >
                      添加
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">公开状态</label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as "public" | "unlisted" | "private")}
                      className="w-full bg-muted/30 border border-input rounded-md px-3 h-8 text-xs text-foreground outline-none focus:border-ring"
                    >
                      <option value="public">公开 (Showcase 展示)</option>
                      <option value="unlisted">仅链接 (Unlisted)</option>
                      <option value="private">私有 (Private)</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2.5 h-8 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="rounded border-input text-foreground focus:ring-1 focus:ring-ring"
                      />
                      <span className="text-xs text-foreground font-medium">置顶到画廊前列</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
