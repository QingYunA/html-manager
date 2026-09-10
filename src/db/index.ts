import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc } from "drizzle-orm";
import * as schema from "./schema";
import type { Project, NewProject, ApiToken, NewApiToken } from "./schema";

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Local JSON store fallback for zero-config local dev and serverless environments
function resolveLocalDbFile(): string {
  const localDir = path.join(process.cwd(), ".data");
  const localFile = path.join(localDir, "db.json");

  // If local .data is writable or already has db.json, use it
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.accessSync(localDir, fs.constants.W_OK);
    return localFile;
  } catch {
    // In serverless environments (Vercel Lambda) process.cwd() is read-only.
    // Fall back to os.tmpdir() where writable storage is guaranteed.
    const tmpDir = path.join(os.tmpdir(), "html-manager-data");
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {
      // ignore
    }
    return path.join(tmpDir, "db.json");
  }
}

interface LocalData {
  projects: Project[];
  settings: Record<string, string>;
  apiTokens?: ApiToken[];
}

function readLocalData(): LocalData {
  try {
    const dbFile = resolveLocalDbFile();
    const dbDir = path.dirname(dbFile);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (!fs.existsSync(dbFile)) {
      const initial: LocalData = { projects: [], settings: {}, apiTokens: [] };
      try {
        fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), "utf-8");
      } catch {
        // read-only ignore
      }
      return initial;
    }
    const raw = fs.readFileSync(dbFile, "utf-8");
    const data = JSON.parse(raw) as LocalData;
    data.projects = (data.projects || []).map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
    data.apiTokens = (data.apiTokens || []).map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      lastUsedAt: t.lastUsedAt ? new Date(t.lastUsedAt) : null,
    }));
    return data;
  } catch (err) {
    console.error("Failed to read local data:", err);
    return { projects: [], settings: {}, apiTokens: [] };
  }
}

function writeLocalData(data: LocalData) {
  try {
    const dbFile = resolveLocalDbFile();
    const dbDir = path.dirname(dbFile);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local data:", err);
  }
}

let pgPool: Pool | null = null;
let pgDb: ReturnType<typeof drizzle> | null = null;
let tablesInitialized = false;

function getDatabase() {
  if (!dbUrl) return null;

  if (!pgDb) {
    pgPool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
      max: 10,
    });
    pgDb = drizzle(pgPool, { schema });
  }
  return pgDb;
}

