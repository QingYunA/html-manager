import type { Metadata } from "next";
import { getAllProjects } from "@/db";
import ExploreClient from "./explore-client";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pagepod.dev";

export const metadata: Metadata = {
  title: "Curated Collections & Topics - AI Tools, Games & Web Apps",
  description:
    "Explore curated AI-generated mini tools, games, visualizations, and prototypes. Test-run them directly in the sandbox.",
  alternates: {
    canonical: "/explore",
  },
  openGraph: {
    title: "Curated Collections & Topics | Pagepod",
    description:
      "Explore curated AI-generated mini tools, games, visualizations, and prototypes. Test-run them directly in the sandbox.",
    url: `${siteUrl}/explore`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Curated Collections & Topics | Pagepod",
    description:
      "Explore curated AI-generated mini tools, games, visualizations, and prototypes. Test-run them directly in the sandbox.",
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
