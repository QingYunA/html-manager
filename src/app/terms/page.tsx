import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { HomeHeader } from "@/components/home-header";
import { SiteFooter } from "@/components/site-footer";
import { Badge } from "@/components/ui/badge";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";

export const metadata: Metadata = {
  title: "Terms of Service - Pagepod",
  description:
    "Terms of Service for using the Pagepod hosting platform, acceptable use policies, content ownership, and liability disclaimers.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | Pagepod",
    description: "Acceptable use policy and platform rules for Pagepod.",
    url: `${siteUrl}/terms`,
    type: "website",
  },
};

export const revalidate = 86400;

export default async function TermsPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-neutral-800 selection:text-white">
      <HomeHeader currentUser={currentUser} />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="space-y-3 mb-10">
          <Badge variant="outline" className="px-3 py-0.5 text-xs font-mono">
            Last Updated: September 2026
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="text-xs text-muted-foreground">
            Please read these terms carefully before deploying or publishing artifacts on Pagepod.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Pagepod, you agree to be bound by these Terms of Service. If you are deploying your own self-hosted instance under the MIT License, your instance is governed by the terms of the MIT License.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Acceptable Use Policy</h2>
            <p>
              Pagepod provides isolated sandboxed execution for web tools, prototypes, and educational demonstrations. You strictly agree NOT to upload, execute, or distribute:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Malicious payloads, viruses, ransomware, keyloggers, or phishing forms;</li>
              <li>Cryptocurrency miners or denial-of-service (DoS) automation;</li>
              <li>Content that violates copyright, trademark, or applicable local laws;</li>
              <li>Harassment, defamatory content, or non-consensual personal information.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Content Ownership & Intellectual Property</h2>
            <p>
              You retain all intellectual property rights to the code, markup, and assets you upload to Pagepod. By marking a project as Public, you grant Pagepod a non-exclusive license to host, cache, render, and display your project in our public showcase.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Sandboxing & Security Disclaimer</h2>
            <p>
              While Pagepod enforces strict sandbox restrictions (such as withholding <code>allow-same-origin</code> on embedded frames to prevent cookie and localStorage theft), public web execution carries inherent risks. Pagepod is provided &ldquo;as is&rdquo; without warranty of any kind.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Termination & Takedowns</h2>
            <p>
              We reserve the right to remove any public project or suspend accounts that violate our acceptable use policy. Copyright owners may submit takedown notices via GitHub issues or directly to platform administrators.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Modifications to the Service</h2>
            <p>
              We may continuously update features, APIs, and pricing tiers. Material changes will be noted on this page or through workspace notifications.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
