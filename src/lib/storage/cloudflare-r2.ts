import type { StorageProvider, StorageFile } from "./types";
import { getContentType } from "./mime";

/**
 * Cloudflare R2 (S3-compatible) storage provider.
 *
 * The AWS S3 SDK is imported lazily so that local-mode deployments do not pay the
 * module-graph / cold-start cost of @aws-sdk/client-s3 (~4MB of source). The SDK
 * is only loaded when an R2 operation actually executes.
 */
function cleanEnv(val?: string): string {
  if (!val) return "";
  return val
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
}

export class CloudflareR2StorageProvider implements StorageProvider {
  type = "cloudflare-r2" as const;
  private bucket: string;
  private accountId: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor() {
    const rawAccountId = cleanEnv(process.env.R2_ACCOUNT_ID);
    const accessKeyId = cleanEnv(process.env.R2_ACCESS_KEY_ID);
    const secretAccessKey = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);
    this.bucket = cleanEnv(process.env.R2_BUCKET_NAME) || "html-manager";

    // Strip https:// or http:// if user pasted the full endpoint into R2_ACCOUNT_ID
    const accountId = rawAccountId
      .replace(/^https?:\/\//i, "")
      .replace(/\.r2\.cloudflarestorage\.com.*$/i, "");

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("Missing Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)");
    }
    this.accountId = accountId;
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
  }

  private async getModules() {
    const [{ S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand }, { getSignedUrl }] =
      await Promise.all([
        import("@aws-sdk/client-s3"),
        import("@aws-sdk/s3-request-presigner"),
      ]);

    const endpoint = `https://${this.accountId}.r2.cloudflarestorage.com`;

    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });

    return { client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand, getSignedUrl };
  }

  async uploadFile(filePath: string, content: Buffer | Uint8Array | string, contentType?: string): Promise<string> {
    const cType = contentType || getContentType(filePath);
    const buf = typeof content === "string" ? Buffer.from(content, "utf-8") : Buffer.from(content);
    const { client, PutObjectCommand } = await this.getModules();
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: buf,
        ContentType: cType,
      })
    );
    return `/storage/${filePath}`;
  }

  async uploadBundle(prefix: string, files: StorageFile[]): Promise<void> {
    await Promise.all(
      files.map((file) => {
        const key = `${prefix}/${file.path}`.replace(/\/+/g, "/");
        return this.uploadFile(key, file.content, file.contentType);
      })
    );
  }

  async getFile(filePath: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const { client, GetObjectCommand } = await this.getModules();
      const res = await client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: filePath,
        })
      );
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      const contentType = res.ContentType || getContentType(filePath);
      return { data: Buffer.from(bytes), contentType };
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === "NoSuchKey" || error.name === "NotFound") {
        return null;
      }
      console.error("Cloudflare R2 getFile error:", err);
      return null;
    }
  }

  async deleteDirectory(prefix: string): Promise<void> {
    try {
      const { client, ListObjectsV2Command, DeleteObjectsCommand } = await this.getModules();
      const listRes = await client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
        })
      );
      if (listRes.Contents && listRes.Contents.length > 0) {
        const objects = listRes.Contents.map((item) => ({ Key: item.Key }));
        await client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: objects },
          })
        );
      }
    } catch (err) {
      console.error("Cloudflare R2 deleteDirectory error:", err);
    }
  }

  /**
   * Generates an S3 presigned PUT URL so the browser can directly stream or upload ciphertext
   * into Cloudflare R2 without passing through the Next.js server (zero server bandwidth).
   */
  async createPresignedUploadUrl(filePath: string, contentType: string, expiresInSec = 300): Promise<{ url: string; method: string }> {
    const { client, PutObjectCommand, getSignedUrl } = await this.getModules();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      ContentType: contentType,
    });
    const url = await getSignedUrl(client, command, { expiresIn: expiresInSec });
    return { url, method: "PUT" };
  }
}
