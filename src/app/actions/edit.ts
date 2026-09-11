"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, assertCanManageProject } from "@/lib/auth";
import { updateProject, getProjectById } from "@/db";
import { getStorage } from "@/lib/storage";

export async function updateProjectFullAction(
  id: string,
  data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    visibility: "public" | "unlisted" | "private";
    isPinned: boolean;
    htmlCode?: string;
  }
) {
  const user = await getCurrentUser();
  const project = await getProjectById(id);
  if (!project) throw new Error("Project not found");

  assertCanManageProject(user, project);

  // If HTML code is provided and it's single_html, update storage
  if (data.htmlCode && project.assetType === "single_html") {
    const storage = getStorage();
    const filePath = `${project.storagePrefix}/${project.entryPath}`;
    await storage.uploadFile(filePath, data.htmlCode, "text/html; charset=utf-8");
  }

  const updated = await updateProject(id, {
    title: data.title,
    description: data.description,
    category: data.category,
    tags: data.tags,
    visibility: data.visibility,
    isPinned: data.isPinned,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/p/${project.slug}`);

  return { success: true, project: updated };
}
