"use server";

import { revalidatePath } from "next/cache";
import { verifyAdminTokenFromCookies } from "@/lib/auth";
import { processAndCreateProject } from "@/lib/services/project-service";

export interface UploadActionResult {
  success?: boolean;
  error?: string;
  slug?: string;
}

export async function handleUploadAction(
  prevState: UploadActionResult | null,
  formData: FormData
): Promise<UploadActionResult> {
  const isAdmin = await verifyAdminTokenFromCookies();
  if (!isAdmin) {
    return { error: "无权限：请先登录管理员账号" };
  }

  const uploadType = formData.get("uploadType") as string; // 'file' | 'paste'
  const title = (formData.get("title") as string) || "";
  const slug = (formData.get("slug") as string) || "";
  const description = (formData.get("description") as string) || "";
  const category = (formData.get("category") as string) || "tools";
  const tagsRaw = (formData.get("tags") as string) || "";
  const visibility = ((formData.get("visibility") as string) || "public") as "public" | "unlisted" | "private";
  const isPinned = formData.get("isPinned") === "true";

  const tags = tagsRaw
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    if (uploadType === "paste") {
      const htmlContent = formData.get("htmlContent") as string;
      if (!htmlContent || !htmlContent.trim()) {
        return { error: "请输入或粘贴 HTML 代码" };
      }

      const project = await processAndCreateProject({
        title,
        slug,
        description,
        category,
        tags,
        visibility,
        isPinned,
        htmlContent,
      });

      revalidatePath("/");
      revalidatePath("/admin");
      return { success: true, slug: project.slug };
    } else {
      const file = formData.get("file") as File | null;
      if (!file || file.size === 0) {
        return { error: "请选择要上传的 .html 或 .zip 文件" };
      }

      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const project = await processAndCreateProject({
        title,
        slug,
        description,
        category,
        tags,
        visibility,
        isPinned,
        fileBuffer,
        fileName: file.name,
      });

      revalidatePath("/");
      revalidatePath("/admin");
      return { success: true, slug: project.slug };
    }
  } catch (err: unknown) {
    console.error("Upload error:", err);
    return { error: (err as Error)?.message || "上传失败，请检查文件或重试" };
  }
}
