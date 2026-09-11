import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/"],
        disallow: ["/workspace/", "/admin/", "/api/", "/auth/", "/raw/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
