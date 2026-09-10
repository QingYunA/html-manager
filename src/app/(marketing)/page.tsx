import { getAllProjects } from "@/db";
import ShowcaseGallery from "@/components/showcase-gallery";
import { HeroSection } from "@/components/hero-section";

export const revalidate = 60;

export default async function HomePage() {
  const projects = await getAllProjects({ includePrivate: false });

  return (
    <>
      {/* Hero Header with multi-language text */}
      <HeroSection />

      {/* Main Showcase Gallery */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <ShowcaseGallery initialProjects={projects} />
      </main>
    </>
  );
}
