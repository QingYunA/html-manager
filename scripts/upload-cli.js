#!/usr/bin/env node

/**
 * Pagepod CLI Uploader
 *
 * Usage:
 *   node scripts/upload-cli.js ./my-tool.html \
 *     --token pp_live_xxxxxxxx \
 *     --title "Reaction Time Test" \
 *     --slug "reaction-time-test" \
 *     --category "tools" \
 *     --description "Test your reflexes in milliseconds" \
 *     --endpoint "https://html-manager-five.vercel.app"
 */

import fs from "node:fs";
import path from "node:path";

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    filePath: "",
    token: process.env.PAGEPOD_TOKEN || "",
    endpoint: process.env.PAGEPOD_ENDPOINT || "https://html-manager-five.vercel.app",
    title: "",
    slug: "",
    category: "tools",
    description: "",
    visibility: "public",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--token" && args[i + 1]) {
      options.token = args[++i];
    } else if (arg === "--endpoint" && args[i + 1]) {
      options.endpoint = args[++i];
    } else if (arg === "--title" && args[i + 1]) {
      options.title = args[++i];
    } else if (arg === "--slug" && args[i + 1]) {
      options.slug = args[++i];
    } else if (arg === "--category" && args[i + 1]) {
      options.category = args[++i];
    } else if (arg === "--description" && args[i + 1]) {
      options.description = args[++i];
    } else if (arg === "--visibility" && args[i + 1]) {
      options.visibility = args[++i];
    } else if (!arg.startsWith("--") && !options.filePath) {
      options.filePath = arg;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  if (!options.filePath) {
    console.error("❌ Error: Please provide an HTML file path to upload.");
    console.error("Usage: node scripts/upload-cli.js <file.html> --token <pp_live_...> [options]");
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), options.filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Error: File not found at ${resolvedPath}`);
    process.exit(1);
  }

  if (!options.token) {
    console.error("❌ Error: Missing API Token. Provide via --token <pp_live_...> or set PAGEPOD_TOKEN env variable.");
    process.exit(1);
  }

  const fileContent = fs.readFileSync(resolvedPath, "utf-8");
  const fileName = path.basename(resolvedPath);
  const baseTitle = options.title || fileName.replace(/\.[^/.]+$/, "");
  const baseSlug = options.slug || baseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  console.log(`🚀 Uploading '${fileName}' to ${options.endpoint}...`);
  console.log(`   Title: ${baseTitle}`);
  console.log(`   Slug:  ${baseSlug}`);
  console.log(`   Token: ${options.token.slice(0, 10)}...${options.token.slice(-4)}`);

  const formData = new FormData();
  const blob = new Blob([fileContent], { type: "text/html" });
  formData.append("file", blob, fileName);
  formData.append("title", baseTitle);
  formData.append("slug", baseSlug);
  formData.append("category", options.category);
  formData.append("description", options.description);
  formData.append("visibility", options.visibility);

  const targetUrl = `${options.endpoint.replace(/\/+$/, "")}/api/upload`;

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.token}`,
      },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error(`❌ Upload failed (${res.status}):`, data.error || data);
      process.exit(1);
    }

    console.log("✅ Success! Project published:");
    console.log(`   ID:        ${data.project?.id}`);
    console.log(`   Runner:    ${data.project?.runnerUrl}`);
    console.log(`   Dashboard: ${options.endpoint}/admin`);
  } catch (err) {
    console.error("❌ Network or request error:", err);
    process.exit(1);
  }
}

main();
