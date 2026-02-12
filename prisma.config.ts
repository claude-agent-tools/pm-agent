import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun run src/seed.ts",
  },
  datasource: {
    url: `file:${path.join(__dirname, "prisma", "dev.db")}`,
  },
});
