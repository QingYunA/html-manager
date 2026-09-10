import { getAllProjects } from "@/db";
import { getCurrentUser } from "@/lib/auth";
import ShowcaseGallery from "@/components/showcase-gallery";
import { HomeHeader } from "@/components/home-header";
import { HeroSection } from "@/components/hero-section";
import { SiteFooter } from "@/components/site-footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await getAllProjects({ includePrivate: false });
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Navigation with Sign in / Sign up & Language Toggle */}
      <HomeHeader currentUser={currentUser} />

      {/* Hero Header with multi-language text */}
      <HeroSection />

      {/* Main Showcase Gallery */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <ShowcaseGallery initialProjects={projects} />
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
