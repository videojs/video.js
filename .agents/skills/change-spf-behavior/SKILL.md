---
name: change-spf-behavior
description: Change SPF playback-engine behaviors. Use when updating, refactoring, splitting, or merging responsibilities, signals, lifecycle, cleanup, or composition.
---

# Change an SPF behavior

Treat code and tests as implementation truth. Read the behavior, composition site, state/context slots, helpers, and tests, then load only the relevant file from `internal/design/spf/conventions/`.

Before acting, read the one detailed workflow that matches the requested change:

- Purpose expands or changes: `references/update.md`
- Purpose stays fixed while implementation improves: `references/refactor.md`
- One responsibility splits by type or concern: `references/split.md`
- Two responsibilities may become one: `references/merge.md`

1. State the current purpose, intended delta, and observable business rules.
2. Map inputs, writes, lifecycle gates, cleanup, ordering, and source-reset rules.
3. Choose the smallest destination shape that preserves those constraints.
4. Pin observable behavior with tests before changing implementation.
5. Re-read the final behavior without the diff and verify ownership, cleanup, composition, naming, and coverage.

For a split, name the ownership axis and cross-boundary invariants. For a merge, confirm the result owns one coherent purpose; extract a helper when only an algorithm is shared. Ask for direction when alternatives materially change ownership or public contracts.

Run the narrow affected tests, then as applicable:

```bash
pnpm -F @videojs/spf test
pnpm -F @videojs/spf build
pnpm size
```

## Example

Input: “Split source cleanup out of the playback lifecycle behavior.”

Output: A documented ownership boundary, pinned invariants, focused implementation changes, and proportional SPF checks.
