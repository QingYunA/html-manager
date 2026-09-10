import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local";
import { VercelBlobStorageProvider } from "./vercel-blob";
import { CloudflareR2StorageProvider } from "./cloudflare-r2";

export * from "./types";
export * from "./mime";

let storageInstance: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (storageInstance) return storageInstance;

  // 1. Check for Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      storageInstance = new VercelBlobStorageProvider();
      return storageInstance;
    } catch (err) {
      console.warn("Failed to initialize Vercel Blob storage, falling back:", err);
    }
  }

  // 2. Check for Cloudflare R2
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  ) {
    try {
      storageInstance = new CloudflareR2StorageProvider();
      return storageInstance;
    } catch (err) {
      console.warn("Failed to initialize Cloudflare R2 storage, falling back:", err);
    }
  }

  // 3. Fallback to Local Storage
  storageInstance = new LocalStorageProvider();
  return storageInstance;
}

export function getStorageType(): "local" | "vercel-blob" | "cloudflare-r2" {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel-blob";
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  ) {
    return "cloudflare-r2";
  }
  return "local";
}
