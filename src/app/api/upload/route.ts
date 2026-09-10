import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { processAndCreateProject } from "@/lib/services/project-service";

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized: Missing or invalid Bearer token / session. Please provide 'Authorization: Bearer pp_live_...' or login.",
      },
      { status: 401 }
    );
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    let project;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      const htmlContent = body.html || body.code || body.content;
      if (!htmlContent) {
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
        tags: Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(",") : [],
        visibility: body.visibility || "public",
        isPinned: Boolean(body.isPinned),
        htmlContent,
      });
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const htmlContent = formData.get("html") as string | null;

      const title = (formData.get("title") as string) || "";
      const slug = (formData.get("slug") as string) || "";
      const description = (formData.get("description") as string) || "";
      const category = (formData.get("category") as string) || "tools";
      const tagsRaw = (formData.get("tags") as string) || "";
      const visibility = ((formData.get("visibility") as string) || "public") as "public" | "unlisted" | "private";
      const isPinned = formData.get("isPinned") === "true";

      const tags = tagsRaw
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean);

      if (file && file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        project = await processAndCreateProject({
          userId: currentUser.id === "selfhost-admin" ? undefined : currentUser.id,
          title,
          slug,
          description,
          category,
          tags,
          visibility,
          isPinned,
          fileBuffer,
          fileName: file.name,
        });
      } else if (htmlContent) {
        project = await processAndCreateProject({
          userId: currentUser.id === "selfhost-admin" ? undefined : currentUser.id,
          title,
          slug,
          description,
          category,
          tags,
          visibility,
          isPinned,
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
    console.error("API upload error:", err);
    return NextResponse.json(
      { success: false, error: (err as Error)?.message || "Failed to process and store project" },
      { status: 500 }
    );
  }
}
