import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.pagepod.dev";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/", "/explore/"],
        disallow: ["/workspace/", "/admin/", "/api/", "/auth/", "/raw/"],
      },
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Applebot-Extended"],
        allow: ["/", "/p/", "/explore/"],
        disallow: ["/workspace/", "/admin/", "/api/", "/auth/", "/raw/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
