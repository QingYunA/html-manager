/**
 * Standard Web Crypto API (AES-GCM 256) implementation for Zero-Knowledge End-to-End Encryption.
 * Follows the RFC 3986 URL Hash Fragment pattern (similar to PrivateBin / Bitwarden Send).
 * The encryption key is strictly held on client-side memory or the URL #hash fragment,
 * and is NEVER transmitted over the wire to the HTTP server or database.
 */

export interface EncryptedPayload {
  ciphertext: Uint8Array;
  ivBase64: string; // 12-byte initialization vector (public, randomly generated)
  keyBase64: string; // 256-bit raw AES key (kept in client memory / URL hash)
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto API (crypto.subtle) is not available in this runtime environment.");
}

// Convert ArrayBuffer to Base64URL string
export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Convert Base64URL string to Uint8Array
export function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  if (typeof atob !== "undefined") {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, "base64"));
}

/**
 * Encrypts raw plaintext data (HTML string or binary bytes) using a fresh random 256-bit AES-GCM key.
 */
export async function encryptArtifact(data: string | Uint8Array | ArrayBuffer): Promise<EncryptedPayload> {
  const subtle = getSubtleCrypto();

  // 1. Generate cryptographically strong random 256-bit key
  const cryptoKey = await subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  // 2. Generate cryptographically random 12-byte IV
  const iv = new Uint8Array(12);
  if (typeof window !== "undefined") {
    window.crypto.getRandomValues(iv);
  } else {
    globalThis.crypto.getRandomValues(iv);
  }

  // 3. Prepare plaintext buffer
  let plaintextBuffer: ArrayBuffer;
  if (typeof data === "string") {
    plaintextBuffer = new TextEncoder().encode(data).buffer as ArrayBuffer;
  } else if (data instanceof Uint8Array) {
    plaintextBuffer = data.buffer as ArrayBuffer;
  } else {
    plaintextBuffer = data;
  }

  // 4. Perform AES-GCM encryption with 128-bit authentication tag
  const ciphertextBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    cryptoKey,
    plaintextBuffer
  );

  // 5. Export key to raw Base64URL format
  const rawKeyBuffer = await subtle.exportKey("raw", cryptoKey);
  const keyBase64 = bufferToBase64Url(rawKeyBuffer);
  const ivBase64 = bufferToBase64Url(iv);

  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    ivBase64,
    keyBase64,
  };
}

/**
 * Decrypts AES-GCM ciphertext using the provided Base64URL key and Base64URL IV.
 */
export async function decryptArtifact(
  ciphertext: Uint8Array | ArrayBuffer,
  keyBase64: string,
  ivBase64: string
): Promise<Uint8Array> {
  const subtle = getSubtleCrypto();

  const rawKey = base64UrlToBuffer(keyBase64);
  const iv = base64UrlToBuffer(ivBase64);

  const cryptoKey = await subtle.importKey(
    "raw",
    rawKey.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const ciphertextBuffer = ciphertext instanceof Uint8Array ? (ciphertext.buffer as ArrayBuffer) : ciphertext;

  const decryptedBuffer = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv.buffer as ArrayBuffer,
      tagLength: 128,
    },
    cryptoKey,
    ciphertextBuffer
  );

  return new Uint8Array(decryptedBuffer);
}

/**
 * Helper to decrypt into a UTF-8 string (e.g. decrypted HTML).
 */
export async function decryptArtifactToHtml(
  ciphertext: Uint8Array | ArrayBuffer,
  keyBase64: string,
  ivBase64: string
): Promise<string> {
  const bytes = await decryptArtifact(ciphertext, keyBase64, ivBase64);
  return new TextDecoder("utf-8").decode(bytes);
}

/**
 * Helper to parse encryption key from URL hash fragment, e.g. #key=xyz
 */
export function extractKeyFromUrlHash(hash: string): string | null {
  if (!hash) return null;
  const clean = hash.replace(/^#/, "");
  const params = new URLSearchParams(clean);
  return params.get("key") || clean || null;
}
