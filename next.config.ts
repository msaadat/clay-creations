import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained server bundle in .next/standalone so the app runs
  // on any Node host or in the Dockerfile — no Vercel-specific features are used.
  output: "standalone",

  // better-sqlite3 is a native module and must not be bundled into the server build.
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
