"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { generateRecoveryKey, encryptWithKey, saveLocalProjectKey, bufferToBase64Url } from "@/lib/crypto/e2ee";

/**
 * One-time migration console for pre-existing `legacy-server` encrypted projects.
 *
 * Flow (all decryption/encryption happens in this browser):
 * 1. Fetch plaintext from the owner-gated legacy endpoint.
 * 2. Generate a fresh client-held recovery key.
 * 3. Re-encrypt locally and POST only ciphertext + public KDF params back.
 *
 * Disabled unless the server has ALLOW_LEGACY_MIGRATION=1 and ENCRYPTION_PEPPER set.
 */
export default function MigrateLegacyPage() {
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState<string>("");

  const handleMigrate = async () => {
    if (!slug.trim()) {
      setStatus("请输入需要迁移的项目 slug");
      return;
    }
    setBusy(true);
    setStatus("正在获取明文…");
    setNewKey("");

    try {
      const res = await fetch(`/api/migrate-legacy-encryption?slug=${encodeURIComponent(slug.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.plaintext) {
        throw new Error(data.error || "获取明文失败");
      }

      setStatus("正在本地重新加密…");
      const { keyBase64, key } = await generateRecoveryKey();
      const { ciphertext, ivBase64 } = await encryptWithKey(key, data.plaintext);

      const finalizeRes = await fetch("/api/migrate-legacy-encryption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          ciphertextBase64: bufferToBase64Url(ciphertext),
          ivBase64,
          keyMode: "zk-recovery",
        }),
      });
      const finalizeData = await finalizeRes.json();
      if (!finalizeRes.ok) {
        throw new Error(finalizeData.error || "迁移提交失败");
      }

      saveLocalProjectKey(slug.trim(), { keyMode: "zk-recovery", key: keyBase64 });
      setNewKey(keyBase64);
      setStatus("迁移完成。请立即保存下方的恢复密钥（仅显示一次）。");
    } catch (err: unknown) {
      setStatus(`迁移失败：${(err as Error)?.message || "未知错误"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>迁移旧版加密项目（真零知识）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            该工具仅用于将早期以服务端派生密钥加密的项目，迁移为浏览器持有密钥的零知识加密。
            需要服务端设置 <code>ALLOW_LEGACY_MIGRATION=1</code> 与 <code>ENCRYPTION_PEPPER</code>。
          </p>
          <div className="flex gap-2">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="项目 slug"
              aria-label="项目 slug"
            />
            <Button onClick={handleMigrate} disabled={busy}>
              {busy ? "迁移中…" : "开始迁移"}
            </Button>
          </div>
          {status && (
            <p className="text-xs text-foreground" role="alert">
              {status}
            </p>
          )}
          {newKey && (
            <div className="rounded-md border border-border bg-muted/40 p-3">
              <p className="text-[11px] text-muted-foreground mb-1">新恢复密钥（请妥善保存）</p>
              <code className="text-xs break-all">{newKey}</code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
