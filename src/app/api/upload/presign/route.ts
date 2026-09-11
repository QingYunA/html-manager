import { NextResponse } from "next/server";
import { verifyAdminTokenFromRequest } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { sanitizeSlug } from "@/lib/services/project-service";
import { assertSafeStorageKey } from "@/lib/storage/path-safety";
import { nanoid } from "nanoid";

const ALLOWED_CONTENT_TYPES = new Set([
  "text/html; charset=utf-8",
  "text/html",
  "application/octet-stream",
  "application/zip",
  "application/x-zip-compressed",
]);

export async function POST(request: Request) {
  const isAuthorized = await verifyAdminTokenFromRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { contentType, isEncrypted } = body;

    const rawSlug = body.slug ? String(body.slug) : "";
    const slug = rawSlug ? sanitizeSlug(rawSlug) : nanoid(8).toLowerCase();
    const entryFile = isEncrypted ? "bundle.enc" : "index.html";
    const storagePath = assertSafeStorageKey(`sites/${slug}/${entryFile}`, "sites");

    const safeContentType =
      contentType && ALLOWED_CONTENT_TYPES.has(contentType)
        ? contentType
        : isEncrypted
        ? "application/octet-stream"
        : "text/html; charset=utf-8";

    // NOTE: The server intentionally does NOT derive or return any encryption key.
    // Encryption is zero-knowledge: the client owns the key and the server only stores ciphertext.

    const storage = getStorage();
    if (storage.createPresignedUploadUrl) {
      const presigned = await storage.createPresignedUploadUrl(storagePath, safeContentType);
      return NextResponse.json({
        success: true,
        slug,
        storagePath,
        uploadUrl: presigned.url,
        uploadMethod: presigned.method,
      });
    }

    // Fallback: direct local route
    return NextResponse.json({
      success: true,
      slug,
      storagePath,
      uploadUrl: `/api/upload/direct-local?path=${encodeURIComponent(storagePath)}`,
      uploadMethod: "PUT",
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Failed to generate presigned upload URL" }, { status: 500 });
  }
}
