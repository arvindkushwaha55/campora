import type { NextConfig } from "next";

// Static export so the same build can be hosted on GitHub Pages now
// and on Vercel later without changes. When building for GitHub Pages
// (GITHUB_PAGES=true in the Actions workflow), the app is served from
// the /campora sub-path, so basePath is set only in that case.
const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isGitHubPages ? "/campora" : "",
};

export default nextConfig;
