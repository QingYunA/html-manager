"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { tokenNameSchema } from "@/lib/validation";
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

  const parsedName = tokenNameSchema.safeParse(name);
  if (!parsedName.success) {
    return { error: parsedName.error.issues[0]?.message || "密钥名称不合法" };
  }

  try {
    const result = await generatePersonalAccessToken(user.id, parsedName.data);
    revalidatePath("/admin/settings/tokens");
    return {
      success: true,
      rawToken: result.rawToken,
      tokenRecord: result.tokenRecord,
    };
  } catch (err: unknown) {
    const message = (err as Error)?.message || "";
    console.error("createTokenAction error:", err);
    return {
      error: message
        ? `生成 API 密钥失败: ${message}`
        : "生成 API 密钥失败，请稍后重试",
    };
  }
}

export async function deleteTokenAction(tokenId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "请先登录后再操作" };
  }

  try {
    const success = await revokeApiToken(tokenId, user.id);
    revalidatePath("/admin/settings/tokens");
    return { success };
  } catch (err: unknown) {
    const message = (err as Error)?.message || "";
    console.error("deleteTokenAction error:", err);
    return {
      error: message
        ? `撤销 API 密钥失败: ${message}`
        : "撤销 API 密钥失败，请稍后重试",
    };
  }
}

export async function getUserTokensAction() {
  const user = await getCurrentUser();
  if (!user) return [];
  return await listUserApiTokens(user.id);
}
