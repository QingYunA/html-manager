/**
 * Sanitizes a redirect path to prevent open redirects.
 * Only allows same-origin relative paths starting with a single '/'
 * and explicitly disallows protocol-relative URLs (//) and backslashes.
 */
export function sanitizeRedirectPath(
  input: string | null | undefined,
  fallback = "/workspace"
): string {
  if (!input || typeof input !== "string") {
    return fallback;
  }

  const trimmed = input.trim();

  // Must start with exactly one '/' and not followed by another '/' or '\'
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Reject scheme/protocol indicators inside path
  if (trimmed.includes(":") && /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed.slice(1))) {
    return fallback;
  }

  // Disallow null bytes and whitespace control chars
  if (/[\x00-\x1F\x7F\s]/.test(trimmed)) {
    return fallback;
  }

  // Automatically normalize legacy /admin path to /workspace
  if (trimmed === "/admin") {
    return "/workspace";
  }
  if (trimmed.startsWith("/admin/")) {
    return trimmed.replace(/^\/admin/, "/workspace");
  }

  return trimmed;
}

/**
 * Validates a redirect target against the expected origin.
 * Used for OAuth callback where `next` may come from a query param.
 */
export function sanitizeNextParam(
  nextParam: string | null | undefined,
  fallback = "/workspace"
): string {
  return sanitizeRedirectPath(nextParam, fallback);
}
