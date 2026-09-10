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
  Pin,
  Tag,
  Globe,
  EyeOff,
  Lock,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import type { Project } from "@/db/schema";
import { updateProjectFullAction } from "@/app/actions/edit";

interface EditorClientProps {
  project: Project;
  initialCode: string;
}

const CATEGORIES = [
  { id: "tools", label: "实用工具", icon: "🛠️" },
  { id: "games", label: "互动游戏", icon: "🎮" },
  { id: "visualization", label: "数据可视化", icon: "📊" },
  { id: "prototypes", label: "页面原型", icon: "📱" },
  { id: "animations", label: "动效演示", icon: "✨" },
  { id: "others", label: "综合其他", icon: "📦" },
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
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top action header */}
      <header className="h-14 border-b border-slate-850 bg-slate-900/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white max-w-xs sm:max-w-sm truncate">
              {title || "编辑项目"}
            </span>
            <span className="text-xs font-mono text-slate-500">/p/{project.slug}</span>
          </div>
        </div>

        {/* Center view tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "code"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" /> 代码与即时预览
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> 项目属性与展示
          </button>
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/p/${project.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">打开运行台</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-medium shadow-md shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>已保存</span>
              </>
            ) : isPending ? (
              <span>正在保存...</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>保存修改</span>
              </>
            )}
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMsg}
        </div>
      )}

      {/* Main Tab Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "code" ? (
          project.assetType === "single_html" ? (
            <div className="h-full grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-850">
              {/* Left: Code Editor */}
              <div className="h-full flex flex-col bg-slate-950 overflow-hidden">
                <div className="h-9 px-4 border-b border-slate-850 flex items-center justify-between text-xs text-slate-400 bg-slate-900/50">
                  <span className="font-mono flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" /> index.html
                  </span>
                  <span className="text-[11px] text-slate-500">修改后点击上方保存即可生效</span>
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
              <div className="h-full flex flex-col bg-slate-900 overflow-hidden">
                <div className="h-9 px-4 border-b border-slate-850 flex items-center justify-between text-xs text-slate-400 bg-slate-900/50">
                  <span className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" /> 沙箱即时预览
                  </span>
                  <button
                    onClick={() => setPreviewKey((k) => k + 1)}
                    className="text-[11px] text-indigo-400 hover:underline cursor-pointer"
                  >
                    刷新预览
                  </button>
                </div>
                <div className="flex-1 p-2 bg-slate-950/60">
                  <iframe
                    key={previewKey}
                    src={`/raw/${project.slug}/`}
                    title="Live Preview"
                    sandbox="allow-scripts allow-forms allow-downloads allow-popups"
                    className="w-full h-full rounded-xl bg-white border border-slate-800"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950">
              <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 mb-4">
                <Code2 className="w-10 h-10" />
              </div>
              <h3 className="text-base font-semibold text-white">此项目为 Zip 静态多资源包</h3>
              <p className="text-xs text-slate-400 max-w-md mt-2">
                包含多个引用的图片、CSS、JS等子资源，在线单文件编辑器不可用。如需更新静态资源，请在发布页重新上传新的
                Zip 包。
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setActiveTab("settings")}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl"
                >
                  去配置项目元数据
                </button>
              </div>
            </div>
          )
        ) : (
          /* Settings Tab */
          <div className="h-full overflow-y-auto p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-white">基本信息</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">项目标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-750 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">简介描述</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-750 focus:border-indigo-500 rounded-xl p-3 text-sm text-white outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">所属分类</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                        category === cat.id
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-750"
                      }`}
                    >
                      <span className="text-xl mb-1">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">标签管理</label>
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
                        className="hover:text-rose-400 text-slate-400 transition-colors cursor-pointer"
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
                    placeholder="输入标签按回车..."
                    className="flex-1 bg-slate-950/80 border border-slate-750 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTag(tagInput)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm rounded-xl transition cursor-pointer"
                  >
                    添加
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-850">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">公开状态</label>
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
                      <Globe className="w-3.5 h-3.5" /> 公开
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
                      <EyeOff className="w-3.5 h-3.5" /> 仅链接
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
                      <Lock className="w-3.5 h-3.5" /> 私有
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
                      <div className="text-xs text-slate-500">在画廊列表优先展示</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
