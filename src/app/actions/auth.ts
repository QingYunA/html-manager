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
  const rawRedirectPath = formString(formData, "from") || "/admin";
  const redirectPath = sanitizeRedirectPath(rawRedirectPath, "/admin");

  if (!password) {
    return { error: "请输入密码" };
  }

  const isValid = await verifyPassword(password);
  if (!isValid) {
    return { error: "密码错误，请重试" };
  }

  const token = await createAdminSessionToken();
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
  const rawRedirectPath = formString(formData, "from") || "/admin";
  const redirectPath = sanitizeRedirectPath(rawRedirectPath, "/admin");

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
  if (isCloudMode()) {
    try {
      const supabase = await createSupabaseServerClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }
  }

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/admin/login");
}
