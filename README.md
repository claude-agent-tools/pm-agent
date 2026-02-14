# pm-agent

Conversational problem management agent. You describe a problem, the agent guides you through capturing it, adding impact and opportunity, and organizing it against your entity hierarchy.

## What it does

1. **Capture** — You tell the agent about a problem in plain language. It extracts a title, description, and initial state.
2. **Decorate** — The agent walks you through adding impact (who's affected, how badly) and opportunity (what fixing it unlocks).
3. **Organize** — Assign the problem to one or more entities (teams, products, orgs) in a hierarchical tree.
4. **Track** — Problems move through a state machine: `identified → triaged → in_progress → resolved | wont_fix`.

## Setup

```bash
bun install
bun run db:generate
bun run db:migrate
```

## Usage

```bash
# Seed sample data
bun run seed

# Run demo
bun run dev
```

## Schema

- **Entity** — hierarchical tree (self-referential `parentId`)
- **Problem** — state-machine-driven via XState (`identified → triaged → in_progress → resolved | wont_fix`)
- **EntityProblem** — many-to-many join, links problems to entities

## Stack

- **Bun** + TypeScript
- **Drizzle ORM** + SQLite (`bun:sqlite`)
- **XState** for problem lifecycle state machine
