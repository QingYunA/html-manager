import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { HomeHeader } from "@/components/home-header";
import { SiteFooter } from "@/components/site-footer";
import PricingClient from "./pricing-client";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";

export const metadata: Metadata = {
  title: "Pricing & Plans - Free AI HTML Hosting & Pro Cloud",
  description:
    "Explore transparent pricing for Pagepod. Free tier for hosting Claude Artifacts & AI single-page apps. Pro tier with E2EE private vaults & custom domains.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing & Plans | Pagepod",
    description:
      "Simple, transparent pricing for AI creators. Free hosting for public HTML artifacts, Pro vaults with zero-knowledge encryption.",
    url: `${siteUrl}/pricing`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing & Plans | Pagepod",
    description:
      "Simple, transparent pricing for AI creators. Free hosting for public HTML artifacts, Pro vaults with zero-knowledge encryption.",
  },
};

export default async function PricingPage() {
  const currentUser = await getCurrentUser();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does Pagepod differ from traditional Vercel or GitHub Pages?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Pagepod is purpose-built for AI-generated single-page HTML artifacts (Claude Artifacts, ChatGPT Canvas, v0). No git repositories or npm install required. Drag, drop or paste code for instant sandboxed execution with live gallery discovery.",
        },
      },
      {
        "@type": "Question",
        name: "Are my private artifacts truly invisible to platform admins?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! With End-to-End Encrypted Private Vaults, files are encrypted directly in the user browser using Web Crypto AES-GCM-256 before storage. Admin accounts are physically blocked from viewing, listing, or decrypting your private artifacts.",
        },
      },
      {
        "@type": "Question",
        name: "Can I self-host Pagepod on my own servers for free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely! Pagepod is 100% open-source. You can clone the repository and deploy to Vercel and Supabase with zero infrastructure fees.",
        },
      },
      {
        "@type": "Question",
        name: "What file formats are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Single .html files, raw pasted HTML code, and .zip archives containing CSS, JS, and image assets. Relative references are automatically resolved.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-neutral-800 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HomeHeader currentUser={currentUser} />
      <main className="flex-1">
        <PricingClient />
      </main>
      <SiteFooter />
    </div>
  );
}
