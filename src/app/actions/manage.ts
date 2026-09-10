"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminTokenFromCookies } from "@/lib/auth";
import { deleteProject, getProjectById, updateProject } from "@/db";
import { getStorage } from "@/lib/storage";

export async function togglePinAction(id: string, currentPinned: boolean) {
  const isAdmin = await verifyAdminTokenFromCookies();
  if (!isAdmin) throw new Error("Unauthorized");

  await updateProject(id, { isPinned: !currentPinned });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateVisibilityAction(id: string, visibility: "public" | "unlisted" | "private") {
  const isAdmin = await verifyAdminTokenFromCookies();
  if (!isAdmin) throw new Error("Unauthorized");

  await updateProject(id, { visibility });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteProjectAction(id: string) {
  const isAdmin = await verifyAdminTokenFromCookies();
  if (!isAdmin) throw new Error("Unauthorized");

  const project = await getProjectById(id);
  if (project) {
    try {
      const storage = getStorage();
      await storage.deleteDirectory(project.storagePrefix);
    } catch (e) {
      console.error("Failed to cleanup storage directory:", e);
    }
  }

  await deleteProject(id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveProjectHtmlAction(id: string, newHtml: string) {
  const isAdmin = await verifyAdminTokenFromCookies();
  if (!isAdmin) throw new Error("Unauthorized");

  const { updateProjectHtml } = await import("@/lib/services/project-service");
  await updateProjectHtml(id, newHtml);
  revalidatePath(`/p/${id}`);
  revalidatePath("/admin");
}
