import JSZip from "jszip";
import type { StorageFile } from "../storage/types";
import { getContentType } from "../storage/mime";

export interface ExtractedMetadata {
  title: string;
  description: string;
}

export function extractMetadataFromHtml(html: string): ExtractedMetadata {
  let title = "";
  let description = "";

  // Extract <title>...</title>
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }

  // Extract <meta name="description" content="..."> or property="og:description"
  const descMatch =
    html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
    html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i) ||
    html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);

  if (descMatch && descMatch[1]) {
    description = descMatch[1].trim();
  }

  // Fallback title from <h1> if <title> is generic or missing
  if (!title || title.toLowerCase() === "document" || title.toLowerCase() === "vite app") {
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      const cleanH1 = h1Match[1].replace(/<[^>]+>/g, "").trim();
      if (cleanH1) title = cleanH1;
    }
  }

  return { title: title || "Untitled Project", description };
}

export async function unpackZipBundle(
  zipBuffer: Buffer | ArrayBuffer
): Promise<{ files: StorageFile[]; entryPath: string; initialHtml?: string }> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const files: StorageFile[] = [];
  let entryPath = "index.html";
  let initialHtml = "";

  // Check all file entries
  const fileEntries: { name: string; zipEntry: JSZip.JSZipObject }[] = [];
  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && !relativePath.startsWith("__MACOSX/") && !relativePath.includes(".DS_Store")) {
      fileEntries.push({ name: relativePath, zipEntry });
    }
  });

  // Find index.html or top-level html
  const exactIndex = fileEntries.find((f) => f.name.toLowerCase() === "index.html");
  const anyIndex = fileEntries.find((f) => f.name.toLowerCase().endsWith("/index.html"));
  const anyHtml = fileEntries.find((f) => f.name.toLowerCase().endsWith(".html"));

  if (exactIndex) {
    entryPath = exactIndex.name;
  } else if (anyIndex) {
    entryPath = anyIndex.name;
  } else if (anyHtml) {
    entryPath = anyHtml.name;
  }

  for (const { name, zipEntry } of fileEntries) {
    const content = await zipEntry.async("nodebuffer");
    const contentType = getContentType(name);
    files.push({
      path: name,
      content,
      contentType,
    });
    if (name === entryPath) {
      initialHtml = content.toString("utf-8");
    }
  }

  return { files, entryPath, initialHtml };
}
