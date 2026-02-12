import path from "node:path";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaBunSQLite } from "@synapsenwerkstatt/prisma-bun-sqlite-adapter";

const dbPath = path.join(import.meta.dir, "..", "prisma", "dev.db");
const adapter = new PrismaBunSQLite({ url: `file:${dbPath}` });

export const db = new PrismaClient({ adapter });
