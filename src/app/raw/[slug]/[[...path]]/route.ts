import { NextResponse } from "next/server";
import { getProjectBySlug, incrementViewCount } from "@/db";
import { getStorage } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { assertSafeStorageKey } from "@/lib/storage/path-safety";

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

  // Strict Privacy Enforcement:
  // If a project is private or encrypted, ONLY the exact project creator can access raw endpoints.
  // Platform admins CANNOT inspect or access other users' private/encrypted projects!
  const isProtected = project.visibility === "private" || project.isEncrypted;
  if (isProtected) {
    const currentUser = await getCurrentUser();
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

  const subpath = subPaths && subPaths.length > 0 ? subPaths.join("/") : project.entryPath;
  let storagePath: string;
  try {
    storagePath = assertSafeStorageKey(`${project.storagePrefix}/${subpath}`, project.storagePrefix);
  } catch {
    return new NextResponse("Invalid resource path", { status: 400 });
  }

  const storage = getStorage();
  const file = await storage.getFile(storagePath);
  if (!file) {
    return new NextResponse(`File not found: ${subpath}`, { status: 404 });
  }

  // Increment view count if accessing the entry HTML
  if (!subPaths || subPaths.length === 0 || subpath === project.entryPath) {
    incrementViewCount(slug).catch(() => {});
  }

  const headers = new Headers();
  headers.set("Content-Type", file.contentType);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  // Private resources must never be cached by shared proxies/CDNs
  if (isProtected) {
    headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
    headers.set("Vary", "Cookie, Authorization");
    headers.set("X-Robots-Tag", "noindex, nofollow");
  } else {
    headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
  }

  // Mandatory hardened sandbox CSP for ALL active document types (HTML, SVG, XML)
  // Ensures arbitrary user-uploaded markup/scripts cannot access parent origin cookies, session, or localStorage
  const activeDocumentTypes = ["text/html", "image/svg+xml", "application/xml", "text/xml"];
  const isActiveDocument = activeDocumentTypes.some((t) => file.contentType.toLowerCase().includes(t));

  if (isActiveDocument) {
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
