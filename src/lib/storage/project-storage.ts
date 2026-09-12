import { getStorage } from "./index";
import type { StorageProvider, StorageFile } from "./types";
import { assertSafeStorageKey } from "./path-safety";
import { getContentType } from "./mime";

export interface ProjectStorage {
  readonly slug: string;
  readonly storagePrefix: string;
  writeEntryFile(content: Buffer | Uint8Array | string, entryName?: string): Promise<string>;
  readEntryFile(entryName?: string): Promise<{ data: Buffer | Uint8Array; contentType: string } | null>;
  writeBundle(files: StorageFile[]): Promise<void>;
  readFile(relativePath: string): Promise<{ data: Buffer | Uint8Array; contentType: string } | null>;
  writeAsset(relativePath: string, content: Buffer | Uint8Array | string, contentType?: string): Promise<string>;
  deleteProjectFiles(): Promise<void>;
}

export class DefaultProjectStorage implements ProjectStorage {
  readonly slug: string;
  readonly storagePrefix: string;
  private readonly provider: StorageProvider;

  constructor(slug: string, provider?: StorageProvider) {
    if (!slug || typeof slug !== "string") {
      throw new Error("Invalid slug for ProjectStorage");
    }
    this.slug = slug.trim().toLowerCase();
    this.storagePrefix = `sites/${this.slug}`;
    this.provider = provider || getStorage();
  }

  private resolveKey(relativePath: string): string {
    const cleanRelative = relativePath.replace(/^sites\/[^/]+\/?/, "").replace(/^\/+/, "");
    const fullKey = `${this.storagePrefix}/${cleanRelative}`;
    return assertSafeStorageKey(fullKey, this.storagePrefix);
  }

  async writeEntryFile(content: Buffer | Uint8Array | string, entryName = "index.html"): Promise<string> {
    const key = this.resolveKey(entryName);
    return await this.provider.uploadFile(key, content, "text/html; charset=utf-8");
  }

  async readEntryFile(entryName = "index.html"): Promise<{ data: Buffer | Uint8Array; contentType: string } | null> {
    const key = this.resolveKey(entryName);
    return await this.provider.getFile(key);
  }

  async writeBundle(files: StorageFile[]): Promise<void> {
    // Validate each file path
    for (const f of files) {
      this.resolveKey(f.path);
    }
    return await this.provider.uploadBundle(this.storagePrefix, files);
  }

  async readFile(relativePath: string): Promise<{ data: Buffer | Uint8Array; contentType: string } | null> {
    const key = this.resolveKey(relativePath);
    return await this.provider.getFile(key);
  }

  async writeAsset(relativePath: string, content: Buffer | Uint8Array | string, contentType?: string): Promise<string> {
    const key = this.resolveKey(relativePath);
    const resolvedContentType = contentType || getContentType(relativePath);
    return await this.provider.uploadFile(key, content, resolvedContentType);
  }

  async deleteProjectFiles(): Promise<void> {
    await this.provider.deleteDirectory(this.storagePrefix);
  }
}

export function getProjectStorage(slug: string, provider?: StorageProvider): ProjectStorage {
  return new DefaultProjectStorage(slug, provider);
}
