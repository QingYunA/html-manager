import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processAndCreateProject } from "@/lib/services/project-service";
import { uploadPayloadSchema, MAX_UPLOAD_BYTES } from "@/lib/validation";
import type { Project } from "@/db/schema";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser(request);
  if (!currentUser) {
    const authHeader = request.headers.get("authorization");
    const apiKeyHeader = request.headers.get("x-api-key");
    const tokenProvided = Boolean(
      (authHeader && authHeader.startsWith("Bearer ")) ||
      (apiKeyHeader && apiKeyHeader.startsWith("pp_live_"))
    );

    return NextResponse.json(
      {
        success: false,
        error: tokenProvided
          ? "Unauthorized: Invalid or unverified API token. Please ensure your token exists in database and has not been revoked."
          : "Unauthorized: Missing or invalid Bearer token / session. Please provide 'Authorization: Bearer pp_live_...' or login.",
      },
      { status: 401 }
    );
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    let project: Project;

    if (contentType.includes("application/json")) {
      const rawJson = await request.json();
      const parseResult = uploadPayloadSchema.safeParse(rawJson);
      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: parseResult.error.issues[0]?.message || "Invalid payload" },
          { status: 400 }
        );
      }

      const body = parseResult.data;
      const htmlContent = body.htmlContent || rawJson.html || rawJson.code || rawJson.content;
      if (!htmlContent || typeof htmlContent !== "string" || !htmlContent.trim()) {
        return NextResponse.json(
          { success: false, error: "Missing 'html' or 'code' field in JSON body" },
          { status: 400 }
        );
      }

      project = await processAndCreateProject({
        userId: currentUser.id === "selfhost-admin" ? undefined : currentUser.id,
        title: body.title,
        slug: body.slug,
        description: body.description,
        category: body.category,
        tags: body.tags,
        visibility: body.visibility,
        isPinned: body.isPinned,
        htmlContent,
      });
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const rawHtml = formData.get("html");
      const htmlContent = typeof rawHtml === "string" ? rawHtml : null;

      const rawVisibility = formData.get("visibility");
      const rawTags = formData.get("tags");

      const parseResult = uploadPayloadSchema.safeParse({
        title: typeof formData.get("title") === "string" ? (formData.get("title") as string) : undefined,
        slug: typeof formData.get("slug") === "string" ? (formData.get("slug") as string) : undefined,
        description: typeof formData.get("description") === "string" ? (formData.get("description") as string) : undefined,
        category: typeof formData.get("category") === "string" ? (formData.get("category") as string) : undefined,
        tags: typeof rawTags === "string" ? rawTags : [],
        visibility: typeof rawVisibility === "string" ? rawVisibility : "public",
        isPinned: formData.get("isPinned") === "true",
      });

      if (!parseResult.success) {
        return NextResponse.json(
          { success: false, error: parseResult.error.issues[0]?.message || "Invalid form data" },
          { status: 400 }
        );
      }

      const body = parseResult.data;

      if (file && file.size > 0) {
        if (file.size > MAX_UPLOAD_BYTES) {
          return NextResponse.json(
            { success: false, error: `File too large: maximum allowed upload size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB` },
            { status: 413 }
          );
        }

        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        project = await processAndCreateProject({
          userId: currentUser.id === "selfhost-admin" ? undefined : currentUser.id,
          title: body.title,
          slug: body.slug,
          description: body.description,
          category: body.category,
          tags: body.tags,
          visibility: body.visibility,
          isPinned: body.isPinned,
          fileBuffer,
          fileName: file.name,
        });
      } else if (htmlContent && htmlContent.trim()) {
        project = await processAndCreateProject({
          userId: currentUser.id === "selfhost-admin" ? undefined : currentUser.id,
          title: body.title,
          slug: body.slug,
          description: body.description,
          category: body.category,
          tags: body.tags,
          visibility: body.visibility,
          isPinned: body.isPinned,
          htmlContent,
        });
      } else {
        return NextResponse.json(
          { success: false, error: "Must provide either 'file' in form-data or 'html' text" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported Content-Type. Use multipart/form-data or application/json" },
        { status: 415 }
      );
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
    const proto = request.headers.get("x-forwarded-proto") || "http";
    const origin = `${proto}://${host}`;

    return NextResponse.json({
      success: true,
      id: project.id,
      title: project.title,
      slug: project.slug,
      url: `${origin}/p/${project.slug}`,
      rawUrl: `${origin}/raw/${project.slug}/`,
      category: project.category,
      tags: project.tags,
      visibility: project.visibility,
    });
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error("API upload error:", errorObj);
    return NextResponse.json(
      {
        success: false,
        error: errorObj?.message || "Failed to process and store project",
        stack: errorObj?.stack,
        details: String(err),
      },
      { status: 500 }
    );
  }
}
