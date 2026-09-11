import type { Metadata } from "next";
import { getAllProjects } from "@/db";
import ExploreClient from "./explore-client";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";

export const metadata: Metadata = {
  title: "Explore AI HTML Artifacts - Tools, Games & Web Apps",
  description:
    "Discover top AI-generated single-page applications, interactive calculators, web games, and prototypes created with Claude Artifacts, ChatGPT Canvas & v0.",
  alternates: {
    canonical: "/explore",
  },
  openGraph: {
    title: "Explore AI HTML Artifacts | Pagepod",
    description:
      "Curated directory of AI single-page tools, mini-games, and UI prototypes. Try interactive sandboxes instantly.",
    url: `${siteUrl}/explore`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore AI HTML Artifacts | Pagepod",
    description:
      "Curated directory of AI single-page tools, mini-games, and UI prototypes. Try interactive sandboxes instantly.",
  },
};

export const revalidate = 60;

export default async function ExplorePage() {
  const allProjects = await getAllProjects({ includePrivate: false });
  const publicProjects = allProjects.filter(
    (p) => p.visibility === "public"
  );

  return (
    <main className="flex-1">
      <ExploreClient projects={publicProjects} />
    </main>
  );
}
