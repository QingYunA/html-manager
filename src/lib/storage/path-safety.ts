import path from "node:path";

export class UnsafePathError extends Error {
  constructor(message = "Unsafe storage path detected") {
    super(message);
    this.name = "UnsafePathError";
  }
}

/**
 * Validates and resolves a storage path relative to a base directory,
 * guaranteeing the resolved path cannot escape the base directory.
 * Rejects path traversal (..), null bytes, and non-canonical separators.
 */
export function assertSafeStoragePath(baseDir: string, relativePath: string): string {
  if (!relativePath || typeof relativePath !== "string") {
    throw new UnsafePathError("Missing or invalid relative path");
  }

  // Reject null bytes
  if (relativePath.includes("\0")) {
    throw new UnsafePathError("Null byte in path");
  }

  // Reject backslashes on POSIX / normalize for traversal detection
  const normalized = relativePath.replace(/\\/g, "/");

  // Check for path traversal segments
  const segments = normalized.split("/");
  for (const seg of segments) {
    if (seg === ".." || seg === ".") {
      throw new UnsafePathError(`Path traversal segment '${seg}' is forbidden`);
    }
  }

  const resolvedBase = path.resolve(baseDir);
  const resolvedFull = path.resolve(resolvedBase, normalized);

  // Containment check
  if (resolvedFull !== resolvedBase && !resolvedFull.startsWith(resolvedBase + path.sep)) {
    throw new UnsafePathError(`Resolved path escapes base directory: ${relativePath}`);
  }

  return resolvedFull;
}

/**
 * Validates an abstract storage key (for S3/R2/Blob/Local) without a filesystem base.
 * Ensures the key is strictly scoped under expected prefix and has no traversal.
 */
export function assertSafeStorageKey(key: string, requiredPrefix?: string): string {
  if (!key || typeof key !== "string") {
    throw new UnsafePathError("Missing or invalid storage key");
  }

  if (key.includes("\0")) {
    throw new UnsafePathError("Null byte in storage key");
  }

  const normalized = key.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+/, "");

  const segments = normalized.split("/");
  for (const seg of segments) {
    if (seg === ".." || seg === ".") {
      throw new UnsafePathError(`Path traversal segment '${seg}' in storage key`);
    }
  }

  if (requiredPrefix) {
    const cleanPrefix = requiredPrefix.replace(/\/+$/, "");
    if (normalized !== cleanPrefix && !normalized.startsWith(cleanPrefix + "/")) {
      throw new UnsafePathError(`Storage key must start with '${cleanPrefix}/'`);
    }
  }

  return normalized;
}
