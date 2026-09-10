"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileCode2,
  FolderArchive,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Layers,
  Wrench,
  Gamepad2,
  BarChart3,
  Smartphone,
  Sparkles,
  X,
  Upload,
  ShieldCheck,
  Key,
  Copy,
  Check,
} from "lucide-react";
import { handleUploadAction } from "@/app/actions/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { encryptArtifact, encryptWithRawKey } from "@/lib/crypto/e2ee";

const CATEGORIES = [
  { id: "tools", label: "实用工具", icon: Wrench },
  { id: "games", label: "互动游戏", icon: Gamepad2 },
  { id: "visualization", label: "数据可视化", icon: BarChart3 },
  { id: "prototypes", label: "页面原型", icon: Smartphone },
  { id: "animations", label: "动效演示", icon: Sparkles },
  { id: "others", label: "其他", icon: Layers },
];

const SUGGESTED_TAGS = ["Canvas", "SVG", "Three.js", "Tailwind", "Vue", "React", "WebAudio", "ECharts"];

export default function AdminUploadPage() {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pasteContent, setPasteContent] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("tools");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [isPinned, setIsPinned] = useState(false);

  // E2EE States
  const [enableE2EE, setEnableE2EE] = useState(false);
  const [e2eeKeyResult, setE2eeKeyResult] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const tryExtractFromHtml = (html: string) => {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const descMatch =
      html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
      html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);

    if (titleMatch && titleMatch[1]) {
      const extractedTitle = titleMatch[1].trim();
      if (extractedTitle) {
        setTitle(extractedTitle);
        const autoSlug = extractedTitle
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .slice(0, 30);
        if (autoSlug) setSlug(autoSlug);
      }
    }

    if (descMatch && descMatch[1]) {
      setDescription(descMatch[1].trim());
    }
  };

  const processFile = async (selected: File) => {
    if (!selected) return;
    setFile(selected);
    setErrorMessage("");

    const ext = selected.name.toLowerCase();
    if (ext.endsWith(".html") || ext.endsWith(".htm")) {
      try {
        const text = await selected.text();
        tryExtractFromHtml(text);
      } catch {
        const baseName = selected.name.replace(/\.[^/.]+$/, "");
        if (!title) setTitle(baseName);
        if (!slug) setSlug(baseName.toLowerCase().replace(/[^\w-]/g, "-"));
      }
    } else {
      const baseName = selected.name.replace(/\.[^/.]+$/, "");
      if (!title) setTitle(baseName);
      if (!slug) setSlug(baseName.toLowerCase().replace(/[^\w-]/g, "-"));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      await processFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      await processFile(droppedFiles[0]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    let finalTitle = title.trim();
    let finalSlug = slug.trim();

    if (mode === "file") {
      if (!file) {
        setErrorMessage("请先选择或拖拽要上传的文件（.html 或 .zip）");
        return;
      }
      if (!finalTitle) {
        finalTitle = file.name.replace(/\.[^/.]+$/, "");
      }
    } else {
      if (!pasteContent.trim()) {
        setErrorMessage("请输入或粘贴 HTML 源代码");
        return;
      }
      if (!finalTitle) {
        finalTitle = "未命名 HTML 项目";
      }
    }

    if (!finalSlug) {
      finalSlug = finalTitle
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-") || "project";
    }

    startTransition(async () => {
      try {
        let preUploadedStoragePath = "";
        let encryptionIv = "";

        // 1. If E2EE enabled: Encrypt in memory first
        if (enableE2EE) {
          let rawBytes: Uint8Array;
          if (mode === "file" && file) {
            const buf = await file.arrayBuffer();
            rawBytes = new Uint8Array(buf);
          } else {
            rawBytes = new TextEncoder().encode(pasteContent);
          }

          // Request S3 Presigned direct PUT URL from server (which also supplies the user-scoped master key if authenticated)
          const presignRes = await fetch("/api/upload/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug: finalSlug,
              filename: "bundle.enc",
              contentType: "application/octet-stream",
              isEncrypted: true,
            }),
          });

          if (!presignRes.ok) {
            throw new Error("Failed to get presigned upload URL from storage");
          }

          const presignData = await presignRes.json();
          if (!presignData.uploadUrl) {
            throw new Error(presignData.error || "Presigned URL error");
          }

          let encryptedCiphertext: Uint8Array;
          if (presignData.userKey) {
            // Seamless encryption bound to user master key
            const res = await encryptWithRawKey(rawBytes, presignData.userKey);
            encryptedCiphertext = res.ciphertext;
            encryptionIv = res.ivBase64;
          } else {
            const res = await encryptArtifact(rawBytes);
            encryptedCiphertext = res.ciphertext;
            encryptionIv = res.ivBase64;
            setE2eeKeyResult(res.keyBase64);
          }

          // Direct PUT to Cloudflare R2 / S3 storage (zero server bandwidth consumption)
          const uploadRes = await fetch(presignData.uploadUrl, {
            method: presignData.uploadMethod || "PUT",
            headers: { "Content-Type": "application/octet-stream" },
            body: new Blob([encryptedCiphertext as unknown as BlobPart]),
          });

          if (!uploadRes.ok) {
            throw new Error("Direct storage PUT upload failed");
          }

          preUploadedStoragePath = presignData.storagePath;
        }

        // 2. Submit metadata to server action
        const formData = new FormData();
        formData.append("uploadType", mode);
        formData.append("title", finalTitle);
        formData.append("slug", finalSlug);
        formData.append("description", description);
        formData.append("category", category);
        formData.append("tags", tags.join(","));
        formData.append("visibility", visibility);
        formData.append("isPinned", String(isPinned));

        if (enableE2EE) {
          formData.append("isEncrypted", "true");
          formData.append("encryptionIv", encryptionIv);
          formData.append("preUploadedStoragePath", preUploadedStoragePath);
        } else {
          if (mode === "file" && file) {
            formData.append("file", file);
          } else {
            formData.append("htmlContent", pasteContent);
          }
        }

        const res = await handleUploadAction(null, formData);
        if (res.error) {
          setErrorMessage(res.error);
        } else if (res.success && res.slug) {
          setSuccessSlug(res.slug);
        }
      } catch (err: unknown) {
        setErrorMessage((err as Error)?.message || "发布过程中出现异常，请重试");
      }
    });
  };

  const handleCopySecretUrl = () => {
    if (!successSlug) return;
    const fullUrl = e2eeKeyResult
      ? `${window.location.origin}/p/${successSlug}#key=${e2eeKeyResult}`
      : `${window.location.origin}/p/${successSlug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 antialiased">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground">
            <Link href="/admin">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 返回项目列表
            </Link>
          </Button>
          <Badge variant="outline" className="text-[10px] font-mono">
            upload hub
          </Badge>
        </div>

        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            发布与托管 HTML
          </h1>
          <p className="text-xs text-muted-foreground">
            支持单文件 HTML 拖拽上传、静态资源 Zip 压缩包自动平铺解压，或直接粘贴 AI 产出的源代码。
          </p>
        </div>

        {successSlug ? (
          <Card className="border-border p-8 text-center space-y-4">
            <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">发布成功！</h2>
              <p className="text-xs text-muted-foreground">
                已分配专属独立沙箱路由：
                <code className="mx-1 px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">
                  /p/{successSlug}
                </code>
              </p>
            </div>

            {/* E2EE Secret Link Banner if manual key */}
            {enableE2EE && (
              <div className="p-4 rounded-lg bg-muted/60 border border-border text-left space-y-2 max-w-md mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> 用户级安全加密保险箱
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] gap-1 px-2"
                    onClick={handleCopySecretUrl}
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey ? "已复制" : "复制直链"}</span>
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {e2eeKeyResult
                    ? "解密密钥保存在 URL Hash 中，绝不发送给服务器。"
                    : "已绑定当前用户级认证凭证，登录账号即可无感打开并运行，无需任何手动输入！"}
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-2">
              <Button size="sm" asChild>
                <Link href={e2eeKeyResult ? `/p/${successSlug}#key=${e2eeKeyResult}` : `/p/${successSlug}`}>
                  立即在运行台体验
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSuccessSlug(null);
                  setE2eeKeyResult(null);
                  setFile(null);
                  setPasteContent("");
                  setTitle("");
                  setSlug("");
                  setDescription("");
                  setTags([]);
                }}
              >
                继续上传下一个
              </Button>
            </div>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Type Selector using Tabs */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as "file" | "paste")}>
              <TabsList className="grid grid-cols-2 w-full h-9">
                <TabsTrigger value="file" className="gap-1.5 text-xs">
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>上传文件 (.html / .zip)</span>
                </TabsTrigger>
                <TabsTrigger value="paste" className="gap-1.5 text-xs">
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>直接粘贴代码</span>
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: FILE DROPZONE */}
              <TabsContent value="file" className="mt-3">
                <Card>
                  <CardContent className="p-4">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer text-center transition-all ${
                        isDragging
                          ? "border-primary bg-accent/50 scale-[1.01]"
                          : "border-border hover:border-foreground/40 bg-muted/10 hover:bg-muted/30"
                      }`}
                    >
                      <UploadCloud className={`w-10 h-10 mb-2 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-xs font-medium text-foreground">
                        {isDragging ? "松开鼠标即可上传该文件" : "点击选择 或 直接将文件拖拽至此处"}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        支持单个 <code className="font-mono text-foreground font-semibold">.html</code> 或包含子资源的 <code className="font-mono text-foreground font-semibold">.zip</code> 压缩包
                      </p>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-4 text-xs gap-1.5 pointer-events-none"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>浏览本地文件</span>
                      </Button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".html,.htm,.zip"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </div>

                    {file && (
                      <div className="mt-3 flex items-center justify-between p-3 bg-muted/40 border border-border rounded-md text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-foreground shrink-0" />
                          <span className="font-medium text-foreground truncate">{file.name}</span>
                          <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-[10px] text-emerald-500 font-normal">
                            已就绪
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                            }}
                            title="移除文件"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: DIRECT PASTE */}
              <TabsContent value="paste" className="mt-3">
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>HTML 源代码</span>
                      <span>粘贴后将自动抽取 &lt;title&gt; 作为标题</span>
                    </div>
                    <textarea
                      rows={9}
                      value={pasteContent}
                      onChange={(e) => handlePasteChange(e.target.value)}
                      placeholder="<!DOCTYPE html><html>... 在此粘贴 AI 编写的 HTML 代码"
                      className="w-full bg-neutral-950 border border-border rounded-md p-3 font-mono text-xs text-neutral-200 outline-none resize-y focus:border-ring transition-colors"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* User-level Seamless Encryption Banner */}
            <Card className="border-border bg-card">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-muted text-foreground shrink-0 mt-0.5 border border-border">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        端到端加密保护 (Zero-Knowledge E2EE)
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        无感安全体验
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      启用后，HTML 在离开浏览器前通过 AES-GCM 256 密文直传 R2 存储。拥有者登录后可无感直接查看与运行，外部访问需持授权链接。
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={enableE2EE}
                    onChange={(e) => setEnableE2EE(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-foreground"></div>
                </label>
              </CardContent>
            </Card>

            {/* Metadata Card */}
            <Card>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold text-foreground">
                  项目属性与展示设置
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      项目标题
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={file ? file.name.replace(/\.[^/.]+$/, "") : "例如：2048 小游戏"}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      短链接路由 Slug
                    </label>
                    <div className="flex items-center rounded-md border border-input bg-transparent px-2.5 h-8 text-xs">
                      <span className="text-muted-foreground font-mono text-[11px] mr-1">/p/</span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="game-2048"
                        className="w-full bg-transparent text-foreground outline-none font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    简介描述（可选）
                  </label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简要概括单页的功能或操作指南"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    所属分类
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
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

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">
                    标签 (Tags)
                  </label>
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
                      placeholder="输入标签按回车添加..."
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
                  <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                    <span>推荐标签：</span>
                    {SUGGESTED_TAGS.map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleAddTag(st)}
                        className="hover:text-foreground transition-colors cursor-pointer"
                      >
                        #{st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visibility and Pin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">
                      公开访问状态
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as "public" | "unlisted" | "private")}
                      className="w-full bg-muted/30 border border-input rounded-md px-3 h-8 text-xs text-foreground outline-none focus:border-ring"
                    >
                      <option value="public">公开 (Showcase 画廊展示)</option>
                      <option value="unlisted">仅链接可见 (Unlisted)</option>
                      <option value="private">私有 (仅自己可见)</option>
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

            {errorMessage && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-9 text-xs font-medium"
            >
              {isPending ? "正在处理并保存..." : "立即保存并发布"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
