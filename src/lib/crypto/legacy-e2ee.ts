/**
 * @deprecated LEGACY server-derivable key derivation.
 *
 * This module exists ONLY to migrate pre-existing `legacy-server` encrypted projects
 * to the zero-knowledge model. It is gated behind the ALLOW_LEGACY_MIGRATION flag
 * and must be deleted once all legacy projects have been migrated.
 *
 * The old scheme derived the AES key from `userId + server pepper`, meaning the server
 * (and anyone knowing the pepper) could decrypt artifacts. That is NOT zero-knowledge.
 */

import { base64UrlToBuffer, bufferToBase64Url } from "./e2ee";

function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error("Web Crypto API (crypto.subtle) is not available in this runtime environment.");
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

export async function deriveUserMasterKeyLegacy(userId: string, appSecret?: string): Promise<CryptoKey> {
  const subtle = getSubtleCrypto();
  const pepper =
    appSecret ||
    process.env.ENCRYPTION_PEPPER ||
    process.env.SESSION_SECRET ||
    "html-manager-vault-pepper-2026";
  const seedString = `html-manager-vault:${userId}:${pepper}`;
  const seedBytes = new TextEncoder().encode(seedString);
  const hash = await subtle.digest("SHA-256", seedBytes);

  return subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function decryptArtifactForUserLegacy(
  ciphertext: Uint8Array | ArrayBuffer | Buffer,
  userId: string,
  ivBase64: string
): Promise<string> {
  const subtle = getSubtleCrypto();
  const cryptoKey = await deriveUserMasterKeyLegacy(userId);
  const iv = base64UrlToBuffer(ivBase64);
  const safeCiphertext = toExactUint8Array(ciphertext);

  const decryptedBuffer = await subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer, tagLength: 128 },
    cryptoKey,
    safeCiphertext.buffer as ArrayBuffer
  );
  return new TextDecoder("utf-8").decode(decryptedBuffer);
}

export async function encryptArtifactForUserLegacy(
  data: string | Uint8Array | ArrayBuffer,
  userId: string
): Promise<{ ciphertext: Uint8Array; ivBase64: string }> {
  const subtle = getSubtleCrypto();
  const cryptoKey = await deriveUserMasterKeyLegacy(userId);
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
    plaintextBuffer = toExactUint8Array(data).buffer as ArrayBuffer;
  }

  const ciphertextBuffer = await subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    cryptoKey,
    plaintextBuffer
  );

  return { ciphertext: new Uint8Array(ciphertextBuffer), ivBase64: bufferToBase64Url(iv) };
}
