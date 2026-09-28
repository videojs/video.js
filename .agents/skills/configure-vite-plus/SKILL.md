---
name: configure-vite-plus
description: Configure Vite+. Use for tasks, cache, migration, or CI.
---

# Configure Vite+ workflows

Inspect the installed `vite-plus` version, root and owning-package manifests and `vite.config.ts` files, `build/pack.ts`, relevant CI workflows, and the command's current clean-run behavior before editing. Use `pnpm exec vp <command> --help` and installed types when they differ from online documentation.

Read [references/official-guide.md](references/official-guide.md) only for the sections that match the work: task graphs, cache diagnosis, GitHub Actions cache, Pack, or migration.

## Workflow

1. Classify each operation: `vp build` for applications, `vp pack` for libraries, and `vp run` for orchestration and caching. Invoke a script or configured task as `vp run <name>`; bare `vp <name>` selects a built-in command.
2. Preserve build boundaries. Keep historically separate packaging workflows in separate Vite+ configs unless they are genuinely variants of one build. A named `pack` array supports `vp pack --filter <name>` within one workflow; a nested `vite.config.ts` supports an independent workflow via `vp -C <dir> pack`.
3. Define ordering in `run.tasks`, not in serial shell pipelines. Every configured task needs `command` and cannot duplicate a same-named `package.json` script. Use `{ task: 'build', from: ['dependencies', 'devDependencies'] }` for declared direct workspace edges and `package#task` for synthetic edges such as generated CDN assets. `-r` selects workspace tasks; it does not replace missing task dependencies.
4. Let the graph expose independent work to Vite+'s scheduler. Do not lower concurrency to repair missing edges. Reserve `--parallel`, which ignores dependencies, for independent persistent tasks such as development servers.
5. Keep root scripts as thin selectors. Put package-specific commands, inputs, outputs, environment, and dependencies in the owning package's config.
6. Prove local cache stability before configuring cross-run cache. Only `vp run` uses Vite Task caching. Run the exact task twice and require the second run to hit. Prefer automatic tracking, then add `cache.input`, `cache.output`, `cache.env`, or `cache.untrackedEnv` only from observed misses. Avoid generators that rewrite unchanged inputs.
7. In GitHub Actions, install first, restore `node_modules/.vite/task-cache`, run the same `vp run` tasks used locally, and save only after success. Keep source and lockfile hashes out of the Actions cache key because Vite Task fingerprints task inputs.

## Repository gotchas

- Reuse packaging defaults from `build/pack.ts`; keep package entries, platform, and exceptional plugins local.
- Top-level Vite `resolve.alias` and Pack's `pack.alias` serve different consumers. Do not assume one configures the other; share alias constants when both commands need identical mappings and test both paths.
- Vite+ loads a package config before it can schedule that package's dependencies. Config-time imports from private workspace packages must be available without relying on their built output.
- `vp pack` uses file-system cache tracking rather than `vp build`'s cooperative Vite metadata. Diagnose its observed reads and writes before adding manual globs.

## Example

Input: The sandbox build consumes normal workspace packages and generated HTML CDN files.

Output: A configured build task with declared workspace and generated-artifact dependencies.

```ts
build: {
  command: 'vp build',
  dependsOn: [
    { task: 'build', from: ['dependencies', 'devDependencies'] },
    '@videojs/html#build:cdn',
  ],
}
```

## Validation

Run the narrow target from a clean output state, inspect `vp run -v` ordering, and run it immediately again to verify cache hits and restored outputs. Then run the affected package tests/build, `pnpm typecheck` when types or configs changed, and `pnpm check:workspace`. For CI changes, verify restore occurs after install, save uses the restore step's primary key, and logs show both an Actions cache restore and Vite Task cache hits.
