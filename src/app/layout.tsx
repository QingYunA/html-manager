import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n/context";
import { Analytics } from "@vercel/analytics/next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pagepod - Host & Run AI HTML Artifacts, Web Apps & Tools",
    template: "%s | Pagepod",
  },
  description:
    "Instant zero-config hosting and discovery platform for Claude Artifacts, ChatGPT Canvas and AI-generated single-page HTML apps. Safe sandbox isolation with 0 egress bandwidth cost.",
  keywords: [
    "Claude Artifacts hosting",
    "ChatGPT Canvas HTML runner",
    "AI HTML showcase",
    "run HTML artifacts online",
    "single page app hosting",
    "HTML tool runner",
    "Pagepod",
  ],
  authors: [{ name: "Pagepod Team" }],
  creator: "Pagepod",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: siteUrl,
    siteName: "Pagepod",
    title: "Pagepod - Host & Run AI HTML Artifacts Online",
    description:
      "Instant zero-config hosting and discovery platform for Claude Artifacts, ChatGPT Canvas and AI-generated single-page apps.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pagepod - Host & Run AI HTML Artifacts Online",
    description:
      "Instant zero-config hosting and discovery platform for Claude Artifacts, ChatGPT Canvas and AI-generated single-page apps.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const rootJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Pagepod",
  url: siteUrl,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "All",
  description:
    "Instant zero-config hosting and discovery platform for Claude Artifacts, ChatGPT Canvas and AI-generated single-page HTML apps.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
      </head>
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
        <Analytics />
      </body>
    </html>
  );
}
