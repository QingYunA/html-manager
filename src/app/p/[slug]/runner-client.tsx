"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Code2,
  Share2,
  Check,
  X,
  Copy,
  Info,
  Sparkles,
} from "lucide-react";
import type { Project } from "@/db/schema";

interface RunnerClientProps {
  project: Project;
  initialSourceCode: string;
}

type DeviceMode = "desktop" | "tablet" | "mobile";

export default function RunnerClient({ project, initialSourceCode }: RunnerClientProps) {
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const rawUrl = `/raw/${project.slug}/`;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleCopyCode = () => {
    if (!initialSourceCode) return;
    navigator.clipboard.writeText(initialSourceCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none"
    >
      {/* Top Floating Runner Toolbar */}
      <header className="h-14 border-b border-slate-850 bg-slate-900/90 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between shrink-0 z-20">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="返回公开画廊"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs md:max-w-sm">
              {project.title}
            </h1>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-slate-400 hover:text-indigo-300 transition cursor-pointer p-1"
              title="查看项目详情"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Responsive Device Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            onClick={() => setDevice("desktop")}
            title="电脑端视图 (100%)"
            className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              device === "desktop"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">桌面端</span>
          </button>

          <button
            onClick={() => setDevice("tablet")}
            title="平板视图 (768px)"
            className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              device === "tablet"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">平板 (768px)</span>
          </button>

          <button
            onClick={() => setDevice("mobile")}
            title="手机端视图 (375px)"
            className={`p-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              device === "mobile"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">手机 (375px)</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            title="重新载入页面"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {project.assetType === "single_html" && (
            <button
              onClick={() => setShowCode(!showCode)}
              title="查看 HTML 源代码"
              className={`p-2 rounded-xl transition cursor-pointer ${
                showCode
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Code2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleCopyLink}
            title="复制分享链接"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="在新标签页独立打开 (纯净直链)"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "退出全屏" : "全屏运行"}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Info popover banner */}
      {showInfo && (
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-300 z-10 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-slate-500">分类：</span>
              <span className="text-white font-medium">{project.category}</span>
            </div>
            <div>
              <span className="text-slate-500">直链：</span>
              <code className="text-indigo-300 font-mono text-[11px]">{rawUrl}</code>
            </div>
            {project.description && (
              <div className="max-w-md truncate text-slate-400">
                <span className="text-slate-500">简介：</span>
                {project.description}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Canvas / Iframe Viewport Container */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-0 sm:p-4 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-300 flex flex-col ${
            device === "desktop"
              ? "w-full max-w-none"
              : device === "tablet"
              ? "w-[768px] max-w-full rounded-2xl shadow-2xl border-4 border-slate-800 overflow-hidden my-auto h-[95%]"
              : "w-[375px] max-w-full rounded-[36px] shadow-2xl border-8 border-slate-800 overflow-hidden my-auto h-[95%]"
          }`}
        >
          {/* Mobile notch / status bar decoration */}
          {device === "mobile" && (
            <div className="h-5 bg-slate-800 flex items-center justify-center shrink-0">
              <div className="w-16 h-3 bg-slate-900 rounded-full" />
            </div>
          )}

          <div className="flex-1 bg-white relative w-full h-full">
            <iframe
              key={reloadKey}
              src={rawUrl}
              title={project.title}
              sandbox="allow-scripts allow-forms allow-downloads allow-popups"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </div>

      {/* Code Viewer Modal */}
      {showCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="h-12 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span>{project.entryPath} 源代码查看</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制代码</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowCode(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-slate-200">
              <pre className="leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                {initialSourceCode}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
