"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, assertCanManageProject } from "@/lib/auth";
import { deleteProject, getProjectById, updateProject } from "@/db";
import { getStorage } from "@/lib/storage";

export async function togglePinAction(id: string, currentPinned: boolean) {
  const user = await getCurrentUser();
  const project = await getProjectById(id);
  if (!project) throw new Error("Project not found");

  assertCanManageProject(user, project);

  await updateProject(id, { isPinned: !currentPinned });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateVisibilityAction(id: string, visibility: "public" | "unlisted" | "private") {
  const user = await getCurrentUser();
  const project = await getProjectById(id);
  if (!project) throw new Error("Project not found");

  assertCanManageProject(user, project);

  await updateProject(id, { visibility });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteProjectAction(id: string) {
  const user = await getCurrentUser();
  const project = await getProjectById(id);
  if (!project) throw new Error("Project not found");

  assertCanManageProject(user, project);

  try {
    const storage = getStorage();
    await storage.deleteDirectory(project.storagePrefix);
  } catch (e) {
    console.error("Failed to cleanup storage directory:", e);
  }

  await deleteProject(id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveProjectHtmlAction(id: string, newHtml: string) {
  const user = await getCurrentUser();
  const project = await getProjectById(id);
  if (!project) throw new Error("Project not found");

  assertCanManageProject(user, project);

  const { updateProjectHtml } = await import("@/lib/services/project-service");
  await updateProjectHtml(id, newHtml, user);
  revalidatePath(`/p/${project.slug}`);
  revalidatePath("/admin");
}
