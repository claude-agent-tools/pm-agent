import * as ops from "./ops.ts";

const args = Bun.argv.slice(2);
const resource = args[0];
const action = args[1];

function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : undefined;
}

function out(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

function fail(msg: string): never {
  console.error(JSON.stringify({ error: msg }));
  process.exit(1);
}

try {
  if (resource === "status") {
    out({
      context: ops.getContext(),
      entities: ops.getEntityTree(),
      problems: ops.listProblems(),
      solutions: ops.listSolutions(),
      tasks: ops.listTasks(),
    });
  } else if (resource === "reset") {
    ops.resetAll();
    out({ ok: true, message: "All data cleared" });
  } else if (resource === "entity") {
    switch (action) {
      case "list":
        out(ops.listEntities());
        break;
      case "tree":
        out(ops.getEntityTree());
        break;
      case "add": {
        const name = args[2] ?? flag("name");
        if (!name) fail("Name required: entity add <name> [--parent <id>] [--description \"...\"]");
        out(ops.addEntity(name, flag("parent"), flag("description")));
        break;
      }
      case "update": {
        const id = args[2];
        if (!id) fail("ID required: entity update <id> --name \"...\" --description \"...\"");
        const result = ops.updateEntity(id, {
          name: flag("name"),
          description: flag("description"),
        });
        if (!result) fail(`Entity ${id} not found`);
        out(result);
        break;
      }
      case "find": {
        const query = args[2];
        if (!query) fail("Query required: entity find <query>");
        out(ops.findEntity(query));
        break;
      }
      default:
        fail(`Unknown entity action: ${action}. Use: list, tree, add, update, find`);
    }
  } else if (resource === "problem") {
    switch (action) {
      case "list":
        out(ops.listProblems(flag("state")));
        break;
      case "get": {
        const id = args[2];
        if (!id) fail("ID required: problem get <id>");
        const p = ops.getProblem(id);
        if (!p) fail(`Problem ${id} not found`);
        out(p);
        break;
      }
      case "add": {
        const title = flag("title");
        if (!title) fail("Title required: problem add --title \"...\"");
        out(ops.addProblem({
          title,
          description: flag("description"),
          impact: flag("impact"),
          opportunity: flag("opportunity"),
        }));
        break;
      }
      case "update": {
        const id = args[2];
        if (!id) fail("ID required: problem update <id> --field value");
        const result = ops.updateProblem(id, {
          title: flag("title"),
          description: flag("description"),
          impact: flag("impact"),
          opportunity: flag("opportunity"),
        });
        if (!result) fail(`Problem ${id} not found`);
        out(result);
        break;
      }
      case "transition": {
        const id = args[2];
        const event = args[3];
        if (!id || !event) fail("Usage: problem transition <id> <EVENT>");
        out(ops.transitionProblem(id, event));
        break;
      }
      case "find": {
        const query = args[2];
        if (!query) fail("Query required: problem find <query>");
        out(ops.findProblems(query));
        break;
      }
      case "assign": {
        const problemId = args[2];
        const entityId = args[3];
        if (!problemId || !entityId) fail("Usage: problem assign <problem-id> <entity-id>");
        out(ops.assignProblem(problemId, entityId));
        break;
      }
      case "unassign": {
        const problemId = args[2];
        const entityId = args[3];
        if (!problemId || !entityId) fail("Usage: problem unassign <problem-id> <entity-id>");
        ops.unassignProblem(problemId, entityId);
        out({ ok: true });
        break;
      }
      default:
        fail(`Unknown problem action: ${action}. Use: list, get, add, update, transition, find, assign, unassign`);
    }
  } else if (resource === "solution") {
    switch (action) {
      case "list":
        out(ops.listSolutions(flag("problem")));
        break;
      case "get": {
        const id = args[2];
        if (!id) fail("ID required: solution get <id>");
        const s = ops.getSolution(id);
        if (!s) fail(`Solution ${id} not found`);
        out(s);
        break;
      }
      case "add": {
        const title = flag("title");
        const problemId = flag("problem");
        if (!title || !problemId) fail("Required: solution add --title \"...\" --problem <problem-id>");
        out(ops.addSolution({ title, description: flag("description"), problemId }));
        break;
      }
      case "update": {
        const id = args[2];
        if (!id) fail("ID required: solution update <id> --field value");
        const result = ops.updateSolution(id, {
          title: flag("title"),
          description: flag("description"),
          state: flag("state"),
        });
        if (!result) fail(`Solution ${id} not found`);
        out(result);
        break;
      }
      default:
        fail(`Unknown solution action: ${action}. Use: list, get, add, update`);
    }
  } else if (resource === "task") {
    switch (action) {
      case "list":
        out(ops.listTasks({
          solutionId: flag("solution"),
          parentId: flag("parent"),
          state: flag("state"),
        }));
        break;
      case "get": {
        const id = args[2];
        if (!id) fail("ID required: task get <id>");
        const t = ops.getTask(id);
        if (!t) fail(`Task ${id} not found`);
        out(t);
        break;
      }
      case "add": {
        const title = flag("title");
        if (!title) fail("Required: task add --title \"...\" [--solution <id>] [--parent <id>] [--entity <id>]");
        out(ops.addTask({
          title,
          description: flag("description"),
          solutionId: flag("solution"),
          parentId: flag("parent"),
          entityId: flag("entity"),
          position: flag("position") ? parseInt(flag("position")!) : undefined,
        }));
        break;
      }
      case "update": {
        const id = args[2];
        if (!id) fail("ID required: task update <id> --field value");
        const result = ops.updateTask(id, {
          title: flag("title"),
          description: flag("description"),
          state: flag("state"),
          entityId: flag("entity"),
          position: flag("position") ? parseInt(flag("position")!) : undefined,
        });
        if (!result) fail(`Task ${id} not found`);
        out(result);
        break;
      }
      case "activate": {
        const id = args[2];
        if (!id) fail("ID required: task activate <id>");
        out(ops.setActiveTask(id));
        break;
      }
      default:
        fail(`Unknown task action: ${action}. Use: list, get, add, update, activate`);
    }
  } else if (resource === "context") {
    switch (action) {
      case "show":
      case undefined:
        out(ops.getContext());
        break;
      case "clear":
        ops.clearActiveTask();
        out({ ok: true, message: "Active task cleared" });
        break;
      default:
        fail(`Unknown context action: ${action}. Use: show, clear`);
    }
  } else {
    fail(`Unknown resource: ${resource}. Use: problem, entity, solution, task, context`);
  }
} catch (e: any) {
  fail(e.message);
}
