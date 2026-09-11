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
  // If a project is private, ONLY the exact project creator can access raw endpoints.
  // Platform admins CANNOT inspect or access other users' private projects!
  const isProtected = project.visibility === "private";
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

  let responseBody: BodyInit = file.data as unknown as BodyInit;

  // In-memory localStorage/sessionStorage shim for sandboxed HTML documents.
  // Sandboxed iframes without allow-same-origin have an opaque 'null' origin,
  // causing browser window.localStorage access to throw SecurityError/DOMException.
  // This polyfill provides a safe, transparent in-memory storage so AI artifacts function smoothly.
  if (file.contentType.toLowerCase().includes("text/html")) {
    const rawHtml = file.data.toString("utf-8");
    const storageShim = `<script>(function(){try{var t="__storage_test__";window.localStorage.setItem(t,t);window.localStorage.removeItem(t);}catch(e){var m={};function S(){this.getItem=function(k){return m.hasOwnProperty(k)?m[k]:null;};this.setItem=function(k,v){m[k]=String(v);};this.removeItem=function(k){delete m[k];};this.clear=function(){m={};};this.key=function(i){return Object.keys(m)[i]||null;};Object.defineProperty(this,"length",{get:function(){return Object.keys(m).length;}});};try{Object.defineProperty(window,"localStorage",{value:new S(),writable:true,configurable:true});Object.defineProperty(window,"sessionStorage",{value:new S(),writable:true,configurable:true});}catch(err){}}})();</script>`;
    if (rawHtml.includes("<head>")) {
      responseBody = rawHtml.replace("<head>", `<head>${storageShim}`);
    } else if (rawHtml.includes("<HEAD>")) {
      responseBody = rawHtml.replace("<HEAD>", `<HEAD>${storageShim}`);
    } else {
      responseBody = storageShim + rawHtml;
    }
  }

  return new NextResponse(responseBody, {
    status: 200,
    headers,
  });
}
