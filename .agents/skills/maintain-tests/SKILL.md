---
name: maintain-tests
description: Gate and audit test value. Use when writing, reviewing, or pruning tests or test-only seams.
---

# Maintain tests

Three modes, one value bar. Optimize for confidence, not deletion count.

- **Authoring**: gate every new or changed test at write time.
- **Audit**: run a focused sweep for tests that restate source, duplicate stronger proof, couple behavior to implementation, or keep test-only production seams alive. Land it as one coherent batch; continue in separate follow-up PRs.
- **Campaign**: prune a whole package or feature surface. Read [references/campaign.md](references/campaign.md) before starting one.

## Authoring gate

Before adding a test, answer four questions; a missing answer means do not add it yet:

1. What observable behavior, invariant, or independent contract does it protect?
2. What credible regression makes it fail?
3. Why does existing coverage not already catch that failure? Each contract has one primary owner at the strongest boundary. Runtime-neutral logic belongs to `core`, `media`, `store`, `spf`, or `utils` tests. `html` and `react` tests own only the binding: attributes, properties, props, rendering, events, registration, lifecycle, and SSR. Another layer needs its own distinct risk. Prefer a table-driven case or shared fixture over a near-duplicate test.
4. Does it need a production seam (export, flag, wrapper, injection hook) that no production caller needs? If yes, move the test to the real boundary instead.

Then check the test against every [junk pattern](#junk-patterns); a match fails the gate unless the [retention bar](#retention-bar) names the contract it independently guards. A test that breaks under behavior-preserving refactoring asserts implementation; rewrite it at the owning boundary.

Bug regression tests must fail on the pre-fix code for the intended reason and pass after the owner-boundary repair. One regression at the owner boundary covers the bug; do not replay it at every layer it crosses.

## Junk patterns

Authoring rejects new tests that match; audits hunt existing tests that do.

- assertion-free coverage probes, and assertions that cannot fail;
- self-comparisons and identity copiers;
- copied fixtures, inventories, manifests, or export lists;
- exact source, import, or string greps;
- private predicate or call-shape tests duplicated at real boundaries;
- duplicate invocations of the same contract, including core logic replayed through both HTML and React;
- adapter- or extension-local replays of shared helpers (`packages/adapters/mux`, `@videojs/utils`, shared media hosts);
- tests whose only purpose is preserving test-only exports, globals, or wrappers;
- dead production code whose only callers are tests;
- expected values produced by the helper or renderer under test;
- mocks that implement the asserted behavior, or one mock standing in for different APIs; module mocks flagged by `anti-slop/no-module-mocking` are a common source;
- fixtures that supply the event, state, or callback ordering the owner should produce, such as dispatching the media event the code should cause or asserting store state the path never writes;
- capability tests that restate declared flags instead of exercising the behavior the flag promises;
- negative controls that pass for an unrelated reason: another guard, a disconnected element, an API the simulated DOM lacks, a synchronous check of an update that lands a microtask or frame later, or a rejection the production path never reaches;
- names or fixtures that promise more than the input exercises.

## Value bar

Tests justify their maintenance cost by protecting behavior, a credible regression, or an independently meaningful contract. An existing test that must change for behavior-preserving reorganization is suspect, not automatically deletable.

Before judging a candidate, read the complete test and production owner, its entry point, callers, callees, sibling implementations, overlapping tests, CI routing, and history. Read root and scoped `AGENTS.md` files first. When a test claims dependency-backed behavior (hls.js, dash.js, Shaka, embed SDKs, jsdom, happy-dom), inspect the dependency source or types in `node_modules`. Check which environment the package's Vite config gives the test; simulated DOMs omit many media APIs.

## Discovery

Keep discovery read-only and report evidence before editing. For broad scope, run parallel lanes cut along production owners:

- runtime-neutral packages: `utils`, `store`, `element`, `media`, `core`;
- `spf`, by owner: core, network, media, playback behaviors, engines;
- UI by component family across `core`, `core/dom`, `html`, and `react`, so cross-layer duplicates are visible;
- adapters and extensions;
- tooling: `vjsc`, `skins`, `icons`, `installation`, `cli`, `cdn`, `build`, `tools`, `.github/scripts`;
- `site`, `apps/e2e`, and `apps/sandbox`;
- a cross-cutting sweep for the junk patterns and test-only exports.

Outside campaign mode, prefer a few high-confidence candidates over a large speculative inventory.

## Retention bar

Keep a test when it independently enforces a public export, custom-element attribute or event, React prop or ref, store state or request, media or adapter, stream-parsing, accessibility, styling-hook (data attribute or CSS custom property), SSR, i18n, installation-output, API-reference, package, release, visual-baseline, or architecture contract. Also keep:

- call ordering when order is observable behavior;
- regressions with a credible failure mode;
- source inspection when it is the cheapest independent guard: it fails when the contract changes (the user-facing key, byte, or path) and survives an identifier-only refactor;
- a retained test that fails on the baseline: treat it as a possible product bug, reproduce it, and repair the owner rather than deleting it.

Static or slow is not a deletion reason. A test that resembles implementation may still be the independent contract; prove otherwise before removing it.

## Candidate evidence

Record every field before editing; a missing field means the candidate is not ready:

- exact test name and location;
- what failure it can actually detect;
- non-test callers of the covered production or support seam;
- stronger remaining owner-boundary proof, or why no proof is needed;
- relevant history and the reason the test or seam exists;
- production or test-support deletion unlocked;
- risk and the focused validation command.

## Edit shape

Choose one coherent owner-boundary batch. Delete obsolete test-only exports, globals, wrappers, and dead production paths instead of preserving aliases. Move retained regressions to their canonical owners. Consolidate repeated package or dependency assertions into one generic contract.

Prefer net-negative production LOC. Do not add replacement tests that restate the same implementation, and do not convert uncertain candidates into cleanup to raise deletion counts.

## Validation

Never edit source or tests while Vitest is watching the checkout.

1. Tests resolve workspace packages from built output. In a fresh worktree, run `pnpm install` and `pnpm build:packages` first; rebuild a dependency after changing it.
2. Run the smallest owner and sibling tests with `pnpm -F <pkg> test <path-or-pattern>`. Timing-sensitive tests can fail under load; rerun a failure alone before recording it.
3. For removed greps or inventory assertions, run the executable that owns the real contract, such as `pnpm check:workspace`, `pnpm exec vp run <pkg>#build`, or `pnpm -F site api-docs`.
4. After removing exports, build the package and run `pnpm typecheck`.
5. Run `pnpm lint:fix:file <file>` on changed files, then `git diff --check`.
6. Inspect `git diff --numstat`; report production and tooling separately from tests and test support.
7. Have an independent reviewer compare removed coverage against the keepers before handoff.

## Landing and continuation

Commit, push, or open a PR only when authorized. Land one coherent PR at a time; after it lands, refresh from `main` and rerun read-only discovery for the next batch.

## Handoff

Report:

- root cause and removed low-value categories;
- production owner simplifications;
- retained false positives and why they remain valuable;
- focused and full proof actually run;
- production versus test LOC;
- PR and merge state;
- named follow-ups.

## Example

Input: “Audit the time slider tests.”

Output: Evidence for each candidate across `core`, `html`, and `react`, one keeper per contract, a single owner-boundary edit batch, the focused `pnpm -F <pkg> test` proof, and a production-versus-test LOC split.
