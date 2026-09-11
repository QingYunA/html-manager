import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProjectBySlug, updateProject } from "@/db";
import { getStorage } from "@/lib/storage";
import { decryptArtifactForUserLegacy } from "@/lib/crypto/legacy-e2ee";
import { assertSafeStorageKey } from "@/lib/storage/path-safety";

/**
 * One-time legacy encryption migration, DISABLED BY DEFAULT.
 *
 * The legacy `legacy-server` scheme derived keys from userId + server pepper, which is not
 * zero-knowledge. This endpoint lets the exact owner fetch the decrypted plaintext so the
 * browser can re-encrypt under a client-held key, then finalize.
 *
 * Guardrails:
 * - Requires ALLOW_LEGACY_MIGRATION=1
 * - Requires ENCRYPTION_PEPPER to be explicitly configured (never uses the hardcoded default)
 * - Owner-only (admins cannot migrate other users' vaults)
 * - Only applies to projects still in keyMode === "legacy-server"
 */
function isMigrationAllowed(): boolean {
  return process.env.ALLOW_LEGACY_MIGRATION === "1" && Boolean(process.env.ENCRYPTION_PEPPER);
}

function isExactOwner(
  user: { id: string } | null,
  project: { userId: string | null }
): boolean {
  if (!user) return false;
  if (project.userId) return user.id === project.userId;
  return user.id === "selfhost-admin";
}

export async function GET(request: Request) {
  if (!isMigrationAllowed()) {
    return NextResponse.json({ error: "Legacy migration is disabled" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const project = await getProjectBySlug(slug);
  if (!project || !project.isEncrypted) {
    return NextResponse.json({ error: "Project not found or not encrypted" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!isExactOwner(user, project)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (project.keyMode !== "legacy-server") {
    return NextResponse.json({ error: "Project does not use the legacy key mode" }, { status: 409 });
  }

  if (!project.encryptionIv) {
    return NextResponse.json({ error: "Missing encryption IV" }, { status: 422 });
  }

  try {
    const storage = getStorage();
    const storagePath = assertSafeStorageKey(
      `${project.storagePrefix}/${project.entryPath}`,
      project.storagePrefix
    );
    const file = await storage.getFile(storagePath);
    if (!file) {
      return NextResponse.json({ error: "Ciphertext not found" }, { status: 404 });
    }

    const targetUserId = project.userId || "selfhost-admin";
    const plaintext = await decryptArtifactForUserLegacy(
      file.data,
      targetUserId,
      project.encryptionIv
    );

    return NextResponse.json({ success: true, plaintext, slug });
  } catch (err: unknown) {
    console.error("Legacy migration decrypt failed:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Legacy decryption failed" },
      { status: 500 }
    );
  }
}

/**
 * Finalize the migration: persist the new ciphertext + public KDF params and flip keyMode.
 * The plaintext never reaches this server; the browser re-encrypts under its own key.
 */
export async function POST(request: Request) {
  if (!isMigrationAllowed()) {
    return NextResponse.json({ error: "Legacy migration is disabled" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, ciphertextBase64, ivBase64, keyMode, kdfSalt, kdfIterations } = body || {};

    if (!slug || !ciphertextBase64 || !ivBase64 || !["zk-passphrase", "zk-recovery"].includes(keyMode)) {
      return NextResponse.json({ error: "Invalid migration payload" }, { status: 400 });
    }

    const project = await getProjectBySlug(String(slug));
    if (!project || !project.isEncrypted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (!isExactOwner(user, project)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (project.keyMode !== "legacy-server") {
      return NextResponse.json({ error: "Already migrated" }, { status: 409 });
    }

    const storage = getStorage();
    const storagePath = assertSafeStorageKey(
      `${project.storagePrefix}/${project.entryPath}`,
      project.storagePrefix
    );
    // Accept base64url (from browser) normalized to standard base64
    const normalizedBase64 = String(ciphertextBase64).replace(/-/g, "+").replace(/_/g, "/");
    const buffer = Buffer.from(normalizedBase64, "base64");
    await storage.uploadFile(storagePath, buffer, "application/octet-stream");

    await updateProject(project.id, {
      encryptionIv: String(ivBase64),
      keyMode,
      kdfSalt: kdfSalt ? String(kdfSalt) : null,
      kdfIterations: typeof kdfIterations === "number" ? kdfIterations : null,
    });

    return NextResponse.json({ success: true, slug: project.slug });
  } catch (err: unknown) {
    console.error("Legacy migration finalize failed:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Migration finalize failed" },
      { status: 500 }
    );
  }
}
