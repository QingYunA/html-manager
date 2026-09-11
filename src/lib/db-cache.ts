import { cache } from "react";
import { getProjectBySlug, getProjectById, getSetting } from "@/db";

/**
 * Per-request memoized DB reads (React cache).
 *
 * Within a single server request, React.cache deduplicates repeated calls, which
 * matters because metadata generation and the page component both read the same
 * row (and some routes read it a third time for side effects).
 *
 * These are only safe to use inside a request/render scope (Server Components,
 * Route Handlers, Server Actions). Scripts should import from "@/db" directly.
 */
export const getProjectBySlugCached = cache(getProjectBySlug);
export const getProjectByIdCached = cache(getProjectById);
export const getSettingCached = cache(getSetting);
