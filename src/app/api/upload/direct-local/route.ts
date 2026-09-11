import { NextResponse } from "next/server";
import { verifyAdminTokenFromRequest } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import { assertSafeStorageKey } from "@/lib/storage/path-safety";

export async function PUT(request: Request) {
  const isAuthorized = await verifyAdminTokenFromRequest(request);
  if (!isAuthorized) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get("path");
  if (!filePath) {
    return new NextResponse("Missing 'path' query parameter", { status: 400 });
  }

  try {
    // Enforce that direct-local upload can ONLY write under sites/
    const safeKey = assertSafeStorageKey(filePath, "sites");

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = request.headers.get("content-type") || "application/octet-stream";

    const storage = getStorage();
    await storage.uploadFile(safeKey, buffer, contentType);

    return NextResponse.json({ success: true, path: safeKey });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Upload failed" }, { status: 400 });
  }
}