const SQL_PROJECTS = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'tools',
    tags JSONB DEFAULT '[]',
    asset_type TEXT NOT NULL DEFAULT 'single_html',
    entry_path TEXT NOT NULL DEFAULT 'index.html',
    storage_type TEXT NOT NULL DEFAULT 'local',
    storage_prefix TEXT NOT NULL,
    visibility TEXT NOT NULL DEFAULT 'public',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    view_count INTEGER NOT NULL DEFAULT 0,
    is_encrypted BOOLEAN NOT NULL DEFAULT false,
    encryption_iv TEXT,
    file_size INTEGER DEFAULT 0,
    plan_tier TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const SQL_SETTINGS = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const SQL_API_TOKENS = `
  CREATE TABLE IF NOT EXISTS api_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    token_hint TEXT NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

async function ensurePostgresTables() {
  if (tablesInitialized || !dbUrl) return;
  try {
    if (!pgPool) {
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") ? false : { rejectUnauthorized: false },
      });
    }
    // Execute separately to prevent multi-statement transaction pooler/PgBouncer failures
    for (const sql of [SQL_PROJECTS, SQL_SETTINGS, SQL_API_TOKENS]) {
      try {
        await pgPool.query(sql);
      } catch (tableErr) {
        console.warn("Table auto-migration notice for table:", tableErr);
      }
    }
    tablesInitialized = true;
  } catch (err) {
    console.warn("Table initialization pool connection notice:", err);
  }
}

export async function getAllProjects(options?: {
  userId?: string;
  includePrivate?: boolean;
  category?: string;
  tag?: string;
  search?: string;
}): Promise<Project[]> {
  const db = getDatabase();
  let list: Project[] = [];

  if (db) {
    try {
      await ensurePostgresTables();
      list = await db
        .select()
        .from(schema.projects)
        .orderBy(desc(schema.projects.isPinned), desc(schema.projects.createdAt));
    } catch (err) {
      console.error("Database query failed, falling back to local data:", err);
      const local = readLocalData();
      list = [...local.projects];
    }
  } else {
    const local = readLocalData();
    list = [...local.projects].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  // Filter by user if specified (multi-tenant dashboard)
  if (options?.userId) {
    list = list.filter((p) => p.userId === options.userId);
  } else if (!options?.includePrivate) {
    list = list.filter((p) => p.visibility === "public");
  }

  if (options?.category && options.category !== "all") {
    list = list.filter((p) => p.category === options.category);
  }

  if (options?.tag) {
    list = list.filter((p) => Array.isArray(p.tags) && p.tags.includes(options.tag!));
  }

  if (options?.search) {
    const q = options.search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.slug.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  return list;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const db = getDatabase();
  if (db) {
    try {
      await ensurePostgresTables();
      const rows = await db.select().from(schema.projects).where(eq(schema.projects.slug, slug)).limit(1);
      return rows[0] || null;
    } catch (err) {
      console.error("getProjectBySlug DB query error:", err);
      const local = readLocalData();
      return local.projects.find((p) => p.slug === slug) || null;
    }
  } else {
    const local = readLocalData();
    return local.projects.find((p) => p.slug === slug) || null;
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  const db = getDatabase();
  if (db) {
    try {
      await ensurePostgresTables();
      const rows = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
      return rows[0] || null;
    } catch (err) {
      console.error("getProjectById DB query error:", err);
      const local = readLocalData();
      return local.projects.find((p) => p.id === id) || null;
    }
  } else {
    const local = readLocalData();
    return local.projects.find((p) => p.id === id) || null;
  }
}

export async function createProject(data: NewProject): Promise<Project> {
  const db = getDatabase();
  const now = new Date();
  const newRecord: Project = {
    id: data.id,
    userId: data.userId ?? null,
    title: data.title,
    slug: data.slug,
    description: data.description ?? "",
    category: data.category ?? "tools",
    tags: (data.tags as string[]) ?? [],
    assetType: data.assetType ?? "single_html",
    entryPath: data.entryPath ?? "index.html",
    storageType: data.storageType ?? "local",
    storagePrefix: data.storagePrefix,
    visibility: data.visibility ?? "public",
    isPinned: data.isPinned ?? false,
    viewCount: data.viewCount ?? 0,
    isEncrypted: data.isEncrypted ?? false,
    encryptionIv: data.encryptionIv ?? null,
    fileSize: data.fileSize ?? 0,
    planTier: data.planTier ?? "free",
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      await ensurePostgresTables();
      const inserted = await db.insert(schema.projects).values(newRecord).returning();
      return inserted[0];
    } catch (err) {
      console.error("createProject DB insert error, saving to local fallback:", err);
      const local = readLocalData();
      local.projects.push(newRecord);
      writeLocalData(local);
      return newRecord;
    }
  } else {
    const local = readLocalData();
    local.projects.push(newRecord);
    writeLocalData(local);
    return newRecord;
  }
}

export async function updateProject(id: string, updates: Partial<NewProject>): Promise<Project | null> {
  const db = getDatabase();
  const now = new Date();

  if (db) {
    try {
      await ensurePostgresTables();
      const updated = await db
        .update(schema.projects)
        .set({ ...updates, updatedAt: now })
        .where(eq(schema.projects.id, id))
        .returning();
      return updated[0] || null;
    } catch (err) {
      console.error("updateProject DB query error:", err);
      return null;
    }
  } else {
    const local = readLocalData();
    const index = local.projects.findIndex((p) => p.id === id);
    if (index === -1) return null;
    const existing = local.projects[index];
    const updatedRecord: Project = {
      ...existing,
      ...updates,
      tags: updates.tags ? (updates.tags as string[]) : existing.tags,
      updatedAt: now,
    };
    local.projects[index] = updatedRecord;
    writeLocalData(local);
    return updatedRecord;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = getDatabase();
  if (db) {
    try {
      await ensurePostgresTables();
      await db.delete(schema.projects).where(eq(schema.projects.id, id));
      return true;
    } catch (err) {
      console.error("deleteProject DB error:", err);
      return false;
    }
  } else {
    const local = readLocalData();
    const originalLength = local.projects.length;
    local.projects = local.projects.filter((p) => p.id !== id);
    writeLocalData(local);
    return local.projects.length < originalLength;
  }
}

export async function incrementViewCount(slug: string): Promise<void> {
  const db = getDatabase();
  if (db) {
    try {
      await ensurePostgresTables();
      const proj = await getProjectBySlug(slug);
      if (proj) {
        await db
          .update(schema.projects)
          .set({ viewCount: proj.viewCount + 1 })
          .where(eq(schema.projects.slug, slug));
      }
    } catch {
      // non-critical
    }
  } else {
    const local = readLocalData();
    const proj = local.projects.find((p) => p.slug === slug);
    if (proj) {
      proj.viewCount = (proj.viewCount || 0) + 1;
      writeLocalData(local);
    }
  }
}

export async function getSetting(key: string, defaultValue = ""): Promise<string> {
  const db = getDatabase();
  if (db) {
    try {
      await ensurePostgresTables();
      const rows = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
      return rows[0]?.value ?? defaultValue;
    } catch {
      return defaultValue;
    }
  } else {
    const local = readLocalData();
    return local.settings[key] ?? defaultValue;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDatabase();
  const now = new Date();
  if (db) {
    try {
      await ensurePostgresTables();
      await db
        .insert(schema.settings)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({
          target: schema.settings.key,
          set: { value, updatedAt: now },
        });
    } catch (err) {
      console.error("setSetting DB error:", err);
    }
  } else {
    const local = readLocalData();
    local.settings[key] = value;
    writeLocalData(local);
  }
}

// ----------------------------------------------------
// Personal Access Token (API Keys) Operations
// ----------------------------------------------------

export async function createApiTokenRecord(token: NewApiToken): Promise<ApiToken> {
  const db = getDatabase();
  if (db) {
    try {
      await ensurePostgresTables();
      const rows = await db.insert(schema.apiTokens).values(token).returning();
      return rows[0];
    } catch (err) {
      console.error("createApiTokenRecord DB error, falling back to local storage:", err);
      const local = readLocalData();
      if (!local.apiTokens) local.apiTokens = [];
      const record: ApiToken = {
        ...token,
        createdAt: new Date(),
        lastUsedAt: null,
      };
      local.apiTokens.push(record);
      writeLocalData(local);
      return record;
    }
  } else {
    const local = readLocalData();
    if (!local.apiTokens) local.apiTokens = [];
    const record: ApiToken = {
      ...token,
      createdAt: new Date(),
      lastUsedAt: null,
    };
    local.apiTokens.push(record);
    writeLocalData(local);
    return record;
  }
}

export async function getApiTokensByUserId(userId: string): Promise<ApiToken[]> {
  const db = getDatabase();
  if (db) {
    try {
      await ensurePostgresTables();
      return await db
        .select()
        .from(schema.apiTokens)
        .where(eq(schema.apiTokens.userId, userId))
        .orderBy(desc(schema.apiTokens.createdAt));
    } catch (err) {
      console.error("getApiTokensByUserId DB error, falling back to local data:", err);
      const local = readLocalData();
      return (local.apiTokens || [])
        .filter((t) => t.userId === userId || userId === "selfhost-admin")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  } else {
    const local = readLocalData();
    return (local.apiTokens || [])
      .filter((t) => t.userId === userId || userId === "selfhost-admin")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function findApiTokenByHash(tokenHash: string): Promise<ApiToken | null> {
  const db = getDatabase();
  if (db) {
    try {
      await ensurePostgresTables();
      const rows = await db
        .select()
        .from(schema.apiTokens)
        .where(eq(schema.apiTokens.tokenHash, tokenHash))
        .limit(1);
      return rows[0] || null;
    } catch (err) {
      console.error("findApiTokenByHash DB error, falling back to local data:", err);
      const local = readLocalData();
      return (local.apiTokens || []).find((t) => t.tokenHash === tokenHash) || null;
    }
  } else {
    const local = readLocalData();
    return (local.apiTokens || []).find((t) => t.tokenHash === tokenHash) || null;
  }
}

export async function touchApiTokenLastUsed(id: string): Promise<void> {
  const db = getDatabase();
  const now = new Date();
  if (db) {
    try {
      await ensurePostgresTables();
      await db
        .update(schema.apiTokens)
        .set({ lastUsedAt: now })
        .where(eq(schema.apiTokens.id, id));
    } catch (err) {
      console.error("touchApiTokenLastUsed DB error, fallback to local:", err);
      const local = readLocalData();
      const token = (local.apiTokens || []).find((t) => t.id === id);
      if (token) {
        token.lastUsedAt = now;
        writeLocalData(local);
      }
    }
  } else {
    const local = readLocalData();
    const token = (local.apiTokens || []).find((t) => t.id === id);
    if (token) {
      token.lastUsedAt = now;
      writeLocalData(local);
    }
  }
}

export async function deleteApiTokenById(id: string, userId: string): Promise<boolean> {
  const db = getDatabase();
  if (db) {
    try {
      await ensurePostgresTables();
      await db
        .delete(schema.apiTokens)
        .where(eq(schema.apiTokens.id, id));
      return true;
    } catch (err) {
      console.error("deleteApiTokenById DB error, falling back to local data:", err);
      const local = readLocalData();
      const beforeLen = (local.apiTokens || []).length;
      local.apiTokens = (local.apiTokens || []).filter(
        (t) => !(t.id === id && (t.userId === userId || userId === "selfhost-admin"))
      );
      writeLocalData(local);
      return (local.apiTokens || []).length < beforeLen;
    }
  } else {
    const local = readLocalData();
    const beforeLen = (local.apiTokens || []).length;
    local.apiTokens = (local.apiTokens || []).filter(
      (t) => !(t.id === id && (t.userId === userId || userId === "selfhost-admin"))
    );
    writeLocalData(local);
    return (local.apiTokens || []).length < beforeLen;
  }
}
