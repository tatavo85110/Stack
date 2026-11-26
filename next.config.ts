import type { NextConfig } from "next";
import { writeFileSync } from "node:fs";

// Build id: the app compares it with /version.json to offer a reload after a new deploy.
const buildId = process.env.NEXT_PUBLIC_BUILD_ID || String(Date.now());
process.env.NEXT_PUBLIC_BUILD_ID = buildId;
try { writeFileSync("public/version.json", JSON.stringify({ id: buildId })); } catch {}

// For GitHub Pages the site lives under /<repo>, set by the deploy workflow.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BUILD_ID: buildId },
};

export default nextConfig;
