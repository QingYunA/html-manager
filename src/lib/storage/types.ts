export interface StorageFile {
  path: string; // relative to prefix, e.g. "index.html", "assets/style.css"
  content: Buffer | Uint8Array;
  contentType: string;
}

export interface StorageProvider {
  type: "local" | "vercel-blob" | "cloudflare-r2";
  uploadFile(path: string, content: Buffer | Uint8Array | string, contentType?: string): Promise<string>;
  uploadBundle(prefix: string, files: StorageFile[]): Promise<void>;
  getFile(path: string): Promise<{ data: Buffer | Uint8Array; contentType: string } | null>;
  deleteDirectory(prefix: string): Promise<void>;
}
