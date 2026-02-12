# pm-agent

Product management backend — entities (hierarchical) and problems (assignable to multiple entities). State-machine driven via XState.

## Setup

```bash
bun install
bunx prisma migrate dev --name init
bunx prisma generate
```

## Usage

```bash
# Seed sample data
bun run src/seed.ts

# Run demo
bun run src/index.ts
```

## Schema

- **Entity** — hierarchical tree (self-referential `parentId`)
- **Problem** — has a state managed by XState (`identified → triaged → in_progress → resolved | wont_fix`)
- **EntityProblem** — many-to-many join table linking problems to entities
