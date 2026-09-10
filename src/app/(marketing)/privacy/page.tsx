import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";

export const metadata: Metadata = {
  title: "Privacy Policy - Pagepod",
  description:
    "Privacy Policy for Pagepod. Learn how we handle your authentication, data storage, client-side encryption, and privacy rights.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Pagepod",
    description: "Learn how Pagepod protects your data with end-to-end zero-knowledge encryption.",
    url: `${siteUrl}/privacy`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function PrivacyPage() {
  return (
    <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
      <div className="space-y-3 mb-10">
        <Badge variant="outline" className="px-3 py-0.5 text-xs font-mono">
          Last Updated: September 2026
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Pagepod is committed to strict data ownership, security sandboxing, and zero-knowledge encryption. This policy outlines how your data is handled across our platform.
        </p>
      </div>

      <div className="space-y-8 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">1. Zero-Knowledge Private Vaults (E2EE)</h2>
          <p>
            When you publish artifacts marked as <strong>Private (End-to-End Encrypted)</strong>, all HTML, CSS, JS, and media files are encrypted in your browser using the W3C Web Crypto API with AES-GCM-256 before upload. Pagepod servers, database administrators, and cloud storage providers never receive your plaintext source code or decryption keys.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">2. Public Artifacts & Sandbox Execution</h2>
          <p>
            Artifacts published as <strong>Public</strong> are intentionally accessible for discovery in our showcase gallery. All standalone executions run under strict HTML5 sandbox isolation (<code>Content-Security-Policy: sandbox allow-scripts allow-forms allow-downloads allow-popups allow-modals</code>) to physically isolate third-party scripts from host cookies and authentication tokens.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">3. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account Data:</strong> If using Cloud SaaS mode, your email address and authentication identifier provided by GitHub or Google OAuth via Supabase Auth.</li>
            <li><strong>Artifact Metadata:</strong> Titles, slugs, descriptions, visibility settings, and project tags you provide.</li>
            <li><strong>Technical Metadata:</strong> Anonymized server logs including request timestamps, user-agent headers, and view counts for analytics and abuse prevention.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">4. Third-Party Infrastructure</h2>
          <p>
            Depending on configuration, Pagepod integrates with trusted infrastructure providers: Supabase (PostgreSQL & Auth), Cloudflare (R2 object storage & CDN), and Vercel (Edge Hosting & Analytics). These providers adhere to SOC 2 Type II and GDPR compliance standards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">5. Data Retention & Deletion Rights</h2>
          <p>
            You retain 100% ownership of your code. You can delete any uploaded project at any time from your Workspace dashboard. Deletion permanently purges metadata from the database and assets from storage buckets.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">6. Contact & Open Source Audits</h2>
          <p>
            Because Pagepod is open-source, you can independently review our data handling and cryptographic implementations on GitHub at <a href="https://github.com/QingYunA/html-manager" className="underline text-foreground" target="_blank" rel="noopener noreferrer">github.com/QingYunA/html-manager</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
