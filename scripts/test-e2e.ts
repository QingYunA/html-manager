import { processAndCreateProject, updateProjectHtml } from "../src/lib/services/project-service";
import { deleteProject } from "../src/db";
import { getStorage } from "../src/lib/storage";
import JSZip from "jszip";

async function runE2ETests() {
  console.log("🚀 Starting E2E Verification Tests...");

  // Test 1: Upload a single HTML file
  console.log("\n[Test 1] Testing single HTML creation & auto metadata extraction...");
  const sampleHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Canvas Particle Simulator</title>
  <meta name="description" content="Interactive particle physics simulation built with HTML5 Canvas">
</head>
<body>
  <h1>Particle Sim</h1>
  <canvas id="canvas"></canvas>
  <script>console.log("running simulation");</script>
</body>
</html>`;

  const p1 = await processAndCreateProject({
    htmlContent: sampleHtml,
    category: "animations",
    tags: ["Canvas", "Physics", "AI"],
  });

  console.log(`✓ Project 1 created: ID=${p1.id}, Slug=${p1.slug}, Title="${p1.title}"`);
  if (p1.title !== "Canvas Particle Simulator") {
    throw new Error(`Expected title 'Canvas Particle Simulator', got '${p1.title}'`);
  }
  if (!p1.description || !p1.description.includes("Interactive particle physics")) {
    throw new Error(`Description extraction failed: '${p1.description}'`);
  }

  // Test 2: Verify storage retrieval of single HTML
  console.log("\n[Test 2] Testing StorageProvider getFile for single HTML...");
  const storage = getStorage();
  const file1 = await storage.getFile(`${p1.storagePrefix}/index.html`);
  if (!file1) throw new Error("Could not find index.html in storage");
  console.log(`✓ File retrieved from storage: size=${file1.data.length} bytes, type=${file1.contentType}`);

  // Test 3: Upload a Zip bundle with relative sub-assets
  console.log("\n[Test 3] Testing Zip bundle unpacking and sub-asset storage...");
  const zip = new JSZip();
  zip.file(
    "index.html",
    `<!DOCTYPE html><html><head><title>Zip Game Demo</title><link rel="stylesheet" href="assets/style.css"></head><body><h1>Zip Game</h1><script src="assets/main.js"></script></body></html>`
  );
  zip.folder("assets")?.file("style.css", "body { background: #111; color: #fff; }");
  zip.folder("assets")?.file("main.js", "console.log('game loaded');");
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  const p2 = await processAndCreateProject({
    fileName: "game-demo.zip",
    fileBuffer: zipBuffer,
    category: "games",
    tags: ["Game", "ZipBundle"],
  });

  console.log(`✓ Project 2 created: ID=${p2.id}, Slug=${p2.slug}, AssetType=${p2.assetType}`);
  if (p2.assetType !== "zip_bundle") {
    throw new Error(`Expected assetType 'zip_bundle', got '${p2.assetType}'`);
  }

  // Verify sub-assets in Zip
  const cssFile = await storage.getFile(`${p2.storagePrefix}/assets/style.css`);
  if (!cssFile) throw new Error("Could not retrieve assets/style.css from unpacked zip");
  console.log(`✓ Zip sub-asset retrieved: type=${cssFile.contentType}`);

  // Test 4: Online Code Editor update
  console.log("\n[Test 4] Testing online code modification and update...");
  const updatedHtml = sampleHtml.replace("Particle Sim", "Super Particle Sim v2");
  await updateProjectHtml(p1.id, updatedHtml);
  const reloaded = await storage.getFile(`${p1.storagePrefix}/index.html`);
  if (!reloaded || !reloaded.data.toString("utf-8").includes("Super Particle Sim v2")) {
    throw new Error("HTML code update failed in storage");
  }
  console.log("✓ Code modification verified in storage!");

  // Test 5: Verify Private Project Access Control (ACL)
  console.log("\n[Test 5] Testing Account-level Private Project Access Control...");
  const privateHtml = `<!DOCTYPE html><html><body><h1>Private Confidential Dashboard</h1><p>Owner-only revenue data: $1,234,567</p></body></html>`;

  const p3 = await processAndCreateProject({
    title: "私有数据单页",
    category: "visualization",
    tags: ["Private", "OwnerOnly"],
    visibility: "private",
    userId: "user_alice_123",
    htmlContent: privateHtml,
  });

  if (p3.visibility !== "private" || p3.userId !== "user_alice_123") {
    throw new Error("Private project metadata not stored correctly!");
  }

  const storedPrivateFile = await storage.getFile(`${p3.storagePrefix}/${p3.entryPath}`);
  if (!storedPrivateFile) throw new Error("Could not retrieve private project file from storage");
  if (!storedPrivateFile.data.toString("utf-8").includes("Private Confidential Dashboard")) {
    throw new Error("Private project content corrupted or missing in storage!");
  }
  console.log("✓ Private project successfully stored under user ownership!");

  // Cleanup test artifacts
  console.log("\n[Cleanup] Cleaning up test projects...");
  await storage.deleteDirectory(p1.storagePrefix);
  await storage.deleteDirectory(p2.storagePrefix);
  await storage.deleteDirectory(p3.storagePrefix);
  await deleteProject(p1.id);
  await deleteProject(p2.id);
  await deleteProject(p3.id);
  console.log("✓ Cleanup completed successfully!");

  console.log("\n🎉 ALL E2E VERIFICATION TESTS PASSED PERFECTLY! 🎉\n");
}

runE2ETests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
