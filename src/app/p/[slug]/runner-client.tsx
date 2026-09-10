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
  Copy,
  Info,
  Layers,
} from "lucide-react";
import type { Project } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
      className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden select-none antialiased"
    >
      {/* Top Floating Runner Toolbar */}
      <header className="h-12 border-b border-border bg-background/95 backdrop-blur-xs px-3 sm:px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/" title="返回画廊">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="text-xs font-semibold text-foreground truncate max-w-[140px] sm:max-w-xs md:max-w-sm">
              {project.title}
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px] px-1.5 py-0">
              {project.category}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setShowInfo(!showInfo)}
              title="查看详情"
            >
              <Info className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Center: Device Switcher */}
        <div className="flex items-center border border-border rounded-md p-0.5 bg-muted/40">
          <Button
            variant={device === "desktop" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 rounded-sm"
            onClick={() => setDevice("desktop")}
            title="桌面全宽 (100%)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">桌面</span>
          </Button>

          <Button
            variant={device === "tablet" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 rounded-sm"
            onClick={() => setDevice("tablet")}
            title="平板模式 (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">平板 (768px)</span>
          </Button>

          <Button
            variant={device === "mobile" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 rounded-sm"
            onClick={() => setDevice("mobile")}
            title="手机模式 (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">手机 (375px)</span>
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setReloadKey((k) => k + 1)}
            title="刷新页面"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>

          {project.assetType === "single_html" && (
            <Button
              variant={showCode ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCode(true)}
              title="查看 HTML 源码"
            >
              <Code2 className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleCopyLink}
            title="复制分享链接"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
            <a href={rawUrl} target="_blank" rel="noopener noreferrer" title="在新标签页中纯净打开">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleFullscreen}
            title={isFullscreen ? "退出全屏" : "全屏模式"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </header>

      {/* Info Popover Banner */}
      {showInfo && (
        <div className="bg-muted/60 border-b border-border px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground z-10">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <div>
              <span className="text-muted-foreground">分类：</span>
              <span className="text-foreground font-medium">{project.category}</span>
            </div>
            <div>
              <span className="text-muted-foreground">直链地址：</span>
              <code className="text-foreground font-mono bg-muted px-1 py-0.5 rounded">{rawUrl}</code>
            </div>
            {project.description && (
              <div className="max-w-md truncate">
                <span className="text-muted-foreground">简介：</span>
                <span className="text-foreground">{project.description}</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowInfo(false)}>
            收起
          </Button>
        </div>
      )}

      {/* Viewport Canvas */}
      <div className="flex-1 bg-neutral-950 flex items-center justify-center p-0 sm:p-4 overflow-hidden relative">
        <div
          className={`h-full transition-all duration-200 flex flex-col ${
            device === "desktop"
              ? "w-full max-w-none"
              : device === "tablet"
              ? "w-[768px] max-w-full rounded-xl shadow-2xl border border-border overflow-hidden my-auto h-[95%]"
              : "w-[375px] max-w-full rounded-[32px] shadow-2xl border-4 border-neutral-800 overflow-hidden my-auto h-[95%]"
          }`}
        >
          {device === "mobile" && (
            <div className="h-5 bg-neutral-900 flex items-center justify-center shrink-0 border-b border-neutral-800">
              <div className="w-14 h-2.5 bg-neutral-950 rounded-full" />
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

      {/* Source Code Modal (Radix Dialog) */}
      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 border-border bg-card">
          <DialogHeader className="p-3.5 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-xs font-mono font-medium">
                {project.entryPath}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                HTML 源代码查看器
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-6">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleCopyCode}>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "已复制" : "复制源码"}</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 p-4 overflow-auto bg-neutral-950 font-mono text-xs text-neutral-300">
            <pre className="leading-relaxed whitespace-pre-wrap selection:bg-neutral-700">
              {initialSourceCode}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
