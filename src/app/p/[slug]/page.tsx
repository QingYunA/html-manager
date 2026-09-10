import { notFound } from "next/navigation";
import { getProjectBySlug, incrementViewCount } from "@/db";
import { getStorage } from "@/lib/storage";
import RunnerClient from "./runner-client";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ProjectRunnerPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Record view count
  await incrementViewCount(slug);

  let sourceCode = "";
  if (project.assetType === "single_html") {
    try {
      const storage = getStorage();
      const file = await storage.getFile(`${project.storagePrefix}/${project.entryPath}`);
      if (file) {
        sourceCode = file.data.toString("utf-8");
      }
    } catch {
      sourceCode = "";
    }
  }

  return <RunnerClient project={project} initialSourceCode={sourceCode} />;
}
