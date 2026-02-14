import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema.ts";

const dbDir = join(homedir(), ".pm-agent");
mkdirSync(dbDir, { recursive: true });

export const dbPath = join(dbDir, "data.db");

// Auto-migrate on first use
const isNew = !existsSync(dbPath);
const sqlite = new Database(dbPath);

if (isNew) {
  sqlite.run(`CREATE TABLE IF NOT EXISTS entities (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    parent_id text,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES entities(id)
  )`);
  sqlite.run(`CREATE TABLE IF NOT EXISTS problems (
    id text PRIMARY KEY NOT NULL,
    title text NOT NULL,
    description text,
    impact text,
    opportunity text,
    state text DEFAULT 'identified' NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL
  )`);
  sqlite.run(`CREATE TABLE IF NOT EXISTS entity_problems (
    id text PRIMARY KEY NOT NULL,
    entity_id text NOT NULL,
    problem_id text NOT NULL,
    created_at integer NOT NULL,
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (problem_id) REFERENCES problems(id)
  )`);
  sqlite.run(`CREATE UNIQUE INDEX IF NOT EXISTS entity_problems_entity_id_problem_id_unique ON entity_problems (entity_id, problem_id)`);
}

export const db = drizzle(sqlite, { schema });
