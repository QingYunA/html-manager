import { NextResponse } from "next/server";
import { getProjectBySlug, incrementViewCount } from "@/db";
import { getStorage } from "@/lib/storage";
import { verifyAdminTokenFromRequest } from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    slug: string;
    path?: string[];
  }>;
}

export async function GET(request: Request, context: RouteParams) {
  const { slug, path: subPaths } = await context.params;

  const project = await getProjectBySlug(slug);
  if (!project) {
    return new NextResponse("Project not found", { status: 404 });
  }

  // If private, only admin can view
  if (project.visibility === "private") {
    const isAdmin = await verifyAdminTokenFromRequest(request);
    if (!isAdmin) {
      return new NextResponse("Unauthorized: This project is private", { status: 403 });
    }
  }

  const storage = getStorage();
  const subpath = subPaths && subPaths.length > 0 ? subPaths.join("/") : project.entryPath;
  const storagePath = `${project.storagePrefix}/${subpath}`.replace(/\/+/g, "/");

  const file = await storage.getFile(storagePath);
  if (!file) {
    return new NextResponse(`File not found: ${subpath}`, { status: 404 });
  }

  // Increment view count if accessing the entry HTML
  if (!subPaths || subPaths.length === 0 || subpath === project.entryPath) {
    incrementViewCount(slug).catch(() => {});
  }

  const isHtml = file.contentType.includes("text/html");

  const headers = new Headers();
  headers.set("Content-Type", file.contentType);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "public, max-age=60, s-maxage=300");

  if (isHtml) {
    // Sandbox CSP: enables full script execution and forms, but blocks access to parent origin cookies & local storage
    headers.set(
      "Content-Security-Policy",
      "sandbox allow-scripts allow-forms allow-downloads allow-popups allow-modals; default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
    );
  }

  return new NextResponse(file.data as unknown as BodyInit, {
    status: 200,
    headers,
  });
}
