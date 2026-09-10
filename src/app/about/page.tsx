import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { HomeHeader } from "@/components/home-header";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";
import { Shield, Sparkles, Terminal, Code2, Globe, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";

export const metadata: Metadata = {
  title: "About Pagepod - Mission & Architecture for AI Artifacts",
  description:
    "Learn about Pagepod, an open-source, self-hostable showcase and hosting platform tailored for AI-generated HTML single-page apps, interactive tools, and games.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Pagepod | Mission & Architecture",
    description:
      "Instant hosting platform tailored for Claude Artifacts, ChatGPT Canvas & AI-generated HTML single-page apps.",
    url: `${siteUrl}/about`,
    type: "website",
  },
};

export default async function AboutPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-neutral-800 selection:text-white">
      <HomeHeader currentUser={currentUser} />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        {/* Intro */}
        <div className="space-y-4 mb-12">
          <Badge variant="outline" className="px-3 py-0.5 text-xs font-mono">
            About Us & Mission
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            About Pagepod
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Pagepod was created to solve a modern developer problem: AI models like Claude, ChatGPT Canvas, and v0 generate incredible single-page applications, calculators, and games, but sharing them has been fragmented, clumsy, and difficult.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid sm:grid-cols-2 gap-5 mb-14">
          <div className="p-5 rounded-xl border border-border bg-card/60 space-y-2.5">
            <div className="p-2 rounded-lg bg-muted w-fit text-foreground">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Zero-Config Instant Execution</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No Git repos, no npm installs, and no multi-minute CI/CD pipelines. Paste HTML code or drop a zip bundle, and Pagepod serves it in an isolated sandbox within milliseconds.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card/60 space-y-2.5">
            <div className="p-2 rounded-lg bg-muted w-fit text-foreground">
              <Shield className="w-4 h-4 text-emerald-500" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Zero-Knowledge Private Vaults</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Using client-side Web Crypto AES-GCM-256, user-private projects are encrypted in the browser before upload. Platform administrators have zero access or keys to decrypt private user artifacts.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card/60 space-y-2.5">
            <div className="p-2 rounded-lg bg-muted w-fit text-foreground">
              <Globe className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">100% Open-Source & Self-Hostable</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Anyone can 1-click deploy Pagepod on Vercel with Supabase PostgreSQL and Cloudflare R2 object storage, maintaining complete data sovereignty and zero egress fee costs.
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card/60 space-y-2.5">
            <div className="p-2 rounded-lg bg-muted w-fit text-foreground">
              <Terminal className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">REST API Automation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Integrate Pagepod into your AI workflows. Use our Bearer Token API to automatically publish artifacts directly from terminal scripts or agent tools.
            </p>
          </div>
        </div>

        {/* Story & Philosophy */}
        <div className="space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border pt-10">
          <h2 className="text-lg font-semibold text-foreground">Our Philosophy</h2>
          <p>
            We believe that single-file web technologies (HTML + CSS + vanilla JavaScript) represent one of the most durable and accessible mediums for software distribution. AI coding tools have revitalized this paradigm. Pagepod serves as the bridge between creative AI output and instant global accessibility.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <Button asChild size="sm" className="h-8 text-xs font-medium">
              <Link href="/admin/upload">Upload an Artifact</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs font-medium">
              <a href="https://github.com/QingYunA/html-manager" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
