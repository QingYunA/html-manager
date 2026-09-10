import { pgTable, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id"), // Optional Supabase Auth user ID (for multi-tenant cloud mode)
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  category: text("category").notNull().default("tools"),
  tags: jsonb("tags").$type<string[]>().default([]),
  assetType: text("asset_type").notNull().default("single_html"), // 'single_html' | 'zip_bundle'
  entryPath: text("entry_path").notNull().default("index.html"),
  storageType: text("storage_type").notNull().default("local"), // 'vercel-blob' | 'cloudflare-r2' | 'local' | 'supabase'
  storagePrefix: text("storage_prefix").notNull(),
  visibility: text("visibility").notNull().default("public"), // 'public' | 'unlisted' | 'private'
  isPinned: boolean("is_pinned").notNull().default(false),
  viewCount: integer("view_count").notNull().default(0),
  
  // Zero-knowledge End-to-End Encryption fields
  isEncrypted: boolean("is_encrypted").notNull().default(false),
  encryptionIv: text("encryption_iv"), // Base64 12-byte IV for AES-GCM (public, secret key stays in URL hash)
  fileSize: integer("file_size").default(0), // Bytes (for quota tracking)
  planTier: text("plan_tier").default("free"), // 'free' | 'pro'

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const apiTokens = pgTable("api_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(), // Exact owner (Supabase user id or 'selfhost-admin')
  name: text("name").notNull(), // Descriptive label (e.g. 'Cursor Uploader', 'Python Sync')
  tokenHash: text("token_hash").notNull().unique(), // SHA-256 hashed secret
  tokenHint: text("token_hint").notNull(), // Last 4 chars (e.g. '8f2a')
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ApiToken = typeof apiTokens.$inferSelect;
export type NewApiToken = typeof apiTokens.$inferInsert;
