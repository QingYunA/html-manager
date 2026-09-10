import { put, del, list } from "@vercel/blob";
import type { StorageProvider, StorageFile } from "./types";
import { getContentType } from "./mime";

export class VercelBlobStorageProvider implements StorageProvider {
  type = "vercel-blob" as const;
  private token: string;

  constructor(token?: string) {
    this.token = token || process.env.BLOB_READ_WRITE_TOKEN || "";
    if (!this.token) {
      throw new Error("BLOB_READ_WRITE_TOKEN is required for Vercel Blob storage");
    }
  }

  async uploadFile(filePath: string, content: Buffer | Uint8Array | string, contentType?: string): Promise<string> {
    const cType = contentType || getContentType(filePath);
    const buf = typeof content === "string" ? Buffer.from(content, "utf-8") : Buffer.from(content);
    const blob = await put(filePath, buf, {
      access: "public",
      token: this.token,
      contentType: cType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  async uploadBundle(prefix: string, files: StorageFile[]): Promise<void> {
    for (const file of files) {
      const fullPath = `${prefix}/${file.path}`.replace(/\/+/g, "/");
      await this.uploadFile(fullPath, file.content, file.contentType);
    }
  }

  async getFile(filePath: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const { blobs } = await list({ prefix: filePath, token: this.token, limit: 1 });
      const matched = blobs.find((b) => b.pathname === filePath) || blobs[0];
      if (!matched) return null;
      const res = await fetch(matched.downloadUrl || matched.url);
      if (!res.ok) return null;
      const arrayBuf = await res.arrayBuffer();
      const contentType = res.headers.get("content-type") || getContentType(filePath);
      return { data: Buffer.from(arrayBuf), contentType };
    } catch (err) {
      console.error("Vercel Blob getFile error:", err);
      return null;
    }
  }

  async deleteDirectory(prefix: string): Promise<void> {
    try {
      const { blobs } = await list({ prefix, token: this.token });
      const urls = blobs.map((b) => b.url);
      if (urls.length > 0) {
        await del(urls, { token: this.token });
      }
    } catch (err) {
      console.error("Vercel Blob deleteDirectory error:", err);
    }
  }
}
