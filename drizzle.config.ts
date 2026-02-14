import { join } from "node:path";
import { homedir } from "node:os";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: join(homedir(), ".pm-agent", "data.db") },
});
