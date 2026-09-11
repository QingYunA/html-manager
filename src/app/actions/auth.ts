"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword, createAdminSessionToken, COOKIE_NAME } from "@/lib/auth";
import { createSupabaseServerClient, isCloudMode } from "@/lib/supabase/server";
import { sanitizeRedirectPath } from "@/lib/safe-redirect";

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function loginAdmin(prevState: { error?: string } | null, formData: FormData) {
  const password = formString(formData, "password");
  const rawRedirectPath = formString(formData, "from") || "/workspace";
  const redirectPath = sanitizeRedirectPath(rawRedirectPath, "/workspace");

  if (!password) {
    return { error: "请输入密码" };
  }

  const isValid = await verifyPassword(password);
  if (!isValid) {
    return { error: "密码错误，请重试" };
  }

  let token: string;
  try {
    token = await createAdminSessionToken();
  } catch {
    // Fail closed with a clear message instead of a 500 when no signing secret is configured.
    return { error: "服务端未配置会话密钥（SESSION_SECRET，至少 16 位），暂时无法登录" };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  redirect(redirectPath);
}

export async function loginWithEmailAction(prevState: { error?: string } | null, formData: FormData) {
  const email = formString(formData, "email").trim();
  const password = formString(formData, "password").trim();
  const isSignUp = formData.get("isSignUp") === "true";
  const rawRedirectPath = formString(formData, "from") || "/workspace";
  const redirectPath = sanitizeRedirectPath(rawRedirectPath, "/workspace");

  if (!email || !password) {
    return { error: "请输入邮箱与密码" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: "当前未配置 Supabase 认证环境变量" };
  }

  if (isSignUp) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: error.message };
    }
  }

  redirect(redirectPath);
}

export async function logoutAdmin() {
  const cookieStore = await cookies();

  if (isCloudMode()) {
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Supabase signOut timeout")), 2000)
          ),
        ]);
      }
    } catch (err) {
      console.warn("Supabase server signOut warning or timeout:", err);
    }
  }

  try {
    const allCookies = cookieStore.getAll();
    for (const c of allCookies) {
      if (
        c.name === COOKIE_NAME ||
        c.name.startsWith("sb-") ||
        c.name.includes("supabase") ||
        c.name.includes("auth-token")
      ) {
        cookieStore.delete(c.name);
      }
    }
  } catch (err) {
    console.warn("Failed to delete auth cookies:", err);
  }

  return { success: true };
}

