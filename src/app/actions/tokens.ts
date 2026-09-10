"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  generatePersonalAccessToken,
  listUserApiTokens,
  revokeApiToken,
} from "@/lib/tokens";

export async function createTokenAction(name: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "请先登录后再创建 API 密钥" };
  }

  try {
    const result = await generatePersonalAccessToken(user.id, name);
    revalidatePath("/admin/settings/tokens");
    return {
      success: true,
      rawToken: result.rawToken,
      tokenRecord: result.tokenRecord,
    };
  } catch (err: unknown) {
    return { error: (err as Error)?.message || "创建 API 密钥失败" };
  }
}

export async function deleteTokenAction(tokenId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  try {
    const success = await revokeApiToken(tokenId, user.id);
    revalidatePath("/admin/settings/tokens");
    return { success };
  } catch (err: unknown) {
    return { error: (err as Error)?.message || "撤销 API 密钥失败" };
  }
}

export async function getUserTokensAction() {
  const user = await getCurrentUser();
  if (!user) return [];
  return await listUserApiTokens(user.id);
}
