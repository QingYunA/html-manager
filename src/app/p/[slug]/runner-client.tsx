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
  Lock,
  Code,
  Sparkles,
} from "lucide-react";
import type { Project } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/lib/i18n/context";
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
  isOwner?: boolean;
  relatedProjects?: Project[];
}

type DeviceMode = "desktop" | "tablet" | "mobile";

export default function RunnerClient({
  project,
  initialSourceCode,
  isOwner = false,
  relatedProjects = [],
}: RunnerClientProps) {
  const { t } = useLanguage();
  const [device, setDevice] = useState<DeviceMode>("desktop");
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
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
    const fullUrl = `${window.location.origin}/p/${project.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const embedSnippet = `<iframe src="${
    typeof window !== "undefined" ? window.location.origin : ""
  }/raw/${project.slug}/" width="100%" height="600" frameborder="0" sandbox="allow-scripts allow-forms allow-downloads allow-popups allow-modals" allow="fullscreen; clipboard-write" allowfullscreen></iframe>`;

  const isPrivate = project.visibility === "private";

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground select-none"
    >
      {/* Top Controls Bar */}
      <header className="h-12 border-b border-border px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 bg-background/95 backdrop-blur-xs z-10">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0" asChild>
            <Link href="/" title={t.runner.back}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="text-xs font-semibold text-foreground truncate max-w-[140px] sm:max-w-xs md:max-w-sm">
              {project.title}
            </h1>
            {isPrivate ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30">
                <Lock className="w-3 h-3" />
                <span>私有项目</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="hidden sm:inline-flex text-[10px] px-1.5 py-0">
                {project.category}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setShowInfo(!showInfo)}
              title={t.runner.details}
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
            title={t.runner.desktop}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">{t.runner.desktop}</span>
          </Button>

          <Button
            variant={device === "tablet" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 rounded-sm"
            onClick={() => setDevice("tablet")}
            title={t.runner.tablet}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">{t.runner.tablet}</span>
          </Button>

          <Button
            variant={device === "mobile" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 rounded-sm"
            onClick={() => setDevice("mobile")}
            title={t.runner.mobile}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">{t.runner.mobile}</span>
          </Button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setReloadKey((k) => k + 1)}
            title={t.runner.refresh}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant={showCode ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowCode(true)}
            title={t.runner.sourceCode}
          >
            <Code2 className="w-3.5 h-3.5" />
          </Button>

          {!isPrivate && (
            <Button
              variant={showEmbed ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setShowEmbed(true)}
              title={t.runner.embed}
            >
              <Code className="w-3.5 h-3.5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleCopyLink}
            title={t.runner.copyLink}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
            <a href={rawUrl} target="_blank" rel="noopener noreferrer" title={t.runner.openNewTab}>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>

          <LanguageToggle />
          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleFullscreen}
            title={isFullscreen ? t.runner.exitFullscreen : t.runner.fullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </header>

      {/* Info & Related Projects Popover Banner */}
      {showInfo && (
        <div className="bg-card/95 backdrop-blur-md border-b border-border px-4 py-3 flex flex-col gap-3 text-xs text-muted-foreground z-20 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <div>
                <span className="text-muted-foreground">{t.runner.category}</span>
                <span className="text-foreground font-medium">{project.category}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t.runner.status}</span>
                <span className="text-foreground font-medium">
                  {isPrivate ? (isOwner ? "私有 (所有者可访问)" : "私有保护") : t.runner.plainOutput}
                </span>
              </div>
              {project.description && (
                <div className="max-w-md truncate">
                  <span className="text-muted-foreground">{t.runner.description}</span>
                  <span className="text-foreground">{project.description}</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setShowInfo(false)}>
              {t.runner.close}
            </Button>
          </div>

          {/* Related Artifacts Showcase */}
          {relatedProjects.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-foreground mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{t.runner.relatedTitle}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {relatedProjects.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/p/${rel.slug}`}
                    className="p-2 rounded border border-border/60 bg-muted/20 hover:bg-muted/60 transition-colors flex flex-col gap-1"
                  >
                    <span className="text-[11px] font-medium text-foreground truncate">{rel.title}</span>
                    <span className="text-[10px] text-muted-foreground">{rel.category}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Viewport Canvas */}
      <div
        className={`flex-1 bg-background flex items-center justify-center overflow-hidden relative ${
          device === "desktop" ? "p-0" : "p-4 sm:p-6"
        }`}
      >
        <div
          className={`transition-all duration-200 flex flex-col ${
            device === "desktop"
              ? "w-full h-full max-w-none rounded-none border-0"
              : device === "tablet"
              ? "w-[768px] max-w-full rounded-xl shadow-lg border border-border overflow-hidden my-auto h-[95%] bg-card"
              : "w-[375px] max-w-full rounded-[28px] shadow-lg border border-border overflow-hidden my-auto h-[95%] bg-card"
          }`}
        >
          {device === "mobile" && (
            <div className="h-4 bg-muted/60 flex items-center justify-center shrink-0 border-b border-border">
              <div className="w-12 h-2 bg-border rounded-full" />
            </div>
          )}

          <div className="flex-1 bg-white relative w-full h-full">
            <iframe
              key={reloadKey}
              src={rawUrl}
              title={project.title}
              sandbox="allow-scripts allow-forms allow-downloads allow-popups allow-modals"
              allow="fullscreen; clipboard-write"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </div>
        </div>

        {/* Viral Badge */}
        <div className="absolute bottom-2.5 right-3 z-10 pointer-events-auto">
          <Link
            href="/"
            target="_blank"
            title="Hosted on Pagepod - Free AI HTML Artifact Sandbox"
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:animate-pulse" />
            <span>Hosted on <strong className="font-semibold text-foreground">Pagepod</strong></span>
          </Link>
        </div>
      </div>

      {/* Source Code Modal */}
      <Dialog open={showCode} onOpenChange={setShowCode}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 border-border bg-card">
          <DialogHeader className="p-3.5 border-b border-border flex flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-xs font-mono font-medium">
                {project.entryPath}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground">
                {t.runner.sourceCode}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 mr-6">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleCopyCode}>
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? t.runner.copied : t.runner.copySource}</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 p-4 overflow-auto bg-neutral-950 font-mono text-xs text-neutral-300">
            <pre className="leading-relaxed whitespace-pre-wrap selection:bg-neutral-700">
              {initialSourceCode || "暂无源代码"}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Embed Code Modal */}
      <Dialog open={showEmbed} onOpenChange={setShowEmbed}>
        <DialogContent className="max-w-xl border-border bg-card">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-500" />
              <span>{t.runner.embedTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t.runner.embedDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="relative rounded-lg bg-neutral-950 p-3 font-mono text-xs text-neutral-300 border border-border/40 overflow-x-auto selection:bg-neutral-700">
              <code>{embedSnippet}</code>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">包含安全沙箱隔离参数，可安全嵌入任意站点</span>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(embedSnippet);
                  setCopiedEmbed(true);
                  setTimeout(() => setCopiedEmbed(false), 2000);
                }}
              >
                {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmbed ? t.runner.copied : t.runner.copyEmbed}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
