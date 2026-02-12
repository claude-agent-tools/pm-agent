import { db } from "./db.ts";
import { createActor } from "xstate";
import { problemMachine } from "./machines/problem.ts";

async function main() {
  // Query entity tree
  const roots = await db.entity.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          children: true,
        },
      },
    },
  });

  console.log("=== Entity Tree ===");
  for (const root of roots) {
    console.log(root.name);
    for (const child of root.children) {
      console.log(`  ├── ${child.name}`);
      for (const grandchild of child.children) {
        console.log(`  │   ├── ${grandchild.name}`);
      }
    }
  }

  // Query problems with their entity assignments
  const problems = await db.problem.findMany({
    include: {
      entities: {
        include: { entity: true },
      },
    },
  });

  console.log("\n=== Problems ===");
  for (const p of problems) {
    const entityNames = p.entities.map((ep) => ep.entity.name).join(", ");
    console.log(`[${p.state}] ${p.title}`);
    console.log(`  → assigned to: ${entityNames}`);
  }

  // Demo: run a problem through the state machine
  console.log("\n=== State Machine Demo ===");
  const demo = problems[0];
  if (demo) {
    const actor = createActor(problemMachine, {
      snapshot: problemMachine.resolveState({ value: demo.state, context: { problemId: demo.id, title: demo.title } }),
    });
    actor.start();

    console.log(`Problem: "${demo.title}"`);
    console.log(`  current state: ${actor.getSnapshot().value}`);

    actor.send({ type: "TRIAGE" });
    console.log(`  after TRIAGE:  ${actor.getSnapshot().value}`);

    actor.send({ type: "START" });
    console.log(`  after START:   ${actor.getSnapshot().value}`);

    actor.send({ type: "RESOLVE" });
    console.log(`  after RESOLVE: ${actor.getSnapshot().value}`);

    actor.stop();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
