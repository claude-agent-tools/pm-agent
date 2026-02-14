---
name: pm-status
description: Show the current entity tree and all problems with their assignments and states.
---

# PM Status

Show the user a clear overview of their problem management database.

**CLI path:** `bun run ${CLAUDE_PLUGIN_ROOT}/src/cli.ts`

## Step 1: Get the data

```bash
bun run ${CLAUDE_PLUGIN_ROOT}/src/cli.ts status
```

## Step 2: Display as a readable summary

Format the output for the user. Don't dump raw JSON — present it like this:

### Entity tree

```
Zabaca
  ├── James
  └── Process
```

### Problems

For each problem, show:
```
[state] Title
  impact: ...
  opportunity: ...
  → assigned to: Entity1, Entity2
```

If there are no problems, say "No problems tracked yet. Use /problem to add one."

If the user asks to filter by state or entity, use:
```bash
bun run ${CLAUDE_PLUGIN_ROOT}/src/cli.ts problem list --state <state>
```
