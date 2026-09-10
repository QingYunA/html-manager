import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { StorageProvider, StorageFile } from "./types";
import { getContentType } from "./mime";

export class CloudflareR2StorageProvider implements StorageProvider {
  type = "cloudflare-r2" as const;
  private client: S3Client;
  private bucket: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucket = process.env.R2_BUCKET_NAME || "html-manager";

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("Missing Cloudflare R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)");
    }

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async uploadFile(filePath: string, content: Buffer | Uint8Array | string, contentType?: string): Promise<string> {
    const cType = contentType || getContentType(filePath);
    const buf = typeof content === "string" ? Buffer.from(content, "utf-8") : Buffer.from(content);
    await this.client.send(
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
    for (const file of files) {
      const key = `${prefix}/${file.path}`.replace(/\/+/g, "/");
      await this.uploadFile(key, file.content, file.contentType);
    }
  }

  async getFile(filePath: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const res = await this.client.send(
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
      const listRes = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
        })
      );
      if (listRes.Contents && listRes.Contents.length > 0) {
        const objects = listRes.Contents.map((item) => ({ Key: item.Key }));
        await this.client.send(
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
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSec });
    return { url, method: "PUT" };
  }
}
