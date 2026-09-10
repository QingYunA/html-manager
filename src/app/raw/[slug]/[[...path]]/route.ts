import { NextResponse } from "next/server";
import { getProjectBySlug, incrementViewCount } from "@/db";
import { getStorage } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";

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

  const currentUser = await getCurrentUser();

  // Strict Privacy Enforcement:
  // If a project is private or encrypted, ONLY the exact project creator can access raw endpoints.
  // Platform admins CANNOT inspect or access other users' private/encrypted projects!
  if (project.visibility === "private" || project.isEncrypted) {
    const isExactCreator = Boolean(
      currentUser &&
        (project.userId
          ? currentUser.id === project.userId
          : currentUser.id === "selfhost-admin")
    );

    if (!isExactCreator) {
      return new NextResponse("403 Forbidden: Private Resource. Only the project owner can access this content.", {
        status: 403,
      });
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

  if (project.visibility === "private") {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

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
