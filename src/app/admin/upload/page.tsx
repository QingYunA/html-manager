"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UploadCloud,
  FileCode2,
  FolderArchive,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Tag,
  Globe,
  Lock,
  EyeOff,
  Pin,
  FileText,
} from "lucide-react";
import { handleUploadAction } from "@/app/actions/upload";

const CATEGORIES = [
  { id: "tools", label: "实用工具", icon: "🛠️" },
  { id: "games", label: "互动游戏", icon: "🎮" },
  { id: "visualization", label: "数据可视化", icon: "📊" },
  { id: "prototypes", label: "页面原型", icon: "📱" },
  { id: "animations", label: "动效演示", icon: "✨" },
  { id: "others", label: "综合其他", icon: "📦" },
];

const SUGGESTED_TAGS = ["Canvas", "SVG", "Three.js", "Tailwind", "Vue", "React", "WebAudio", "ECharts"];

export default function AdminUploadPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [pasteContent, setPasteContent] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("tools");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [isPinned, setIsPinned] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successSlug, setSuccessSlug] = useState<string | null>(null);
  const [autoExtracted, setAutoExtracted] = useState(false);

  // Client-side HTML title extraction helper
  const tryExtractFromHtml = (html: string) => {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch =
      html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);

    if (titleMatch && titleMatch[1]) {
      const extractedTitle = titleMatch[1].trim();
      if (extractedTitle && (!title || autoExtracted)) {
        setTitle(extractedTitle);
        if (!slug || autoExtracted) {
          const autoSlug = extractedTitle
            .toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .slice(0, 30);
          if (autoSlug) setSlug(autoSlug);
        }
        setAutoExtracted(true);
      }
    }

    if (descMatch && descMatch[1] && (!description || autoExtracted)) {
      setDescription(descMatch[1].trim());
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setErrorMessage("");

    if (selected.name.endsWith(".html") || selected.name.endsWith(".htm")) {
      const text = await selected.text();
      tryExtractFromHtml(text);
    } else {
      const baseName = selected.name.replace(/\.[^/.]+$/, "");
      if (!title) setTitle(baseName);
      if (!slug) setSlug(baseName.toLowerCase().replace(/[^\w-]/g, "-"));
    }
  };

  const handlePasteChange = (val: string) => {
    setPasteContent(val);
    if (val.includes("<html") || val.includes("<title")) {
      tryExtractFromHtml(val);
    }
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const formData = new FormData();
    formData.append("uploadType", mode);
    formData.append("title", title);
    formData.append("slug", slug);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("tags", tags.join(","));
    formData.append("visibility", visibility);
    formData.append("isPinned", String(isPinned));

    if (mode === "file") {
      if (!file) {
        setErrorMessage("请先选择或拖拽要上传的文件");
        return;
      }
      formData.append("file", file);
    } else {
      if (!pasteContent.trim()) {
        setErrorMessage("请输入或粘贴 HTML 代码");
        return;
      }
      formData.append("htmlContent", pasteContent);
    }

    startTransition(async () => {
      const res = await handleUploadAction(null, formData);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.success && res.slug) {
        setSuccessSlug(res.slug);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-850">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 返回管理列表
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>HTML Manager v1.0</span>
          </div>
        </div>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <UploadCloud className="w-8 h-8 text-indigo-400" />
            发布与录入 HTML
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            支持单文件 HTML 拖拽上传、静态资源 Zip 压缩包自动解压，或直接粘贴 AI 生成的代码。
          </p>
        </div>

        {successSlug ? (
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">发布成功！</h2>
            <p className="text-sm text-slate-300">
              项目已安全入库并分配路由：
              <code className="mx-1 px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono">
                /p/{successSlug}
              </code>
            </p>
            <div className="pt-4 flex flex-wrap gap-3 justify-center">
              <Link
                href={`/p/${successSlug}`}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-indigo-600/30"
              >
                立即在运行台体验
              </Link>
              <button
                onClick={() => {
                  setSuccessSlug(null);
                  setFile(null);
                  setPasteContent("");
                  setTitle("");
                  setSlug("");
                  setDescription("");
                  setTags([]);
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl transition"
              >
                继续上传下一个
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Input method selector */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode("file")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition cursor-pointer ${
                  mode === "file"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FolderArchive className="w-4 h-4" /> 上传文件 (.html / .zip)
              </button>
              <button
                type="button"
                onClick={() => setMode("paste")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition cursor-pointer ${
                  mode === "paste"
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileCode2 className="w-4 h-4" /> 直接粘贴代码
              </button>
            </div>

            {/* Dropzone or Paste textarea */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              {mode === "file" ? (
                <div>
                  <label
                    htmlFor="file-upload"
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500/80 transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer text-center bg-slate-950/40 hover:bg-indigo-950/10 group"
                  >
                    <UploadCloud className="w-12 h-12 text-slate-500 group-hover:text-indigo-400 transition-colors mb-3" />
                    <p className="text-sm font-medium text-slate-200">
                      点击选择或直接将文件拖到这里
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      支持单个 <code className="text-indigo-400 font-mono">.html</code> 单页，或包含本地资源/图片的{" "}
                      <code className="text-indigo-400 font-mono">.zip</code> 静态压缩包
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".html,.htm,.zip"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {file && (
                    <div className="mt-4 flex items-center justify-between p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <span className="font-medium text-white">{file.name}</span>
                        <span className="text-xs text-slate-400">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium">已就绪</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      HTML 源代码
                    </label>
                    <span className="text-xs text-slate-500">自动解析网页标题与描述</span>
                  </div>
                  <textarea
                    rows={10}
                    value={pasteContent}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    placeholder="<!DOCTYPE html><html>... 在此粘贴 AI 编写的 HTML 代码"
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-indigo-500 rounded-xl p-4 font-mono text-xs text-slate-200 outline-none resize-y transition"
                  />
                </div>
              )}
            </div>

            {/* Metadata fields */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" /> 项目元数据与展示配置
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    项目标题 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setAutoExtracted(false);
                    }}
                    placeholder="例如：2048 小游戏"
                    className="w-full bg-slate-950/80 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    自定义短链接 Slug <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center bg-slate-950/80 border border-slate-700 focus-within:border-indigo-500 rounded-xl px-3 py-2 text-sm">
                    <span className="text-slate-500 font-mono text-xs mr-1">/p/</span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="game-2048"
                      className="w-full bg-transparent text-white outline-none font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  简介描述（可选）
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="简述这个单页的核心特性、操作说明或适用场景"
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  所属分类
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        category === cat.id
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <span className="text-xl mb-1">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  标签 (Tags)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs"
                    >
                      <Tag className="w-3 h-3" /> {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-rose-400 text-slate-400 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag(tagInput);
                      }
                    }}
                    placeholder="输入标签按回车添加..."
                    className="flex-1 bg-slate-950/80 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-xl transition"
                  >
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-xs text-slate-500">
                  <span>常用标签：</span>
                  {SUGGESTED_TAGS.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleAddTag(st)}
                      className="hover:text-indigo-400 transition-colors"
                    >
                      #{st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visibility and Pin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    公开访问状态
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility("public")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                        visibility === "public"
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                          : "bg-slate-950/40 border-slate-800 text-slate-400"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" /> 公开展示
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("unlisted")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                        visibility === "unlisted"
                          ? "bg-amber-500/20 border-amber-500 text-amber-300"
                          : "bg-slate-950/40 border-slate-800 text-slate-400"
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" /> 仅链接可见
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("private")}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                        visibility === "private"
                          ? "bg-rose-500/20 border-rose-500 text-rose-300"
                          : "bg-slate-950/40 border-slate-800 text-slate-400"
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" /> 仅自己可见
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <label
                    onClick={() => setIsPinned(!isPinned)}
                    className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition"
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isPinned ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-700"
                      }`}
                    >
                      {isPinned && <Pin className="w-3 h-3" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">置顶到画廊前列</div>
                      <div className="text-xs text-slate-500">优先展示在首页最显眼的位置</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 active:scale-[0.99] disabled:opacity-50 text-white font-medium rounded-xl shadow-xl shadow-indigo-500/25 transition flex items-center justify-center gap-2 cursor-pointer text-base"
            >
              {isPending ? (
                <span>正在上传与处理...</span>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" />
                  <span>立即保存并发布</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
