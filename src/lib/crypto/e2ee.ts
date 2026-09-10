/**
 * Standard Web Crypto API (AES-GCM 256) implementation for Tenant-level Encryption.
 * Uses user-scoped salt & secret to seamlessly encrypt and decrypt user artifacts.
 * The owner seamlessly views decrypted artifacts when authenticated, without copy-pasting raw keys.
 */

export interface EncryptedPayload {
  ciphertext: Uint8Array;
  ivBase64: string; // 12-byte initialization vector (public, randomly generated)
  keyBase64: string; // 256-bit raw AES key
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

export function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Accurately slices any ArrayBuffer / Buffer / Uint8Array into a standalone Uint8Array
 * with an exact ArrayBuffer (preventing Node.js Buffer shared pool 8192-byte overflow).
 */
function toExactUint8Array(input: ArrayBuffer | Uint8Array | Buffer): Uint8Array {
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) {
    return new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
  }
  if (input instanceof Uint8Array) {
    if (input.byteOffset === 0 && input.byteLength === input.buffer.byteLength) {
      return input;
    }
    return new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
  }
  return new Uint8Array(input);
}

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
  const buf = Buffer.from(base64, "base64");
  return toExactUint8Array(buf);
}

/**
 * Derives a deterministic 256-bit AES-GCM CryptoKey for a specific user.
 * Combines user ID + server secret pepper via SHA-256.
 */
export async function deriveUserMasterKey(userId: string, appSecret?: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const pepper = appSecret || process.env.ENCRYPTION_PEPPER || process.env.SESSION_SECRET || "html-manager-vault-pepper-2026";
  const seedString = `html-manager-vault:${userId}:${pepper}`;
  const seedBytes = new TextEncoder().encode(seedString);

  // Hash seed to 256-bit
  const hash = await subtle.digest("SHA-256", seedBytes);

  return await subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    true, // extractable so API can return key to client
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts raw plaintext with a provided base64 raw key (e.g. from user auth)
 */
export async function encryptWithRawKey(
  data: string | Uint8Array | ArrayBuffer,
  keyBase64: string
): Promise<{ ciphertext: Uint8Array; ivBase64: string }> {
  const subtle = getSubtleCrypto();
  const rawKey = base64UrlToBuffer(keyBase64);
  const cryptoKey = await subtle.importKey(
    "raw",
    rawKey.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = new Uint8Array(12);
  if (typeof window !== "undefined") {
    window.crypto.getRandomValues(iv);
  } else {
    globalThis.crypto.getRandomValues(iv);
  }

  let plaintextBuffer: ArrayBuffer;
  if (typeof data === "string") {
    plaintextBuffer = new TextEncoder().encode(data).buffer as ArrayBuffer;
  } else {
    const exactBytes = toExactUint8Array(data);
    plaintextBuffer = exactBytes.buffer as ArrayBuffer;
  }

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    cryptoKey,
    plaintextBuffer
  );

  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    ivBase64: bufferToBase64Url(iv),
  };
}

/**
 * Encrypts raw plaintext using user master key
 */
export async function encryptArtifactForUser(
  data: string | Uint8Array | ArrayBuffer,
  userId: string
): Promise<{ ciphertext: Uint8Array; ivBase64: string }> {
  const subtle = getSubtleCrypto();
  const cryptoKey = await deriveUserMasterKey(userId);

  const iv = new Uint8Array(12);
  if (typeof window !== "undefined") {
    window.crypto.getRandomValues(iv);
  } else {
    globalThis.crypto.getRandomValues(iv);
  }

  let plaintextBuffer: ArrayBuffer;
  if (typeof data === "string") {
    plaintextBuffer = new TextEncoder().encode(data).buffer as ArrayBuffer;
  } else {
    const exactBytes = toExactUint8Array(data);
    plaintextBuffer = exactBytes.buffer as ArrayBuffer;
  }

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    cryptoKey,
    plaintextBuffer
  );

  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    ivBase64: bufferToBase64Url(iv),
  };
}

/**
 * Decrypts ciphertext seamlessly for authenticated user
 */
export async function decryptArtifactForUser(
  ciphertext: Uint8Array | ArrayBuffer | Buffer,
  userId: string,
  ivBase64: string
): Promise<string> {
  const subtle = getSubtleCrypto();
  const cryptoKey = await deriveUserMasterKey(userId);
  const iv = base64UrlToBuffer(ivBase64);
  const safeCiphertext = toExactUint8Array(ciphertext);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv.buffer as ArrayBuffer,
      tagLength: 128,
    },
    cryptoKey,
    safeCiphertext.buffer as ArrayBuffer
  );

  return new TextDecoder("utf-8").decode(decryptedBuffer);
}

/**
 * Random key based encryption
 */
export async function encryptArtifact(data: string | Uint8Array | ArrayBuffer): Promise<EncryptedPayload> {
  const subtle = getSubtleCrypto();
  const cryptoKey = await subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const iv = new Uint8Array(12);
  if (typeof window !== "undefined") {
    window.crypto.getRandomValues(iv);
  } else {
    globalThis.crypto.getRandomValues(iv);
  }

  let plaintextBuffer: ArrayBuffer;
  if (typeof data === "string") {
    plaintextBuffer = new TextEncoder().encode(data).buffer as ArrayBuffer;
  } else {
    const exactBytes = toExactUint8Array(data);
    plaintextBuffer = exactBytes.buffer as ArrayBuffer;
  }

  const ciphertextBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      tagLength: 128,
    },
    cryptoKey,
    plaintextBuffer
  );

  const rawKeyBuffer = await subtle.exportKey("raw", cryptoKey);
  return {
    ciphertext: new Uint8Array(ciphertextBuffer),
    ivBase64: bufferToBase64Url(iv),
    keyBase64: bufferToBase64Url(rawKeyBuffer),
  };
}

export async function decryptArtifactToHtml(
  ciphertext: Uint8Array | ArrayBuffer | Buffer,
  keyBase64: string,
  ivBase64: string
): Promise<string> {
  const subtle = getSubtleCrypto();
  const rawKey = base64UrlToBuffer(keyBase64);
  const iv = base64UrlToBuffer(ivBase64);
  const safeCiphertext = toExactUint8Array(ciphertext);

  const cryptoKey = await subtle.importKey(
    "raw",
    rawKey.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decryptedBuffer = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv.buffer as ArrayBuffer,
      tagLength: 128,
    },
    cryptoKey,
    safeCiphertext.buffer as ArrayBuffer
  );

  return new TextDecoder("utf-8").decode(decryptedBuffer);
}

export function extractKeyFromUrlHash(hash: string): string | null {
  if (!hash) return null;
  const clean = hash.replace(/^#/, "");
  const params = new URLSearchParams(clean);
  return params.get("key") || clean || null;
}
