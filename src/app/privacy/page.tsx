import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { HomeHeader } from "@/components/home-header";
import { SiteFooter } from "@/components/site-footer";
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

export default async function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xs text-muted-foreground">
            Your privacy and data sovereignty are foundational to Pagepod.
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Overview & Commitment</h2>
            <p>
              Pagepod (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;platform&rdquo;) operates as an open-source artifact hosting platform. We do not sell your personal information, train AI models on your private data, or track users across third-party websites.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> When signing in via GitHub, Google OAuth, or email, we receive your email address and unique authentication ID from Supabase Auth.</li>
              <li><strong>Project Data:</strong> Titles, descriptions, category tags, and HTML/asset contents you voluntarily upload.</li>
              <li><strong>Technical Metadata:</strong> Anonymized server logs including request timestamps, user-agent headers, and view counts for analytics and abuse prevention.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Zero-Knowledge Encryption for Private Artifacts</h2>
            <p>
              When you designate a project as <strong>Private / Encrypted Vault</strong>, the plaintext is encrypted on your client device using the Web Crypto API (AES-GCM-256). The ciphertext stored in our object storage cannot be read by platform administrators or database operators. Only the authenticated owner has the cryptographic capability to decrypt their content.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Public Artifacts & Responsibility</h2>
            <p>
              Artifacts marked as <strong>Public</strong> are deliberately rendered accessible to anyone on the internet. Because HTML is client-side code, visitors can inspect its source. We urge creators to utilize our built-in credential scanner to avoid publishing API keys, credentials, or personal secrets publicly.
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
      <SiteFooter />
    </div>
  );
}
