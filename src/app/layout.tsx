import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "Pagepod - AI Artifacts 托管与发现画廊",
  description: "专为 AI 生成的 HTML / 单页应用打造的开源自建托管与展示平台。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
