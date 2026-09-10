import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function cleanEnv(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Can be ignored if called from a Server Component
        }
      },
    },
  });
}

export function isCloudMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_APP_MODE === "cloud" ||
    Boolean(cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) && cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  );
}
