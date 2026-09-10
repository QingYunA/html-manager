import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function cleanEnv(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");
}

export async function GET() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const cleanedUrl = cleanEnv(rawUrl);
  const cleanedKey = cleanEnv(rawKey);

  const diagnostic: Record<string, unknown> = {
    nodeVersion: process.version,
    envUrlLength: rawUrl.length,
    cleanedUrlLength: cleanedUrl.length,
    urlStartsWithHttps: cleanedUrl.startsWith("https://"),
    cleanedUrlValue: cleanedUrl.replace(/https:\/\/[^.]+\./, "https://***."),
    keyLength: rawKey.length,
    keyHasDot: cleanedKey.includes("."),
    keyDotCount: (cleanedKey.match(/\./g) || []).length,
  };

  try {
    const healthUrl = `${cleanedUrl}/auth/v1/health`;
    diagnostic.targetHealthUrl = healthUrl.replace(/https:\/\/[^.]+\./, "https://***.");

    const res = await fetch(healthUrl, {
      method: "GET",
      headers: {
        apikey: cleanedKey,
      },
      cache: "no-store",
    });

    diagnostic.fetchSuccess = true;
    diagnostic.status = res.status;
    diagnostic.statusText = res.statusText;
    diagnostic.body = await res.text();
  } catch (err: unknown) {
    diagnostic.fetchSuccess = false;
    const error = err as Error & { cause?: unknown; code?: string; errno?: number };
    diagnostic.errorMessage = error.message;
    diagnostic.errorCode = error.code;
    diagnostic.errorErrno = error.errno;
    diagnostic.errorCause = error.cause ? String(error.cause) : null;
    if (error.cause && typeof error.cause === "object") {
      diagnostic.errorCauseDetails = error.cause;
    }
  }

  return NextResponse.json(diagnostic);
}
