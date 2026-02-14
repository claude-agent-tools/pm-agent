import { eq, like, and, isNull } from "drizzle-orm";
import { db } from "./db/index.ts";
import { entities, problems, entityProblems } from "./db/schema.ts";
import { createActor } from "xstate";
import { problemMachine } from "./machines/problem.ts";

// ── Entity operations ──

export function listEntities() {
  return db.query.entities.findMany({
    with: { parent: true },
  }).sync();
}

export function getEntityTree() {
  return db.query.entities.findMany({
    where: isNull(entities.parentId),
    with: {
      children: {
        with: {
          children: {
            with: {
              children: true,
            },
          },
        },
      },
    },
  }).sync();
}

export function addEntity(name: string, parentId?: string) {
  return db.insert(entities).values({ name, parentId }).returning().all()[0]!;
}

export function findEntity(query: string) {
  return db.query.entities.findMany({
    where: like(entities.name, `%${query}%`),
    with: { parent: true },
  }).sync();
}

// ── Problem operations ──

export function listProblems(state?: string) {
  return db.query.problems.findMany({
    ...(state ? { where: eq(problems.state, state) } : {}),
    with: {
      entityProblems: {
        with: { entity: true },
      },
    },
  }).sync();
}

export function getProblem(id: string) {
  return db.query.problems.findFirst({
    where: eq(problems.id, id),
    with: {
      entityProblems: {
        with: { entity: true },
      },
    },
  }).sync();
}

export function addProblem(data: {
  title: string;
  description?: string;
  impact?: string;
  opportunity?: string;
  state?: string;
}) {
  return db.insert(problems).values(data).returning().all()[0]!;
}

export function updateProblem(id: string, data: {
  title?: string;
  description?: string;
  impact?: string;
  opportunity?: string;
}) {
  return db.update(problems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(problems.id, id))
    .returning()
    .all()[0];
}

export function transitionProblem(id: string, event: string) {
  const problem = getProblem(id);
  if (!problem) throw new Error(`Problem ${id} not found`);

  // Validate transition via XState
  const actor = createActor(problemMachine, {
    snapshot: problemMachine.resolveState({
      value: problem.state,
      context: { problemId: problem.id, title: problem.title },
    }),
  });
  actor.start();

  const before = actor.getSnapshot().value;
  actor.send({ type: event } as any);
  const after = actor.getSnapshot().value;
  actor.stop();

  if (before === after) {
    throw new Error(`Invalid transition: cannot send ${event} from state "${before}"`);
  }

  db.update(problems)
    .set({ state: after as string, updatedAt: new Date() })
    .where(eq(problems.id, id))
    .run();

  return getProblem(id);
}

export function findProblems(query: string) {
  return db.query.problems.findMany({
    where: like(problems.title, `%${query}%`),
    with: {
      entityProblems: {
        with: { entity: true },
      },
    },
  }).sync();
}

// ── Assignment operations ──

export function assignProblem(problemId: string, entityId: string) {
  return db.insert(entityProblems)
    .values({ problemId, entityId })
    .returning()
    .all()[0]!;
}

export function unassignProblem(problemId: string, entityId: string) {
  db.delete(entityProblems)
    .where(and(
      eq(entityProblems.problemId, problemId),
      eq(entityProblems.entityId, entityId),
    ))
    .run();
}
