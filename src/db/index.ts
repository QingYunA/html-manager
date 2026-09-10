import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc, and } from "drizzle-orm";
import * as schema from "./schema";
import type { Project, NewProject } from "./schema";

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Local JSON store fallback for zero-config local dev
const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_DB_FILE = path.join(LOCAL_DATA_DIR, "db.json");

interface LocalData {
  projects: Project[];
  settings: Record<string, string>;
}

function readLocalData(): LocalData {
  try {
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_DB_FILE)) {
      const initial: LocalData = { projects: [], settings: {} };
      fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(LOCAL_DB_FILE, "utf-8");
    const data = JSON.parse(raw) as LocalData;
    data.projects = data.projects.map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    }));
    return data;
  } catch (err) {
    console.error("Failed to read local data:", err);
    return { projects: [], settings: {} };
  }
}

function writeLocalData(data: LocalData) {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

let neonDb: ReturnType<typeof drizzle> | null = null;
let tablesInitialized = false;

function getNeonDb() {
  if (!neonDb && dbUrl) {
    const sql = neon(dbUrl);
    neonDb = drizzle(sql, { schema });
  }
  return neonDb;
}

async function ensurePostgresTables() {
  if (tablesInitialized || !dbUrl) return;
  try {
    const sql = neon(dbUrl);
    await sql`
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
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    tablesInitialized = true;
  } catch (err) {
    console.warn("Table auto-migration notice (tables may already exist):", err);
    tablesInitialized = true;
  }
}

export async function getAllProjects(options?: {
  userId?: string;
  includePrivate?: boolean;
  category?: string;
  tag?: string;
  search?: string;
}): Promise<Project[]> {
  const db = getNeonDb();
  let list: Project[] = [];

  if (db) {
    await ensurePostgresTables();
    list = await db
      .select()
      .from(schema.projects)
      .orderBy(desc(schema.projects.isPinned), desc(schema.projects.createdAt));
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
  const db = getNeonDb();
  if (db) {
    await ensurePostgresTables();
    const rows = await db.select().from(schema.projects).where(eq(schema.projects.slug, slug)).limit(1);
    return rows[0] || null;
  } else {
    const local = readLocalData();
    return local.projects.find((p) => p.slug === slug) || null;
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  const db = getNeonDb();
  if (db) {
    await ensurePostgresTables();
    const rows = await db.select().from(schema.projects).where(eq(schema.projects.id, id)).limit(1);
    return rows[0] || null;
  } else {
    const local = readLocalData();
    return local.projects.find((p) => p.id === id) || null;
  }
}

export async function createProject(data: NewProject): Promise<Project> {
  const db = getNeonDb();
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
    await ensurePostgresTables();
    const inserted = await db.insert(schema.projects).values(newRecord).returning();
    return inserted[0];
  } else {
    const local = readLocalData();
    local.projects.push(newRecord);
    writeLocalData(local);
    return newRecord;
  }
}

export async function updateProject(id: string, updates: Partial<NewProject>): Promise<Project | null> {
  const db = getNeonDb();
  const now = new Date();

  if (db) {
    await ensurePostgresTables();
    const updated = await db
      .update(schema.projects)
      .set({ ...updates, updatedAt: now })
      .where(eq(schema.projects.id, id))
      .returning();
    return updated[0] || null;
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
  const db = getNeonDb();
  if (db) {
    await ensurePostgresTables();
    await db.delete(schema.projects).where(eq(schema.projects.id, id));
    return true;
  } else {
    const local = readLocalData();
    const originalLength = local.projects.length;
    local.projects = local.projects.filter((p) => p.id !== id);
    writeLocalData(local);
    return local.projects.length < originalLength;
  }
}

export async function incrementViewCount(slug: string): Promise<void> {
  const db = getNeonDb();
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
  const db = getNeonDb();
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
  const db = getNeonDb();
  const now = new Date();
  if (db) {
    await ensurePostgresTables();
    await db
      .insert(schema.settings)
      .values({ key, value, updatedAt: now })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value, updatedAt: now },
      });
  } else {
    const local = readLocalData();
    local.settings[key] = value;
    writeLocalData(local);
  }
}
