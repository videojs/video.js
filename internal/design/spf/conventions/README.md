---
status: draft
date: 2026-05-07
---

# SPF conventions

> **When to reach for which SPF primitive, and the patterns that choice entails.** Each doc here answers questions of the form "when should I use a Behavior vs a helper?" or "when does a slot become a writable Signal vs a ReadonlySignal?" — *not* "how does a Behavior work under the hood."

## Why this is split from the implementation docs

"When to use" and "how implemented" decay at very different rates:

- **When to use a Reactor** is governed by the architectural role of Reactors. It changes only when the architecture changes.
- **How a Reactor is implemented** changes whenever the implementation evolves — refactors, optimizations, primitive churn.

If the two are co-located, an implementation refactor forces editing the "when to use" guidance, which then either drifts (because nobody updates it) or churns (because everybody does). Splitting them lets each move at its own rate. Implementation lives in `architecture.md`, `primitives.md`, `signals.md`, `actor-reactor-factories.md`, `packages/spf/docs/hls-engine.md`, and JSDoc on the source. Convention lives here.

## Relationship to the evaluation axes

The conventions docs and the evaluation axes ([`../evaluation-axes.md`](../evaluation-axes.md)) work together:

- **Axes** name *what* a piece of code is being scored on (Reusability, Robustness, Patternability, Simplicity, Size).
- **Conventions** name *how* to satisfy a given axis — patterns to follow, primitives to reach for, shapes to match.

A reviewer applies the axes; a contributor applies the conventions. When a convention earns its keep on a particular axis, it should say so explicitly (e.g. "this pattern wins on **C — Patternability** and **E — Size** but tensions against **D — Simplicity** at the call site").

## Index

Started small. Grow only when the assessment surfaces a recurring decision that doesn't have a stable pattern yet.

| Doc | Question it answers |
| --- | ------------------- |
| [behaviors.md](behaviors.md) | When to define a Behavior; behavior shape; helper vs behavior split; per-type specialization; file placement; source-reset handling. |
| [signals.md](signals.md) | When to use `Signal<T>` (writable) vs `ReadonlySignal<T>` (read-only); when to seed via `initialState`/`initialContext`; how code outside the composition writes its state; multi-writer slots; `peek` and `equalsById` helpers. |
| [reactors.md](reactors.md) | When to reach for `createMachineReactor`; the `deriveState` + `monitor` convention; the entry-returns-state-exit-cleanup idiom; source-identity states; policy modes as states. |
| [actors.md](actors.md) | When to reach for an Actor; the three actor shapes (`MessageActor` / `TransitionActor` / `CallbackActor`); when one actor vs two (mechanism + policy split); the per-type setup-actor cluster-ownership convention. |
| [config.md](config.md) | When to push a value to config vs bake it in; engine config as single source of truth; nested sub-configs; threading paths through behaviors / helpers / actors / lower-layer functions; multi-layer source-of-truth; DRY for shared defaults; decision logic with the algorithm. |

Planned but not yet written (drafted as the assessment or backlog surfaces a need):

- `tasks.md` — when to use Tasks + TaskRunners/Schedulers.
- `helpers.md` — extract a helper vs introduce a behavior factory.

## Cross-references

Implementation / "how" companions to the docs above:

- [`../architecture.md`](../architecture.md) — current implementation snapshot.
- [`../primitives.md`](../primitives.md) — Tasks, Actors, Reactors, State.
- [`../signals.md`](../signals.md) — signals decision and tradeoffs.
- [`../actor-reactor-factories.md`](../actor-reactor-factories.md) — `createMachineActor` / `createMachineReactor` factory shapes.
- [`../text-track-architecture.md`](../text-track-architecture.md) — reference Actor/Reactor implementation.
- [`packages/spf/docs/hls-engine.md`](../../../../packages/spf/docs/hls-engine.md) — current HLS engine composition walkthrough.
- [`packages/spf/src/CLAUDE.md`](../../../../packages/spf/src/CLAUDE.md) — source layout and dependency rules.
