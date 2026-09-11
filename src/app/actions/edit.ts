"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, assertCanManageProject } from "@/lib/auth";
import { updateProject, getProjectById } from "@/db";
import { getStorage } from "@/lib/storage";
import { updateProjectInputSchema } from "@/lib/validation";

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
  if (typeof id !== "string" || !id) {
    throw new Error("Invalid project id");
  }

  const parsed = updateProjectInputSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid project data");
  }
  const validated = parsed.data;

  const user = await getCurrentUser();
  const project = await getProjectById(id);
  if (!project) throw new Error("Project not found");

  assertCanManageProject(user, project);

  // If HTML code is provided and it's single_html, update storage
  if (validated.htmlCode && project.assetType === "single_html") {
    const storage = getStorage();
    const filePath = `${project.storagePrefix}/${project.entryPath}`;
    await storage.uploadFile(filePath, validated.htmlCode, "text/html; charset=utf-8");
  }

  const updated = await updateProject(id, {
    title: validated.title,
    description: validated.description,
    category: validated.category,
    tags: validated.tags,
    visibility: validated.visibility,
    isPinned: validated.isPinned,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/p/${project.slug}`);

  return { success: true, project: updated };
}
