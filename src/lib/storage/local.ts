import fs from "node:fs";
import path from "node:path";
import type { StorageProvider, StorageFile } from "./types";
import { getContentType } from "./mime";
import { assertSafeStoragePath } from "./path-safety";

export class LocalStorageProvider implements StorageProvider {
  type = "local" as const;
  private baseDir: string;

  constructor(baseDir = path.join(process.cwd(), ".storage")) {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private resolve(filePath: string): string {
    return assertSafeStoragePath(this.baseDir, filePath);
  }

  async uploadFile(filePath: string, content: Buffer | Uint8Array | string, _contentType?: string): Promise<string> {
    const fullPath = this.resolve(filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const buf = typeof content === "string" ? Buffer.from(content, "utf-8") : Buffer.from(content);
    fs.writeFileSync(fullPath, buf);
    return `/storage/${filePath}`;
  }

  async uploadBundle(prefix: string, files: StorageFile[]): Promise<void> {
    for (const file of files) {
      const fullRelative = path.join(prefix, file.path);
      await this.uploadFile(fullRelative, file.content, file.contentType);
    }
  }

  async getFile(filePath: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const fullPath = this.resolve(filePath);
      if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
        return null;
      }
      const data = fs.readFileSync(fullPath);
      const contentType = getContentType(filePath);
      return { data, contentType };
    } catch {
      return null;
    }
  }

  async deleteDirectory(prefix: string): Promise<void> {
    try {
      const fullPath = this.resolve(prefix);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    } catch (e) {
      console.error("deleteDirectory failed:", e);
    }
  }

  // Local fallback simulation of direct upload endpoint
  async createPresignedUploadUrl(filePath: string): Promise<{ url: string; method: string }> {
    // Validate storage path before vending presigned URL
    this.resolve(filePath);
    return {
      url: `/api/upload/direct-local?path=${encodeURIComponent(filePath)}`,
      method: "PUT",
    };
  }
}
