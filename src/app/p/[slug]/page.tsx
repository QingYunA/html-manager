import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug, incrementViewCount, getAllProjects } from "@/db";
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
      description: "The requested project could not be found on Pagepod.",
      robots: { index: false, follow: false },
    };
  }

  // If private or encrypted without public access, disallow search engine indexing
  if (project.visibility === "private" || project.isEncrypted) {
    return {
      title: "Private Vault Artifact",
      description: "Encrypted private project on Pagepod.",
      robots: { index: false, follow: false },
    };
  }

  const projectTitle = project.title || slug;
  const projectDesc =
    project.description ||
    `Interactive AI artifact: ${projectTitle}. Hosted and safely sandboxed on Pagepod. Run, preview and explore source code online.`;
  const canonicalUrl = `/p/${slug}`;

  return {
    title: `${projectTitle} - Run & Preview Online`,
    description: projectDesc.slice(0, 160),
    keywords: [
      projectTitle,
      project.category || "tool",
      "AI HTML Artifact",
      "Claude Artifacts runner",
      "ChatGPT Canvas preview",
      "online runner",
      "Pagepod",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${projectTitle} - Run & Preview Online | Pagepod`,
      description: projectDesc.slice(0, 160),
      url: canonicalUrl,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${projectTitle} - Run & Preview Online | Pagepod`,
      description: projectDesc.slice(0, 160),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

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

  // Strict Ownership: Platform admins DO NOT have permission to decrypt or peek at another user's private/encrypted project.
  // Only the exact user who created the project is granted owner rights!
  const isExactCreator = Boolean(
    currentUser &&
      (project.userId
        ? currentUser.id === project.userId
        : currentUser.id === "selfhost-admin")
  );

  // If project is explicitly private, reject unauthenticated / unauthorized access directly
  if (project.visibility === "private" && !isExactCreator) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground p-6 text-center antialiased">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20 font-bold text-lg">
          403
        </div>
        <h1 className="text-base font-semibold">私有资源，禁止未授权访问</h1>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
          该 HTML 项目已被所有者设置为完全私有保护。管理员及外部访客无权查阅内容。
        </p>
        <a
          href="/admin/login"
          className="text-xs text-foreground underline underline-offset-4 hover:opacity-80"
        >
          登录拥有者账号
        </a>
      </div>
    );
  }

  if (project.isEncrypted) {
    // If encrypted, only the exact owner can trigger seamless user master key decryption
    if (isExactCreator && project.encryptionIv) {
      try {
        const file = await storage.getFile(`${project.storagePrefix}/${project.entryPath}`);
        if (file) {
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://html-manager-five.vercel.app";
  const jsonLd =
    project.visibility === "public" && !project.isEncrypted
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: project.title || slug,
          headline: project.title || slug,
          description:
            project.description ||
            `Interactive AI artifact ${project.title || slug} online on Pagepod`,
          applicationCategory: project.category || "UtilitiesApplication",
          operatingSystem: "All",
          url: `${siteUrl}/p/${slug}`,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          author: {
            "@type": "Organization",
            name: "Pagepod Community",
          },
        }
      : null;

  // Fetch related public projects for internal linking & recommendations
  let relatedProjects: any[] = [];
  try {
    const allPublic = await getAllProjects({ category: project.category });
    relatedProjects = allPublic
      .filter((p) => p.slug !== slug && p.visibility === "public" && !p.isEncrypted)
      .slice(0, 4);
    
    // If not enough in category, fetch from all categories
    if (relatedProjects.length < 3) {
      const moreProjects = await getAllProjects();
      const extra = moreProjects
        .filter((p) => p.slug !== slug && p.visibility === "public" && !p.isEncrypted && !relatedProjects.some(r => r.slug === p.slug))
        .slice(0, 4 - relatedProjects.length);
      relatedProjects = [...relatedProjects, ...extra];
    }
  } catch {
    relatedProjects = [];
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <RunnerClient
        project={project}
        initialSourceCode={sourceCode}
        seamlessDecryptedHtml={initialDecryptedHtml}
        isOwner={isExactCreator}
        relatedProjects={relatedProjects}
      />
    </>
  );
}
