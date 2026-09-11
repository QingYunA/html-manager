"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { processAndCreateProject } from "@/lib/services/project-service";
import { uploadPayloadSchema, MAX_UPLOAD_BYTES } from "@/lib/validation";

export interface UploadActionResult {
  success?: boolean;
  error?: string;
  slug?: string;
}

export async function handleUploadAction(
  prevState: UploadActionResult | null,
  formData: FormData
): Promise<UploadActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "无权限：请先登录管理员或用户账号" };
  }

  const str = (key: string): string | undefined => {
    const value = formData.get(key);
    return typeof value === "string" ? value : undefined;
  };

  const parseResult = uploadPayloadSchema.safeParse({
    title: str("title"),
    slug: str("slug"),
    description: str("description"),
    category: str("category"),
    tags: str("tags") ?? "",
    visibility: str("visibility") ?? "public",
    isPinned: formData.get("isPinned") === "true",
    isEncrypted: formData.get("isEncrypted") === "true",
    encryptionIv: str("encryptionIv"),
    keyMode: str("keyMode"),
    kdfSalt: str("kdfSalt"),
    preUploadedStoragePath: str("preUploadedStoragePath"),
  });

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message || "表单参数不合法" };
  }

  const uploadType = str("uploadType"); // 'file' | 'paste'
  const {
    title,
    slug,
    description,
    category,
    tags,
    visibility,
    isPinned,
    isEncrypted,
    encryptionIv,
    keyMode,
    kdfSalt,
    preUploadedStoragePath,
  } = parseResult.data;

  try {
    if (preUploadedStoragePath) {
      // Direct presigned upload was completed on client
      const project = await processAndCreateProject({
        userId: user.id,
        title,
        slug,
        description,
        category,
        tags,
        visibility,
        isPinned,
        isEncrypted,
        encryptionIv,
        keyMode,
        kdfSalt,
        preUploadedStoragePath,
      });

      revalidatePath("/");
      revalidatePath("/admin");
      return { success: true, slug: project.slug };
    } else if (uploadType === "paste") {
      const htmlContent = str("htmlContent");
      if (!htmlContent || !htmlContent.trim()) {
        return { error: "请输入或粘贴 HTML 代码" };
      }
      if (Buffer.byteLength(htmlContent, "utf-8") > MAX_UPLOAD_BYTES) {
        return { error: `HTML 内容过大：最大允许 ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB` };
      }

      const project = await processAndCreateProject({
        userId: user.id,
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
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return { error: "请选择要上传的 .html 或 .zip 文件" };
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return { error: `文件过大：最大允许 ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB` };
      }

      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      const project = await processAndCreateProject({
        userId: user.id,
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
