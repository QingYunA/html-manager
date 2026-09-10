import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HTML Manager - AI Artifacts 托管与发现画廊",
  description: "专为 AI 生成的 HTML / 单页应用打造的开源自建托管与展示平台。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
