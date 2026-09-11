import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/lib/i18n/context";
import { Analytics } from "@vercel/analytics/next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

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
    languages: {
      "en-US": "/",
      "zh-CN": "/",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/pagepod-logo-monochrome.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
    <html lang="en" suppressHydrationWarning className="h-full antialiased overflow-x-hidden w-full max-w-full">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans overflow-x-hidden w-full max-w-full">
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
