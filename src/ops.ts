import { eq, like, and, isNull } from "drizzle-orm";
import { db } from "./db/index.ts";
import { entities, problems, entityProblems, solutions, tasks, context } from "./db/schema.ts";
import { createActor } from "xstate";
import { problemMachine } from "./machines/problem.ts";

// ── Database operations ──

export function resetAll() {
  db.delete(context).run();
  db.delete(tasks).run();
  db.delete(solutions).run();
  db.delete(entityProblems).run();
  db.delete(problems).run();
  db.delete(entities).run();
}

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

export function addEntity(name: string, parentId?: string, description?: string) {
  return db.insert(entities).values({ name, parentId, description }).returning().all()[0]!;
}

export function updateEntity(id: string, data: { name?: string; description?: string }) {
  return db.update(entities)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(entities.id, id))
    .returning()
    .all()[0];
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

// ── Solution operations ──

export function listSolutions(problemId?: string) {
  return db.query.solutions.findMany({
    ...(problemId ? { where: eq(solutions.problemId, problemId) } : {}),
    with: { problem: true, tasks: true },
  }).sync();
}

export function getSolution(id: string) {
  return db.query.solutions.findFirst({
    where: eq(solutions.id, id),
    with: {
      problem: true,
      tasks: {
        with: {
          children: true,
          entity: true,
        },
      },
    },
  }).sync();
}

export function addSolution(data: {
  title: string;
  description?: string;
  problemId: string;
}) {
  return db.insert(solutions).values(data).returning().all()[0]!;
}

export function updateSolution(id: string, data: {
  title?: string;
  description?: string;
  state?: string;
}) {
  return db.update(solutions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(solutions.id, id))
    .returning()
    .all()[0];
}

// ── Task operations ──

export function listTasks(opts?: { solutionId?: string; parentId?: string; state?: string }) {
  const conditions = [];
  if (opts?.solutionId) conditions.push(eq(tasks.solutionId, opts.solutionId));
  if (opts?.parentId) conditions.push(eq(tasks.parentId, opts.parentId));
  if (opts?.state) conditions.push(eq(tasks.state, opts.state));
  if (!opts?.parentId && !opts?.solutionId && !opts?.state) {
    // default: top-level tasks only
    conditions.push(isNull(tasks.parentId));
  }

  return db.query.tasks.findMany({
    where: conditions.length === 1 ? conditions[0] : and(...conditions),
    with: {
      children: { with: { children: true, entity: true } },
      entity: true,
      solution: { with: { problem: true } },
    },
    orderBy: tasks.position,
  }).sync();
}

export function getTask(id: string) {
  return db.query.tasks.findFirst({
    where: eq(tasks.id, id),
    with: {
      children: { with: { children: true, entity: true } },
      entity: true,
      solution: { with: { problem: true } },
      parent: true,
    },
  }).sync();
}

export function addTask(data: {
  title: string;
  description?: string;
  solutionId?: string;
  parentId?: string;
  entityId?: string;
  position?: number;
}) {
  return db.insert(tasks).values(data).returning().all()[0]!;
}

export function updateTask(id: string, data: {
  title?: string;
  description?: string;
  state?: string;
  entityId?: string;
  position?: number;
}) {
  return db.update(tasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning()
    .all()[0];
}

// ── Context operations ──

export function getContext() {
  const row = db.query.context.findFirst({
    with: {
      activeTask: {
        with: {
          solution: { with: { problem: true } },
          entity: true,
          children: true,
        },
      },
    },
  }).sync();
  if (!row?.activeTask) return null;

  return {
    activeTask: row.activeTask,
    activeSolution: row.activeTask.solution,
    activeProblem: row.activeTask.solution?.problem ?? null,
  };
}

export function setActiveTask(taskId: string) {
  const task = getTask(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  // Upsert: delete + insert (single-row table)
  db.delete(context).run();
  db.insert(context).values({ id: 1, activeTaskId: taskId }).run();

  return getContext();
}

export function clearActiveTask() {
  db.delete(context).run();
}
