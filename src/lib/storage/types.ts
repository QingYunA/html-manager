export interface StorageFile {
  path: string; // relative to prefix, e.g. "index.html", "assets/style.css"
  content: Buffer | Uint8Array;
  contentType: string;
}

export interface StorageProvider {
  type: "local" | "vercel-blob" | "cloudflare-r2" | "supabase";
  uploadFile(path: string, content: Buffer | Uint8Array | string, contentType?: string): Promise<string>;
  uploadBundle(prefix: string, files: StorageFile[]): Promise<void>;
  getFile(path: string): Promise<{ data: Buffer | Uint8Array; contentType: string } | null>;
  deleteDirectory(prefix: string): Promise<void>;
  // Direct client upload via Presigned URL (zero server bandwidth consumption)
  createPresignedUploadUrl?(path: string, contentType: string, expiresInSec?: number): Promise<{ url: string; method: string }>;
}
