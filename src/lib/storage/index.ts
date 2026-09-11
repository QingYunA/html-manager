import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local";
import { VercelBlobStorageProvider } from "./vercel-blob";
import { CloudflareR2StorageProvider } from "./cloudflare-r2";

export * from "./types";
export * from "./mime";

let storageInstance: StorageProvider | null = null;

function hasVercelBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function hasCloudflareR2(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
  );
}

/**
 * Resolves the active storage provider.
 *
 * Selection: Vercel Blob -> Cloudflare R2 -> local filesystem.
 *
 * If a cloud provider is *configured* but fails to initialize, this throws instead of
 * silently degrading to local storage. Silent fallback used to make misconfigured
 * deployments surface as "uploads succeed but data disappears" once the serverless
 * filesystem is recycled, which is very hard to diagnose. Fail loudly instead.
 */
export function getStorage(): StorageProvider {
  if (storageInstance) return storageInstance;

  if (hasVercelBlob()) {
    try {
      storageInstance = new VercelBlobStorageProvider();
      return storageInstance;
    } catch (err) {
      throw new Error(
        `Vercel Blob is configured (BLOB_READ_WRITE_TOKEN) but failed to initialize: ${
          (err as Error)?.message || err
        }`
      );
    }
  }

  if (hasCloudflareR2()) {
    try {
      storageInstance = new CloudflareR2StorageProvider();
      return storageInstance;
    } catch (err) {
      throw new Error(
        `Cloudflare R2 is configured (R2_*) but failed to initialize: ${
          (err as Error)?.message || err
        }`
      );
    }
  }

  // No cloud provider configured: local filesystem is the intended development fallback.
  // On a serverless/hosted platform this filesystem is ephemeral, so warn loudly.
  const isHosted = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  if (isHosted) {
    console.error(
      "[STORAGE] No cloud storage configured (BLOB_READ_WRITE_TOKEN or R2_*). " +
        "Falling back to the local filesystem, which is EPHEMERAL on this platform — " +
        "uploaded artifacts may be lost after a redeploy or instance recycle."
    );
  }

  storageInstance = new LocalStorageProvider();
  return storageInstance;
}

export function getStorageType(): "local" | "vercel-blob" | "cloudflare-r2" {
  if (hasVercelBlob()) return "vercel-blob";
  if (hasCloudflareR2()) return "cloudflare-r2";
  return "local";
}
