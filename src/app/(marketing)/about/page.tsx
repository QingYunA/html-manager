import type { Metadata } from "next";
import AboutClient from "./about-client";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pagepod.dev";

export const metadata: Metadata = {
  title: "About Pagepod - Mission & Architecture",
  description:
    "Learn about Pagepod, an open-source, self-hostable showcase and hosting platform tailored for HTML web applications, interactive tools, and games.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Pagepod | Mission & Architecture",
    description:
      "Instant hosting platform tailored for HTML web applications, tools, and prototypes.",
    url: `${siteUrl}/about`,
    type: "website",
  },
};

export const revalidate = 86400;

export default function AboutPage() {
  return <AboutClient />;
}
