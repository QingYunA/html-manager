import type { MetadataRoute } from "next";
import { getAllProjects } from "@/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  try {
    // Only query and expose public projects to search engines
    const projects = await getAllProjects({ includePrivate: false });
    const publicProjects = projects.filter(
      (p) => p.visibility === "public" && !p.isEncrypted
    );

    for (const p of publicProjects) {
      routes.push({
        url: `${baseUrl}/p/${p.slug}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    console.error("Failed to generate project sitemap entries:", error);
  }

  return routes;
}
