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
  ShieldCheck,
  Lock,
} from "lucide-react";
import type { Project } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { decryptArtifactToHtml, extractKeyFromUrlHash } from "@/lib/crypto/e2ee";

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

  // E2EE Decryption States
  const [decryptedHtml, setDecryptedHtml] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(project.isEncrypted);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [manualKeyInput, setManualKeyInput] = useState("");

  const rawUrl = `/raw/${project.slug}/`;

  // Perform client-side decryption if encrypted
  const attemptDecryption = async (key: string) => {
    if (!project.isEncrypted || !project.encryptionIv) return;
    setIsDecrypting(true);
    setDecryptError(null);

    try {
      // 1. Fetch encrypted binary from storage endpoint
      const res = await fetch(rawUrl);
      if (!res.ok) throw new Error(`无法获取密文数据 (状态码: ${res.status})`);
      const ciphertextBuffer = await res.arrayBuffer();

      // 2. Decrypt locally in browser memory
      const html = await decryptArtifactToHtml(
        new Uint8Array(ciphertextBuffer),
        key,
        project.encryptionIv
      );

      setDecryptedHtml(html);
      setIsDecrypting(false);
    } catch (err: unknown) {
      console.error("Decryption failed:", err);
      setDecryptError("解密失败：提供的密钥不匹配或数据已被篡改");
      setIsDecrypting(false);
    }
  };

  useEffect(() => {
    if (project.isEncrypted) {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const extractedKey = extractKeyFromUrlHash(hash);
      if (extractedKey) {
        attemptDecryption(extractedKey);
      } else {
        setIsDecrypting(false);
      }
    }
  }, [project.isEncrypted, reloadKey]);

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
    const codeToCopy = decryptedHtml || initialSourceCode;
    if (!codeToCopy) return;
    navigator.clipboard.writeText(codeToCopy);
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
            {project.isEncrypted ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 text-emerald-500 border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                <span>E2EE 加密</span>
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

          <Button
            variant={showCode ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setShowCode(true)}
            title="查看 HTML 源码"
          >
            <Code2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleCopyLink}
            title="复制分享链接"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </Button>

          {!project.isEncrypted && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
              <a href={rawUrl} target="_blank" rel="noopener noreferrer" title="在新标签页中纯净打开">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          )}

          <ThemeToggle />

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
              <span className="text-muted-foreground">加密状态：</span>
              <span className="text-foreground font-medium">{project.isEncrypted ? "🔒 零知识端到端加密" : "明文直出"}</span>
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
            {project.isEncrypted ? (
              decryptedHtml ? (
                /* Decrypted In-Memory HTML Sandbox (Zero network plain leak) */
                <iframe
                  key={reloadKey}
                  srcDoc={decryptedHtml}
                  title={project.title}
                  sandbox="allow-scripts allow-forms allow-downloads allow-popups"
                  className="w-full h-full border-0"
                />
              ) : (
                /* Locked Prompt if Key missing or Decrypting */
                <div className="w-full h-full flex flex-col items-center justify-center bg-background text-foreground p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground mb-3 border border-border">
                    <Lock className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h2 className="text-sm font-semibold">此单页受端到端零知识加密保护</h2>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
                    {isDecrypting
                      ? "正在使用 URL Hash 中的私密密钥在浏览器内存中解密..."
                      : decryptError || "未在链接中检测到解密密钥。请输入专属密钥解密并运行："}
                  </p>

                  {!isDecrypting && (
                    <div className="flex items-center gap-2 max-w-xs w-full">
                      <input
                        type="text"
                        value={manualKeyInput}
                        onChange={(e) => setManualKeyInput(e.target.value)}
                        placeholder="输入 32 字节 Base64 密钥..."
                        className="flex-1 bg-muted/40 border border-input rounded-md px-2.5 h-8 text-xs font-mono outline-none"
                      />
                      <Button
                        size="sm"
                        onClick={() => attemptDecryption(manualKeyInput.trim())}
                        className="h-8 text-xs"
                      >
                        解密运行
                      </Button>
                    </div>
                  )}
                </div>
              )
            ) : (
              /* Regular Unencrypted Sandbox */
              <iframe
                key={reloadKey}
                src={rawUrl}
                title={project.title}
                sandbox="allow-scripts allow-forms allow-downloads allow-popups"
                className="w-full h-full border-0"
              />
            )}
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
                {project.isEncrypted ? "已在客户端本地内存完成解密的源代码" : "HTML 源代码查看器"}
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
              {decryptedHtml || initialSourceCode || (project.isEncrypted ? "密文未解密或无法提取" : "无法获取源码")}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
