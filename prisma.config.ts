import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7 reads the datasource URL from this file rather than from the
// `datasource` block's env() call at CLI time, and no longer auto-loads .env —
// hence the dotenv import above.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
