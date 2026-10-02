---
name: create-spf-behavior
description: >-
  Create a new SPF behavior with conventions-aligned shape. Walks through
  purpose articulation (carries /change-spf-behavior's purpose-first discipline),
  signal type choice, slot map design, composition placement, cleanup pattern
  selection, test placement, and engine wiring. Distinct from
  /change-spf-behavior (which modifies an existing behavior preserving its
  purpose) and /change-spf-behavior (which modifies an existing behavior whose
  purpose is changing). Triggers: "create behavior", "new behavior", "create
  SPF behavior", "add behavior", "scaffold behavior", "new SPF behavior".
---

# Create an SPF Behavior

Scaffold a new SPF behavior in `packages/spf/src/playback/behaviors/` (or
appropriate sub-path for variant-specific behaviors) with conventions-aligned
shape. The canonical failure mode without this discipline is jumping from
"we need a new behavior" to `defineBehavior({...})` without articulating
purpose — producing a behavior whose slot map drifts, whose composition
placement is unclear, or whose cleanup contract doesn't match the project
convention.

This skill is a **stub** scoped for use by `/implement-spf-feature`. Failure-
mode catalog grows from real use; the seeded entries below capture the
load-bearing patterns identified at skill-creation time.

## Usage

```
/create-spf-behavior [<behavior-name-or-purpose>]
```

The skill is typically invoked from `/implement-spf-feature`'s Step 6 when a
chunk requires a new behavior, but can be invoked directly when the user
knows the behavior shape upfront.

## Reference docs

Required reading before drafting:

- `internal/design/spf/conventions/behaviors.md` — when to define a behavior,
  one-vs-several decomposition, per-type specialization vs uniform-across-
  tracks, file placement, source-reset handling, **cleanup convention**
  (named-cleanup-collection + wrapper for multi-cleanup, not AbortController
  for SPF behaviors).
- `internal/design/spf/conventions/signals.md` — when to use `Signal<T>` vs
  `ReadonlySignal<T>`, multi-writer slot characterization, `peek` /
  `equalsById` helpers, `initialState` / `initialContext` seeding.
- `internal/design/spf/conventions/reactors.md` — if the behavior is a
  reactor (state-machine driven).
- `internal/design/spf/conventions/actors.md` — if the behavior creates or
  consumes Actors.
- `internal/design/spf/conventions/config.md` — config surface conventions.
- `packages/spf/src/CLAUDE.md` — source layout + dependency rules.
- Existing similar behaviors as templates (e.g., `switchVideoQuality` as a
  template for `switchAudioQuality`).

## Failure-mode catalog (seeded; grows with use)

- **Purpose-articulation skipped.** Same failure mode as `/change-spf-behavior`:
  jumping from "we need a behavior" to `defineBehavior` without naming what
  the behavior *does* in business terms. Carries the purpose-first
  discipline. The articulation should answer: what business rule does this
  behavior implement? What signal does it react to or write? What lifecycle
  does it own?

- **Slot map over-sized.** Including more slots in `stateKeys` /
  `contextKeys` than the behavior actually reads/writes locks the behavior
  to a fixed composition. Audio-only / video-only / live variants can't
  compose the behavior without wiring no-op slots. Per `behaviors.md` §
  Inverse: behaviors that operate uniformly across tracks, compose against
  the aggregating resource (e.g., `mediaSource.sourceBuffers`) when the
  behavior's logic is uniform, not against per-type slot pairs.

- **Cleanup pattern mismatch.** Per the project convention (recorded in
  `feedback_spf_cleanup_pattern` memory and `conventions/behaviors.md`),
  SPF behaviors use **named-cleanup-collection + wrapper** for multi-cleanup,
  *not* AbortController (which the broader CLAUDE.md cleanup-pattern section
  recommends for non-SPF code). New behaviors must match the SPF-specific
  convention.

- **Composition-variant logic in always-on behavior.** When a behavior is
  variant-specific (lives only in a live variant, audio-only variant, etc.),
  it must live as a separate behavior composed into the variant, *not* as a
  runtime conditional inside an always-on behavior. Same failure mode as
  the document-spf-feature catalog entry.

- **Tests written after the fact.** TDD discipline: write the test in
  `tests/<behavior-name>.test.ts` first, run it failing, then implement.
  Implementation-first produces tests that pass by construction.

## Steps (do these in order)

### Step 1 — Articulate purpose

Carry `/change-spf-behavior`'s purpose-first discipline forward to new
behaviors. Before any code:

- **What business rule does this behavior implement?** Name it in plain
  language. "Audio quality switching responds to bandwidth state by writing
  selectedAudioTrackId to the next viable quality."
- **What signal does it react to or write?** Inputs (read slots) and
  outputs (write slots).
- **What lifecycle does it own?** When does it activate, when does it
  cleanup, what triggers source-identity reset?
- **What's the failure mode if the behavior weren't there?** Helps clarify
  what's load-bearing.

**Stop and report to user** with the purpose articulation. The user
confirms before proceeding to slot map design.

### Step 2 — Choose signal types + slot map

Per `conventions/signals.md`:

- **`Signal<T>` (writable) vs `ReadonlySignal<T>`** — express read/write
  intent at the use site. If the behavior writes a slot, it needs `Signal<T>`.
  If only reads, `ReadonlySignal<T>`.
- **Multi-writer characterization** — if writing a slot another behavior
  also writes, characterize coordination along the three axes from
  `conventions/signals.md`: decision domain (config / DOM / intent /
  derived), trigger (one-shot vs ongoing), cost (cheap vs side-effect-heavy).
- **`stateKeys` / `contextKeys` sizing** — include only what the behavior
  actually reads/writes. Per the slot-map-over-sized failure mode, narrow
  is better.
- **`initialState` / `initialContext` seeding** — if the behavior's first
  read of a slot needs a meaningful default, seed via `initialState` rather
  than relying on `undefined`-narrowing.

### Step 3 — Choose composition placement

- **Always-on or variant-specific?** Composed into the `hls/video` engine
  (always-on), or into a variant engine (the `hls/audio` or
  `hls/background-video` engine)?
- **Position in the composition order?** Per `packages/spf/docs/hls-engine.md`,
  the composition has a logical order (lead-in: presentation resolution;
  middle: per-track-type setup, MSE, segment loading; tail-out: adapter
  integration). Where does this behavior slot in?
- **Per-type or uniform?** Per `conventions/behaviors.md`'s per-type vs
  uniform-across-tracks decision — if the behavior's logic varies per
  track-type, follow the per-type pattern (sibling behaviors + shared
  helper); if uniform, compose against the aggregating resource.

### Step 4 — Implement (TDD)

1. **Write the test first.** `packages/spf/src/playback/behaviors/tests/
   <behavior-name>.test.ts` (or sub-path per behavior placement).
2. **Run the test failing.**
3. **Implement the behavior** in `packages/spf/src/playback/behaviors/
   <behavior-name>.ts`. Apply conventions throughout.
4. **Run the test passing.**
5. **Wire into the engine composition** at the position chosen in Step 3.
6. **Run the composition tests** (`engine.test.ts` and related) to verify
   no regression.

### Step 5 — Final-shape audit + commit

Per the parent skill (`/implement-spf-feature`), commits are typically
batched at the feature-implementation level, not per-behavior. If invoked
standalone, propose a per-behavior commit shape and ask the user to confirm.

Audit checklist:
- **Conventions adherence** — behaviors.md, signals.md, cleanup pattern
- **No scope creep** — does the implementation match the purpose
  articulation from Step 1?
- **Tests cover the purpose** — does the test assert the business rule, not
  just incidental implementation details?
- **Composition wiring complete** — engine composition tests pass

## When this is the wrong skill

- **Refactoring an existing behavior, purpose preserved** → `/change-spf-behavior`
- **Updating an existing behavior, purpose changing** → `/change-spf-behavior`
- **Splitting / merging existing behaviors** → `/change-spf-behavior` /
  `/change-spf-behavior` (often routed through `/change-spf-behavior`)
- **Creating a media-layer or network-layer helper (not a behavior)** →
  manual for now; future media-layer / network-layer skills will own this

## How the failure-mode catalog grows

Same pattern as other SPF skills: when a new failure mode surfaces during
use, add an entry to the catalog above with a worked-example citation.
This skill is a stub; the catalog is expected to grow significantly as
real use surfaces patterns.
