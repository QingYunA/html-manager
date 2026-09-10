import { NextResponse } from "next/server";
import { getCurrentUser, verifyAdminTokenFromRequest } from "@/lib/auth";
import { deriveUserMasterKey, bufferToBase64Url } from "@/lib/crypto/e2ee";
import { getStorage } from "@/lib/storage";
import { nanoid } from "nanoid";

export async function POST(request: Request) {
  const isAuthorized = await verifyAdminTokenFromRequest(request);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await getCurrentUser();

  try {
    const body = await request.json();
    const { filename, contentType, isEncrypted } = body;

    const slug = body.slug || nanoid(8).toLowerCase();
    const storagePath = `sites/${slug}/${isEncrypted ? "bundle.enc" : "index.html"}`;

    // If encrypted and user is authenticated, also export their user-derived master key
    // so the client can encrypt deterministically without asking the user to copy-paste passwords
    let userKeyBase64: string | null = null;
    if (isEncrypted && currentUser?.id) {
      const cryptoKey = await deriveUserMasterKey(currentUser.id);
      const rawKey = await crypto.subtle.exportKey("raw", cryptoKey);
      userKeyBase64 = bufferToBase64Url(rawKey);
    }

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
        userKey: userKeyBase64,
      });
    }

    // Fallback: direct local route
    return NextResponse.json({
      success: true,
      slug,
      storagePath,
      uploadUrl: `/api/upload/direct-local?path=${encodeURIComponent(storagePath)}`,
      uploadMethod: "PUT",
      userKey: userKeyBase64,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Failed to generate presigned upload URL" }, { status: 500 });
  }
}
