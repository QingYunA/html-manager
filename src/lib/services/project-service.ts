import { nanoid } from "nanoid";
import { createProject, getProjectBySlug, updateProject } from "@/db";
import { getStorage, getStorageType } from "@/lib/storage";
import { extractMetadataFromHtml, unpackZipBundle } from "@/lib/parser";
import type { Project } from "@/db/schema";

export interface CreateProjectInput {
  userId?: string;
  title?: string;
  slug?: string;
  description?: string;
  category?: string;
  tags?: string[];
  visibility?: "public" | "unlisted" | "private";
  isPinned?: boolean;
  // Payload: either htmlContent, or fileBuffer with filename
  htmlContent?: string;
  fileBuffer?: Buffer;
  fileName?: string;
  // End-to-end encryption fields (zero-knowledge: server stores ciphertext + public KDF params only)
  isEncrypted?: boolean;
  encryptionIv?: string;
  keyMode?: "legacy-server" | "zk-passphrase" | "zk-recovery";
  kdfSalt?: string;
  kdfIterations?: number;
  fileSize?: number;
  // Pre-uploaded storage path (via S3 Presigned direct PUT)
  preUploadedStoragePath?: string;
}

export function sanitizeSlug(input: string): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || nanoid(8).toLowerCase();
}

export async function processAndCreateProject(input: CreateProjectInput): Promise<Project> {
  let title = input.title?.trim() || "";
  let description = input.description?.trim() || "";
  let initialHtml = "";
  let assetType: "single_html" | "zip_bundle" = "single_html";
  let entryPath = "index.html";
  const storage = getStorage();
  const storageType = getStorageType();

  // Generate unique slug
  let slug = input.slug ? sanitizeSlug(input.slug) : "";
  if (!slug) {
    if (title) {
      slug = sanitizeSlug(title);
    } else {
      slug = nanoid(8).toLowerCase();
    }
  }

  // Ensure slug uniqueness
  const existing = await getProjectBySlug(slug);
  if (existing) {
    slug = `${slug}-${nanoid(4).toLowerCase()}`;
  }

  const storagePrefix = `sites/${slug}`;

  // Check if file was already directly uploaded via Presigned URL
  if (input.preUploadedStoragePath) {
    assetType = "single_html";
    entryPath = input.isEncrypted ? "bundle.enc" : "index.html";
  } else if (input.isEncrypted && input.fileBuffer) {
    // Encrypted file stream
    assetType = "single_html";
    entryPath = "bundle.enc";
    await storage.uploadFile(`${storagePrefix}/${entryPath}`, input.fileBuffer, "application/octet-stream");
  } else if (input.htmlContent) {
    // 1. Direct HTML content
    assetType = "single_html";
    entryPath = "index.html";
    initialHtml = input.htmlContent;

    const extracted = extractMetadataFromHtml(initialHtml);
    if (!title) title = extracted.title;
    if (!description) description = extracted.description;

    await storage.uploadFile(`${storagePrefix}/index.html`, initialHtml, "text/html; charset=utf-8");
  } else if (input.fileBuffer && input.fileName) {
    const isZip = input.fileName.toLowerCase().endsWith(".zip");

    if (isZip) {
      // 2. Zip bundle
      assetType = "zip_bundle";
      const unpacked = await unpackZipBundle(input.fileBuffer);
      entryPath = unpacked.entryPath;
      initialHtml = unpacked.initialHtml || "";

      if (initialHtml) {
        const extracted = extractMetadataFromHtml(initialHtml);
        if (!title) title = extracted.title;
        if (!description) description = extracted.description;
      }

      await storage.uploadBundle(storagePrefix, unpacked.files);
    } else {
      // 3. Single HTML file
      assetType = "single_html";
      entryPath = "index.html";
      initialHtml = input.fileBuffer.toString("utf-8");

      const extracted = extractMetadataFromHtml(initialHtml);
      if (!title) title = extracted.title;
      if (!description) description = extracted.description;

      await storage.uploadFile(`${storagePrefix}/index.html`, input.fileBuffer, "text/html; charset=utf-8");
    }
  } else {
    throw new Error("Must provide either htmlContent, valid fileBuffer, or preUploadedStoragePath");
  }

  if (!title) {
    title = input.isEncrypted ? "加密私密单页" : "未命名项目";
  }

  const project = await createProject({
    id: nanoid(12),
    userId: input.userId || null,
    title,
    slug,
    description,
    category: input.category || "tools",
    tags: input.tags || [],
    assetType,
    entryPath,
    storageType,
    storagePrefix,
    visibility: input.visibility || "public",
    isPinned: Boolean(input.isPinned),
    viewCount: 0,
    isEncrypted: Boolean(input.isEncrypted),
    encryptionIv: input.encryptionIv || null,
    keyMode: input.keyMode || "legacy-server",
    kdfSalt: input.kdfSalt || null,
    kdfIterations: input.kdfIterations ?? null,
    fileSize: input.fileSize || 0,
    planTier: "free",
  });

  return project;
}

export async function updateProjectHtml(
  id: string,
  newHtml: string,
  expectedUser?: { id: string; role?: string }
): Promise<Project> {
  const { getProjectById } = await import("@/db");
  const project = await getProjectById(id);
  if (!project) {
    throw new Error("Project not found");
  }

  if (expectedUser) {
    const isAllowed =
      expectedUser.role === "admin" ||
      expectedUser.id === "selfhost-admin" ||
      (project.userId && project.userId === expectedUser.id);
    if (!isAllowed) {
      throw new Error("Forbidden: You do not have permission to modify this project");
    }
  }

  const storage = getStorage();
  const filePath = `${project.storagePrefix}/${project.entryPath}`;
  await storage.uploadFile(filePath, newHtml, "text/html; charset=utf-8");

  const updated = await updateProject(id, {});
  return updated || project;
}
