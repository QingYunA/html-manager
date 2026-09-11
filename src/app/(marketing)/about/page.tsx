import type { Metadata } from "next";
import AboutClient from "./about-client";

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

export const revalidate = 86400;

export default function AboutPage() {
  return <AboutClient />;
}
