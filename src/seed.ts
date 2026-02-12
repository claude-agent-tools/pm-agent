import { db } from "./db.ts";

async function seed() {
  // Clean existing data
  await db.entityProblem.deleteMany();
  await db.problem.deleteMany();
  await db.entity.deleteMany();

  // Create entity hierarchy:
  //   Acme Corp
  //   ├── Engineering
  //   │   ├── Backend
  //   │   └── Frontend
  //   └── Product

  const acme = await db.entity.create({
    data: { name: "Acme Corp" },
  });

  const engineering = await db.entity.create({
    data: { name: "Engineering", parentId: acme.id },
  });

  const backend = await db.entity.create({
    data: { name: "Backend", parentId: engineering.id },
  });

  const frontend = await db.entity.create({
    data: { name: "Frontend", parentId: engineering.id },
  });

  const product = await db.entity.create({
    data: { name: "Product", parentId: acme.id },
  });

  // Create problems
  const p1 = await db.problem.create({
    data: {
      title: "API response times > 2s on /users endpoint",
      description: "P95 latency has degraded since last deploy",
      state: "identified",
    },
  });

  const p2 = await db.problem.create({
    data: {
      title: "Dashboard crashes on Safari 17",
      description: "TypeError in chart rendering library",
      state: "triaged",
    },
  });

  const p3 = await db.problem.create({
    data: {
      title: "No onboarding flow for new teams",
      description: "Users churn within first 3 days without guidance",
      state: "identified",
    },
  });

  // Link problems to entities (many-to-many)
  // p1 affects Backend
  await db.entityProblem.create({
    data: { entityId: backend.id, problemId: p1.id },
  });

  // p2 affects Frontend
  await db.entityProblem.create({
    data: { entityId: frontend.id, problemId: p2.id },
  });

  // p3 affects both Product and Engineering (cross-cutting)
  await db.entityProblem.create({
    data: { entityId: product.id, problemId: p3.id },
  });
  await db.entityProblem.create({
    data: { entityId: engineering.id, problemId: p3.id },
  });

  console.log("Seeded:");
  console.log(`  ${5} entities`);
  console.log(`  ${3} problems`);
  console.log(`  ${4} entity-problem links`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
