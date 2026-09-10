import { createBrowserClient } from "@supabase/ssr";

function cleanEnv(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
}

export function createSupabaseClient() {
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export function isClientCloudMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_APP_MODE === "cloud" ||
    Boolean(cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) && cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))
  );
}
