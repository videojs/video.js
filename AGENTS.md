# Video.js 10 agent guide

Use this file for durable repository rules. Prefer retrieval-led reasoning: inspect the relevant code, tests, package manifest, and nearest `AGENTS.md` before relying on model memory or these summaries.

## Sources of truth

- Setup and contributor workflow: `CONTRIBUTING.md`
- Available commands and dependency versions: root and package `package.json` files
- Workspace topology: `pnpm-workspace.yaml`, Vite+ `run` configuration, and package manifests
- Formatting and static checks: `vite.config.ts`, `tsconfig*.json`, and `build/scripts/check-workspace.mjs`
- Current behavior: implementation and colocated tests
- Public package behavior: package source, exports, and README files
- Architecture rationale: `internal/design/`, `internal/decisions/`, and `rfc/`

When prose conflicts with executable sources, follow the executable source and update stale prose in the same change.

## Repository map

- `packages/utils`: shared utilities; DOM helpers live under its `/dom` export.
- `packages/element`: custom-element base.
- `packages/store`: framework-neutral state plus `/html` and `/react` bindings.
- `packages/spf`: stream-processing primitives, DOM bindings, playback engine, and the SPF-backed Medias. Depends on `packages/media`, never the reverse.
- `packages/media`: media contracts and state; browser hosts and third-party playback engines live under `/dom`.
- `packages/adapters/*`: one playback adapter package per engine or embed (`hlsjs-video`, `mux-video`, `youtube-video`, …) plus the private `mux` helper they share.
- `packages/extensions/*`: player extensions such as `google-cast` and `mux-data`.
- `packages/core`: runtime-neutral player logic; DOM bindings live under `/dom`.
- `packages/html`, `packages/react`: platform players.
- `packages/icons`, `packages/skins`: private shared assets and styling.
- `packages/installation`: shared installation schema, compatibility, code generation, and agent instruction renderer.
- `apps/sandbox`: Vite playground. `templates/` is tracked; `src/` is scratch.
- `apps/e2e`: Playwright coverage.
- `site`: Astro documentation site; follow `site/AGENTS.md`.

Keep framework-neutral packages free of DOM or framework dependencies. Put platform behavior in the appropriate adapter or binding package.

## Commands

Use pnpm only and run workspace commands from the repository root unless a package documents otherwise.

```bash
pnpm install
pnpm dev
pnpm -F <pkg> test [path-or-pattern]
pnpm -F <pkg> build
pnpm typecheck
pnpm lint
pnpm lint:fix:file <file>
pnpm check:workspace
```

Use the narrowest relevant test/build while iterating. Before handoff, run checks proportional to the change. If exported package types changed, build that package before `pnpm typecheck`; project references consume built declarations.

## Code and tests

- Match nearby code before introducing a new abstraction or naming rule.
- Check `@videojs/utils` before adding a helper. Prefer its predicate helpers over inline type/null checks where an equivalent exists.
- Structure function bodies as semantic paragraphs. Keep a declaration and an immediately following single-line guard for its value in the same paragraph. Treat braced or multiline guards as separate control-flow paragraphs. Otherwise, keep related declarations and operations together; separate unrelated declaration groups and changes of phase—such as setup, validation, mutation, notification, and return—with one blank line.
- Keep types beside their implementation; do not create generic `types.ts` buckets.
- Put package tests in a `tests/` directory beside the implementation and name them `<module>.test.ts`.
- Use Vitest and name `describe()` after the exact export under test.
- Add or update tests for changed observable behavior.
- Keep dev-only warnings, debug helpers, and `displayName` assignments behind `__DEV__`.
- Comments and JSDoc should explain non-obvious intent or contracts, not restate TypeScript or the next line.
- API-reference exports need richer JSDoc because the site builder extracts it; use `write-api-reference` for those changes.
- A published export is stable when a site reference page documents it or a stable export's types reference it. Tag every other export `@internal`, or `@experimental` when only a `stability: unstable` page or an experimental export's types reference it; `pnpm -F site check:api-stability` enforces this (SPF and store are not checked yet).

## Design records

- Create or expand a record under `internal/design/` or `internal/decisions/` only when the user explicitly asks for one. Do not infer that implementation, review, or planning work needs a record.
- `internal/design/`: compact architecture or feature rationale that cannot be inferred from code and tests.
- `internal/decisions/`: compact rationale for one tactical choice that cannot be inferred from code and tests.
- `rfc/`: proposals needing wider approval, especially public API or hard-to-reverse changes.
- `.agents/plans/`: temporary implementation notes; delete before merge. Extract rationale into a durable record only when explicitly requested.

## Skills and agent documentation

Checked-in skills are direct children of `.agents/skills/`. `pnpm install` exposes that canonical catalog through generated `.claude/skills/` and `.opencode/skills/` directory aliases. Load only the specialized workflow needed after inspecting relevant project sources.

- API: `design-api`, `review-api`
- Bundler plugins: `create-rolldown-plugin`, `create-vite-plugin`, `transform-rolldown-code`
- VJSC component anatomy: `create-vjsc-component`
- UI implementation: `create-html-component`, `create-react-component`, `implement-ui-transition`, `implement-accessible-ui`
- UI review: `review-html-component`, `review-react-component`, `review-accessibility`
- UI design: `write-html-component-design`, `write-react-component-design`, `review-html-component-design`, `review-react-component-design`
- i18n: `write-locale-translations`
- Docs and records: `write-docs`, `review-docs`, `write-api-reference`, `write-design-doc`, `write-rfc`
- Toolchain workflows: `configure-vite-plus`
- Skin parity: `maintain-vjsc-skin-gaps`
- Delivery: `investigate-issue`, `create-issue`, `review-branch`, `commit-pr`
- Tests: `maintain-tests`
- SPF behaviors: `create-spf-behavior`, `change-spf-behavior`
- SPF registry: `document-spf-feature`, `document-spf-use-case`, `implement-spf-feature`, `implement-spf-use-case`
- Agent guidance: `maintain-agent-docs`, `create-skill`

Keep `AGENTS.md` factual, small, and broadly applicable. Put repeatable vertical procedures in skills. Put detailed or conditional material in a skill reference and state when to read it. Do not duplicate code, schemas, command inventories, or design documents in agent prose.

Run `pnpm check:workspace` after changing `AGENTS.md`, `CLAUDE.md`, or any skill. It validates imports, portable skill metadata, and repository token budgets.
