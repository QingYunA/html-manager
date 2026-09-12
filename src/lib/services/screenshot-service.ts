import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { revalidatePath } from "next/cache";
import { getProjectBySlug, updateProject } from "@/db";
import { getStorage } from "@/lib/storage";

export function findChromePath(): string | null {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const macDefault = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (fs.existsSync(macDefault)) {
    return macDefault;
  }

  const candidates = [
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  try {
    const whichChrome = execSync("which google-chrome || which chromium || which chrome", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    if (whichChrome && fs.existsSync(whichChrome)) return whichChrome;
  } catch {
    // Ignore
  }

  return null;
}

/**
 * Capture a 1280x720 static screenshot for a project and save to storage.
 * Supports local headless Chrome/Chromium and optional cloud fallback.
 */
export async function captureProjectScreenshot(slug: string): Promise<string | null> {
  const project = await getProjectBySlug(slug);
  if (!project) {
    console.warn(`[ScreenshotService] Project not found for slug: ${slug}`);
    return null;
  }

  const storage = getStorage();
  const entryFilePath = `${project.storagePrefix}/${project.entryPath}`;
  const file = await storage.getFile(entryFilePath);
  if (!file) {
    console.warn(`[ScreenshotService] Entry HTML not found at: ${entryFilePath}`);
    return null;
  }

  const chromePath = findChromePath();

  // Channel 1: Local Headless Chrome / Chromium (Fast, High-Fidelity, Zero-Cost)
  if (chromePath) {
    const tempDir = os.tmpdir();
    const tempHtmlPath = path.join(tempDir, `pagepod_cap_${project.slug}_${Date.now()}.html`);
    const tempScreenshotPath = path.join(tempDir, `pagepod_cap_${project.slug}_${Date.now()}.png`);

    try {
      fs.writeFileSync(tempHtmlPath, file.data);

      // Run Chrome with 1.5s simulated render budget to let CSS animations and Canvas settle
      const cmd = `"${chromePath}" --headless --hide-scrollbars --virtual-time-budget=1500 --screenshot="${tempScreenshotPath}" --window-size=1280,720 "file://${tempHtmlPath}"`;
      execSync(cmd, { stdio: "ignore" });

      if (fs.existsSync(tempScreenshotPath)) {
        const imgBuffer = fs.readFileSync(tempScreenshotPath);
        const screenshotStoragePath = `${project.storagePrefix}/screenshot.png`;
        await storage.uploadFile(screenshotStoragePath, imgBuffer, "image/png");

        const newScreenshotUrl = `/raw/${project.slug}/screenshot.png?v=${Date.now()}`;
        await updateProject(project.id, { screenshotUrl: newScreenshotUrl });

        revalidatePath("/");
        revalidatePath("/explore");
        revalidatePath("/workspace");
        revalidatePath(`/p/${project.slug}`);

        return newScreenshotUrl;
      }
    } catch (localErr) {
      console.warn(`[ScreenshotService] Local capture failed for ${slug}:`, localErr instanceof Error ? localErr.message : localErr);
    } finally {
      try {
        if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
        if (fs.existsSync(tempScreenshotPath)) fs.unlinkSync(tempScreenshotPath);
      } catch {
        // Ignore cleanup notice
      }
    }
  }

  // Channel 2: Serverless Cloud Capture Fallback (For public projects on platforms without Chrome)
  if (project.visibility === "public") {
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pagepod.dev";
      const rawUrl = `${siteUrl}/raw/${project.slug}`;
      const cloudApiUrl = `https://api.microlink.io?url=${encodeURIComponent(rawUrl)}&screenshot=true&meta=false&embed=screenshot.url`;

      const res = await fetch(cloudApiUrl, {
        headers: { "user-agent": "Pagepod-AutoScreenshot/1.0" },
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const imgBuffer = Buffer.from(arrayBuffer);
        if (imgBuffer.length > 1000) {
          const screenshotStoragePath = `${project.storagePrefix}/screenshot.png`;
          await storage.uploadFile(screenshotStoragePath, imgBuffer, "image/png");

          const newScreenshotUrl = `/raw/${project.slug}/screenshot.png?v=${Date.now()}`;
          await updateProject(project.id, { screenshotUrl: newScreenshotUrl });

          revalidatePath("/");
          revalidatePath("/explore");
          revalidatePath("/workspace");
          revalidatePath(`/p/${project.slug}`);

          return newScreenshotUrl;
        }
      }
    } catch (cloudErr) {
      console.warn(`[ScreenshotService] Cloud capture fallback failed for ${slug}:`, cloudErr instanceof Error ? cloudErr.message : cloudErr);
    }
  }

  return null;
}

/**
 * Save an uploaded image buffer as the project screenshot.
 */
export async function saveCustomScreenshot(slug: string, imageBuffer: Buffer): Promise<string | null> {
  const project = await getProjectBySlug(slug);
  if (!project) return null;

  const storage = getStorage();
  const screenshotStoragePath = `${project.storagePrefix}/screenshot.png`;
  await storage.uploadFile(screenshotStoragePath, imageBuffer, "image/png");

  const newScreenshotUrl = `/raw/${project.slug}/screenshot.png?v=${Date.now()}`;
  await updateProject(project.id, { screenshotUrl: newScreenshotUrl });

  revalidatePath("/");
  revalidatePath("/explore");
  revalidatePath("/workspace");
  revalidatePath(`/p/${project.slug}`);

  return newScreenshotUrl;
}
