"use client";

import { useState } from "react";
import { Terminal, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function ApiTokenGuideModal({ configuredTokens: _configuredTokens }: { configuredTokens?: string } = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const curlExample = `curl -X POST https://your-domain.com/api/upload \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -F "file=@artifact.html" \\
  -F "title=My AI Tool" \\
  -F "category=tools"`;

  const jsonExample = `curl -X POST https://your-domain.com/api/upload \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Calculator",
    "html": "<!DOCTYPE html><html>...</html>",
    "category": "tools"
  }'`;

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 text-xs gap-1.5 shrink-0"
      >
        <Terminal className="w-3.5 h-3.5" />
        <span>API 推送指南</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">API 自动化集成指南</DialogTitle>
            <DialogDescription className="text-xs">
              适合 Cursor、Claude Code 等 AI 工具在生成 HTML 后自动推送入库。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div>
              <div className="font-medium text-foreground mb-1">1. 身份鉴权 (Bearer Token)</div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                直接使用部署时设置的 <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">ADMIN_PASSWORD</code> 或自定义 <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">API_TOKEN</code>。
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground">2. cURL 文件上传</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  aria-label="复制 cURL 示例"
                  onClick={() => copyToClipboard("curl", curlExample)}
                >
                  {copiedKey === "curl" ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span className="ml-1">复制</span>
                </Button>
              </div>
              <pre className="p-3 rounded-md bg-neutral-950 font-mono text-[11px] text-neutral-300 overflow-x-auto border border-border">
                {curlExample}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground">3. JSON 直接推送 (供 AI 自动化代码流)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] px-2"
                  aria-label="复制 JSON 示例"
                  onClick={() => copyToClipboard("json", jsonExample)}
                >
                  {copiedKey === "json" ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span className="ml-1">复制</span>
                </Button>
              </div>
              <pre className="p-3 rounded-md bg-neutral-950 font-mono text-[11px] text-neutral-300 overflow-x-auto border border-border">
                {jsonExample}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
