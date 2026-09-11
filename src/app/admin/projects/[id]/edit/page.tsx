import { notFound } from "next/navigation";
import { getProjectById } from "@/db";
import { getStorage } from "@/lib/storage";
import { getCurrentUser, canManageProject } from "@/lib/auth";
import ProjectEditorClient from "./editor-client";

interface EditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ProjectEditPage({ params }: EditPageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const project = await getProjectById(id);

  if (!project || !canManageProject(currentUser, project)) {
    notFound();
  }

  let initialCode = "";
  if (project.assetType === "single_html") {
    const storage = getStorage();
    const filePath = `${project.storagePrefix}/${project.entryPath}`;
    const file = await storage.getFile(filePath);
    if (file) {
      initialCode = file.data.toString("utf-8");
    }
  }

  return <ProjectEditorClient project={project} initialCode={initialCode} />;
}
