import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Tables

export const entities = sqliteTable("entities", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  parentId: text("parent_id").references((): any => entities.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const problems = sqliteTable("problems", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: text("title").notNull(),
  description: text("description"),
  impact: text("impact"),
  opportunity: text("opportunity"),
  state: text("state").notNull().default("identified"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const entityProblems = sqliteTable("entity_problems", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  entityId: text("entity_id").notNull().references(() => entities.id),
  problemId: text("problem_id").notNull().references(() => problems.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  unique().on(table.entityId, table.problemId),
]);

// Relations

export const entitiesRelations = relations(entities, ({ one, many }) => ({
  parent: one(entities, {
    fields: [entities.parentId],
    references: [entities.id],
    relationName: "entityTree",
  }),
  children: many(entities, { relationName: "entityTree" }),
  entityProblems: many(entityProblems),
}));

export const problemsRelations = relations(problems, ({ many }) => ({
  entityProblems: many(entityProblems),
}));

export const entityProblemsRelations = relations(entityProblems, ({ one }) => ({
  entity: one(entities, { fields: [entityProblems.entityId], references: [entities.id] }),
  problem: one(problems, { fields: [entityProblems.problemId], references: [problems.id] }),
}));
