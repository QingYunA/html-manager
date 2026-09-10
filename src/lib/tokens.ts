import crypto from "node:crypto";
import { nanoid } from "nanoid";
import { createApiTokenRecord, findApiTokenByHash, touchApiTokenLastUsed, deleteApiTokenById, getApiTokensByUserId } from "@/db";
import type { ApiToken } from "@/db/schema";

const TOKEN_PREFIX = "pp_live_";

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
}

export interface GeneratedTokenResult {
  rawToken: string;
  tokenRecord: ApiToken;
}

/**
 * Generate a new user-scoped Personal Access Token.
 * Raw token is only returned once upon creation.
 */
export async function generatePersonalAccessToken(
  userId: string,
  name: string
): Promise<GeneratedTokenResult> {
  const randomEntropy = crypto.randomBytes(24).toString("hex");
  const rawToken = `${TOKEN_PREFIX}${randomEntropy}`;
  const tokenHash = hashToken(rawToken);
  const tokenHint = rawToken.slice(-4);
  const id = `tok_${nanoid(12)}`;

  const tokenRecord = await createApiTokenRecord({
    id,
    userId,
    name: name.trim() || "Default API Key",
    tokenHash,
    tokenHint,
    lastUsedAt: null,
  });

  return {
    rawToken,
    tokenRecord,
  };
}

/**
 * Validate a raw bearer token or API key against the database.
 * If valid, updates lastUsedAt asynchronously and returns associated user info.
 */
export async function verifyAndConsumeToken(rawToken: string): Promise<{ userId: string; tokenId: string; name: string } | null> {
  if (!rawToken || typeof rawToken !== "string") return null;
  const cleaned = rawToken.trim();
  if (!cleaned.startsWith(TOKEN_PREFIX)) return null;

  const tokenHash = hashToken(cleaned);
  const matched = await findApiTokenByHash(tokenHash);
  if (!matched) return null;

  // Asynchronously update last used timestamp without blocking request
  touchApiTokenLastUsed(matched.id).catch((err) => {
    console.error("Failed to touch token lastUsedAt:", err);
  });

  return {
    userId: matched.userId,
    tokenId: matched.id,
    name: matched.name,
  };
}

export async function listUserApiTokens(userId: string): Promise<ApiToken[]> {
  return await getApiTokensByUserId(userId);
}

export async function revokeApiToken(tokenId: string, userId: string): Promise<boolean> {
  return await deleteApiTokenById(tokenId, userId);
}
