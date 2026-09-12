import type { Metadata } from "next";
import TermsClient from "./terms-client";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pagepod.dev";

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

export default function TermsPage() {
  return <TermsClient />;
}
