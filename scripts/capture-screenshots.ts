import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { getAllProjects, updateProject, getProjectBySlug } from "../src/db";
import { getStorage } from "../src/lib/storage";

export function findChromePath(): string {
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

  throw new Error(
    "Google Chrome not found. Please install Chrome or specify CHROME_PATH environment variable."
  );
}

export async function tryCaptureScreenshot(slug: string): Promise<string | null> {
  try {
    return await captureScreenshotForProject(slug);
  } catch (err) {
    console.warn(`[Screenshot] Auto capture skipped for ${slug}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function captureScreenshotForProject(slug: string, chromePath?: string): Promise<string> {
  const resolvedChrome = chromePath || findChromePath();
  const project = await getProjectBySlug(slug);
  if (!project) {
    throw new Error(`Project not found with slug: ${slug}`);
  }

  const storage = getStorage();
  const entryFilePath = `${project.storagePrefix}/${project.entryPath}`;
  const file = await storage.getFile(entryFilePath);
  if (!file) {
    throw new Error(`Entry HTML not found at: ${entryFilePath}`);
  }

  const tempDir = os.tmpdir();
  const tempHtmlPath = path.join(tempDir, `pagepod_capture_${project.slug}.html`);
  const tempScreenshotPath = path.join(tempDir, `pagepod_capture_${project.slug}.png`);

  try {
    // Write HTML to temporary file
    fs.writeFileSync(tempHtmlPath, file.data);

    // Run Chrome in headless mode: 1280x720, 16:9 ratio
    const cmd = `"${resolvedChrome}" --headless --hide-scrollbars --screenshot="${tempScreenshotPath}" --window-size=1280,720 "file://${tempHtmlPath}"`;
    execSync(cmd, { stdio: "ignore" });

    if (!fs.existsSync(tempScreenshotPath)) {
      throw new Error(`Failed to generate screenshot file at ${tempScreenshotPath}`);
    }

    const imgBuffer = fs.readFileSync(tempScreenshotPath);
    const screenshotStoragePath = `${project.storagePrefix}/screenshot.png`;
    await storage.uploadFile(screenshotStoragePath, imgBuffer, "image/png");

    const screenshotUrl = `/raw/${project.slug}/screenshot.png`;
    await updateProject(project.id, { screenshotUrl });

    return screenshotUrl;
  } finally {
    // Clean up temporary files
    try {
      if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
      if (fs.existsSync(tempScreenshotPath)) fs.unlinkSync(tempScreenshotPath);
    } catch {
      // Ignore cleanup error
    }
  }
}

async function main() {
  console.log("📸 Pagepod Screenshot Generator");
  console.log("--------------------------------");

  const chromePath = findChromePath();
  console.log(`Using Chrome: ${chromePath}`);

  // Check command line arguments for specific slug
  const args = process.argv.slice(2);
  const slugArg = args.find((a) => a.startsWith("--slug="));
  const forceArg = args.includes("--force");

  if (slugArg) {
    const slug = slugArg.split("=")[1];
    console.log(`Generating screenshot for slug: ${slug}...`);
    const url = await captureScreenshotForProject(slug, chromePath);
    console.log(`✅ Success: ${url}`);
    return;
  }

  // Get all projects
  const projects = await getAllProjects({ includePrivate: true });
  console.log(`Found ${projects.length} project(s) to process.`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const p of projects) {
    if (p.screenshotUrl && !forceArg) {
      console.log(`⏩ [${p.slug}] Screenshot already exists (${p.screenshotUrl}), skipping. Use --force to regenerate.`);
      skipCount++;
      continue;
    }

    try {
      process.stdout.write(`⏳ [${p.slug}] Capturing 1280x720 snapshot... `);
      const url = await captureScreenshotForProject(p.slug, chromePath);
      console.log(`✅ Done -> ${url}`);
      successCount++;
    } catch (err) {
      console.log(`❌ Failed: ${err instanceof Error ? err.message : String(err)}`);
      failCount++;
    }
  }

  console.log("\n--------------------------------");
  console.log(`🎉 Finished! Processed: ${projects.length} | Success: ${successCount} | Skipped: ${skipCount} | Failed: ${failCount}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
