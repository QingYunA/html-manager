import { notFound } from "next/navigation";
import { getProjectBySlug, incrementViewCount } from "@/db";
import { getStorage } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { decryptArtifactForUser } from "@/lib/crypto/e2ee";
import RunnerClient from "./runner-client";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function ProjectRunnerPage({ params }: PageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  // Record view count
  await incrementViewCount(slug);

  let initialDecryptedHtml = "";
  let sourceCode = "";
  const storage = getStorage();

  const currentUser = await getCurrentUser();
  const isOwner = Boolean(
    currentUser &&
      (currentUser.role === "admin" ||
        (project.userId && currentUser.id === project.userId) ||
        currentUser.id === "selfhost-admin")
  );

  if (project.isEncrypted) {
    // If encrypted and current user is owner / admin, decrypt seamlessly on server/client pipeline
    if (isOwner && project.encryptionIv) {
      try {
        const file = await storage.getFile(`${project.storagePrefix}/${project.entryPath}`);
        if (file) {
          // Decrypt with user master key (derived from user id)
          const targetUserId = project.userId || currentUser!.id;
          initialDecryptedHtml = await decryptArtifactForUser(
            file.data,
            targetUserId,
            project.encryptionIv
          );
          sourceCode = initialDecryptedHtml;
        }
      } catch (err) {
        console.error("Seamless user decryption failed, falling back to client hash:", err);
      }
    }
  } else if (project.assetType === "single_html") {
    try {
      const file = await storage.getFile(`${project.storagePrefix}/${project.entryPath}`);
      if (file) {
        sourceCode = file.data.toString("utf-8");
      }
    } catch {
      sourceCode = "";
    }
  }

  return (
    <RunnerClient
      project={project}
      initialSourceCode={sourceCode}
      seamlessDecryptedHtml={initialDecryptedHtml}
      isOwner={isOwner}
    />
  );
}
