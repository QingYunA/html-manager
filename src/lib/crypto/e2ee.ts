/**
 * Zero-Knowledge End-to-End Encryption (AES-GCM 256) for hosted HTML artifacts.
 *
 * Security model:
 * - The encryption key is derived or generated ENTIRELY in the browser.
 * - The server only ever stores ciphertext plus public KDF parameters (salt, iterations).
 * - The server never receives the passphrase or the raw key, and therefore cannot decrypt.
 *
 * Two key modes are supported:
 * - `zk-passphrase`: PBKDF2-SHA256(passphrase, random salt, iterations) -> AES-GCM-256.
 * - `zk-recovery`:   a random 256-bit key, shown once, embedded in a share URL fragment (#key=...).
 *
 * The URL fragment is never sent to the server, which is what keeps the key out of server logs.
 */

export const KDF_ITERATIONS_DEFAULT = 600_000;
export const SALT_BYTES = 16;
export const RECOVERY_KEY_BYTES = 32;

export type KeyMode = "legacy-server" | "zk-passphrase" | "zk-recovery";

export interface EncryptedPayload {
  ciphertext: Uint8Array;
  ivBase64: string;
  keyBase64: string;
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

function getRandomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    globalThis.crypto.getRandomValues(bytes);
  }
  return bytes;
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
  return new Uint8Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

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

function toPlaintextBuffer(data: string | Uint8Array | ArrayBuffer): ArrayBuffer {
  if (typeof data === "string") {
    return new TextEncoder().encode(data).buffer as ArrayBuffer;
  }
  return toExactUint8Array(data).buffer as ArrayBuffer;
}

/** Generates a cryptographically random KDF salt (base64url). */
export function generateSalt(): string {
  return bufferToBase64Url(getRandomBytes(SALT_BYTES));
}

/** Generates a random 256-bit recovery key (base64url) and its non-extractable CryptoKey. */
export async function generateRecoveryKey(): Promise<{ keyBase64: string; key: CryptoKey }> {
  const raw = getRandomBytes(RECOVERY_KEY_BYTES);
  const keyBase64 = bufferToBase64Url(raw);
  const key = await importRecoveryKey(keyBase64);
  return { keyBase64, key };
}

/** Imports a base64url recovery key as a non-extractable AES-GCM CryptoKey. */
export async function importRecoveryKey(keyBase64: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const raw = base64UrlToBuffer(keyBase64);
  if (raw.byteLength !== RECOVERY_KEY_BYTES) {
    throw new Error("Invalid recovery key length");
  }
  return subtle.importKey("raw", raw.buffer as ArrayBuffer, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Derives a non-extractable AES-GCM key from a passphrase using PBKDF2-SHA256. */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  saltBase64: string,
  iterations: number = KDF_ITERATIONS_DEFAULT
): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const salt = base64UrlToBuffer(saltBase64);
  const material = await subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypts plaintext with a CryptoKey. IV is random 12 bytes, returned base64url. */
export async function encryptWithKey(
  key: CryptoKey,
  data: string | Uint8Array | ArrayBuffer
): Promise<{ ciphertext: Uint8Array; ivBase64: string }> {
  const subtle = getSubtleCrypto();
  const iv = getRandomBytes(12);
  const ciphertextBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    toPlaintextBuffer(data)
  );
  return { ciphertext: new Uint8Array(ciphertextBuffer), ivBase64: bufferToBase64Url(iv) };
}

/** Decrypts ciphertext with a CryptoKey, returning UTF-8 text. */
export async function decryptWithKey(
  key: CryptoKey,
  ciphertext: Uint8Array | ArrayBuffer | Buffer,
  ivBase64: string
): Promise<string> {
  const subtle = getSubtleCrypto();
  const iv = base64UrlToBuffer(ivBase64);
  const safeCiphertext = toExactUint8Array(ciphertext);
  const decryptedBuffer = await subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer, tagLength: 128 },
    key,
    safeCiphertext.buffer as ArrayBuffer
  );
  return new TextDecoder("utf-8").decode(decryptedBuffer);
}

/**
 * Encrypts using a passphrase. Returns ciphertext plus the salt/iterations to persist server-side.
 */
export async function encryptWithPassphrase(
  data: string | Uint8Array | ArrayBuffer,
  passphrase: string,
  iterations: number = KDF_ITERATIONS_DEFAULT
): Promise<{ ciphertext: Uint8Array; ivBase64: string; saltBase64: string; iterations: number }> {
  const saltBase64 = generateSalt();
  const key = await deriveKeyFromPassphrase(passphrase, saltBase64, iterations);
  const { ciphertext, ivBase64 } = await encryptWithKey(key, data);
  return { ciphertext, ivBase64, saltBase64, iterations };
}

export function extractKeyFromUrlHash(hash: string): string | null {
  if (!hash) return null;
  const clean = hash.replace(/^#/, "");
  const params = new URLSearchParams(clean);
  return params.get("key") || clean || null;
}

// ---------------------------------------------------------------------------
// Local (owner browser) key cache. Keys NEVER leave the browser.
// ---------------------------------------------------------------------------

const LOCAL_KEY_PREFIX = "html_manager_e2ee_";

export function saveLocalProjectKey(slug: string, payload: { keyMode: KeyMode; key?: string; passphrase?: string }): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${LOCAL_KEY_PREFIX}${slug}`, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable (private mode); the user can still use the share link
  }
}

export function loadLocalProjectKey(slug: string): { keyMode: KeyMode; key?: string; passphrase?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${LOCAL_KEY_PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.keyMode === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearLocalProjectKey(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(`${LOCAL_KEY_PREFIX}${slug}`);
  } catch {
    // ignore
  }
}
