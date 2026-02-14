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
    description text,
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
  sqlite.run(`CREATE TABLE IF NOT EXISTS solutions (
    id text PRIMARY KEY NOT NULL,
    title text NOT NULL,
    description text,
    problem_id text NOT NULL,
    state text DEFAULT 'proposed' NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (problem_id) REFERENCES problems(id)
  )`);
  sqlite.run(`CREATE TABLE IF NOT EXISTS tasks (
    id text PRIMARY KEY NOT NULL,
    title text NOT NULL,
    description text,
    solution_id text,
    parent_id text,
    entity_id text,
    state text DEFAULT 'pending' NOT NULL,
    position integer DEFAULT 0 NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    FOREIGN KEY (solution_id) REFERENCES solutions(id),
    FOREIGN KEY (parent_id) REFERENCES tasks(id),
    FOREIGN KEY (entity_id) REFERENCES entities(id)
  )`);
  sqlite.run(`CREATE TABLE IF NOT EXISTS context (
    id integer PRIMARY KEY DEFAULT 1,
    active_task_id text,
    FOREIGN KEY (active_task_id) REFERENCES tasks(id)
  )`);
}

// Migrate existing DBs
try { sqlite.run(`ALTER TABLE entities ADD COLUMN description text`); } catch (_) {}
try {
  sqlite.run(`CREATE TABLE IF NOT EXISTS solutions (
    id text PRIMARY KEY NOT NULL, title text NOT NULL, description text,
    problem_id text NOT NULL, state text DEFAULT 'proposed' NOT NULL,
    created_at integer NOT NULL, updated_at integer NOT NULL,
    FOREIGN KEY (problem_id) REFERENCES problems(id)
  )`);
  sqlite.run(`CREATE TABLE IF NOT EXISTS tasks (
    id text PRIMARY KEY NOT NULL, title text NOT NULL, description text,
    solution_id text, parent_id text, entity_id text,
    state text DEFAULT 'pending' NOT NULL, position integer DEFAULT 0 NOT NULL,
    created_at integer NOT NULL, updated_at integer NOT NULL,
    FOREIGN KEY (solution_id) REFERENCES solutions(id),
    FOREIGN KEY (parent_id) REFERENCES tasks(id),
    FOREIGN KEY (entity_id) REFERENCES entities(id)
  )`);
  sqlite.run(`CREATE TABLE IF NOT EXISTS context (
    id integer PRIMARY KEY DEFAULT 1, active_task_id text,
    FOREIGN KEY (active_task_id) REFERENCES tasks(id)
  )`);
} catch (_) {}

export const db = drizzle(sqlite, { schema });
