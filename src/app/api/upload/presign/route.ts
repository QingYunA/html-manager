import { NextResponse } from "next/server";
import { getCurrentUser, verifyAdminTokenFromRequest } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  const isAuthorized = await verifyAdminTokenFromRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filename, contentType, isEncrypted } = body;

    const ext = filename ? filename.split(".").pop() : "html";
    const slug = body.slug || nanoid(8).toLowerCase();
    const storagePath = `sites/${slug}/${isEncrypted ? "bundle.enc" : "index.html"}`;

    const storage = getStorage();
    if (storage.createPresignedUploadUrl) {
      const presigned = await storage.createPresignedUploadUrl(
        storagePath,
        contentType || (isEncrypted ? "application/octet-stream" : "text/html; charset=utf-8")
      );
      return NextResponse.json({
        success: true,
        slug,
        storagePath,
        uploadUrl: presigned.url,
        uploadMethod: presigned.method,
      });
    }

    // Fallback: regular server route
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
