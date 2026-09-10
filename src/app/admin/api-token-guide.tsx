"use client";

import { useState } from "react";
import { Key, Copy, Check, Terminal, ExternalLink, X } from "lucide-react";

export default function ApiTokenGuideModal({ configuredTokens }: { configuredTokens: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition flex items-center gap-1.5 shrink-0 cursor-pointer"
      >
        <Terminal className="w-3.5 h-3.5" />
        <span>查看 API 推送指南</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">API 自动化集成指南</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div>
                <h4 className="font-semibold text-white mb-1">1. 身份鉴权 (Bearer Token)</h4>
                <p className="text-slate-400">
                  你可以直接使用部署时设置的 <code className="text-indigo-300">ADMIN_PASSWORD</code> 作为 Bearer Token，或者在环境变量中指定 <code className="text-indigo-300">API_TOKEN</code>。
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-semibold text-white">2. cURL 文件直接上传</h4>
                  <button
                    onClick={() => copyToClipboard(curlExample)}
                    className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>复制</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
                  {curlExample}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-semibold text-white">3. JSON 代码直接推送 (供 Cursor / AI Agent)</h4>
                  <button
                    onClick={() => copyToClipboard(jsonExample)}
                    className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 text-[11px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>复制</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
                  {jsonExample}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px]">
                💡 <strong>响应格式</strong>：接口将返回{" "}
                <code className="text-white font-mono">{`{"success": true, "slug": "...", "url": "https://.../p/..."}`}</code>
                ，AI 可在生成 HTML 后直接输出直达访问链接！
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
              >
                知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
