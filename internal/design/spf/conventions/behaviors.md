---
status: draft
date: 2026-05-07
---

# Behaviors

> **Behaviors are the unit of composition in SPF — almost all functionality lives in one.** A Behavior may be "simple" (using only signals from core) or "primitive-augmented" (reaching for a Reactor, Actor, Task + Runner, or other primitive under its setup). The questions this doc answers are *how much primitive infrastructure does this behavior need*, *should this be one behavior or several*, and *what does it look like when a behavior wants refactoring* — not "should this be a behavior at all," because it almost always should.
>
> For how Behaviors and the primitives they use work under the hood see [`../primitives.md`](../primitives.md), [`../architecture.md`](../architecture.md), [`../actor-reactor-factories.md`](../actor-reactor-factories.md), and [`packages/spf/src/core/composition/create-composition.ts`](../../../../packages/spf/src/core/composition/create-composition.ts).

## Behaviors are the universal unit

Engines are composed from a list of Behaviors. Anything that contributes to playback — DOM bindings, MSE/SourceBuffer orchestration, ABR, segment loading, track selection, end-of-stream detection — is encapsulated in (at least) one Behavior. Actors, Reactors, Tasks, and other primitives live **inside** behaviors as implementation tools, not alongside them at the composition layer.

The right shape question is not "Behavior vs Actor" but "Behavior with what underneath?"

## Simple vs primitive-augmented behaviors

A **simple** behavior reaches only for `signal` / `computed` / `effect` from `core/signals`. The body is effect-shaped and stateless beyond what the composition's signal map already gives it. Simple doesn't mean *single-effect* — a behavior can compose two `effect()`s in one setup and still be "simple" by this definition (see [Multi-effect behaviors](#multi-effect-behaviors)). `syncPreload` is the canonical example: two effects bidirectionally syncing `state.preload` and the host media element's `preload` property, with dedup and asymmetric `peek`/`get` reads.

A **primitive-augmented** behavior pulls in additional infrastructure under its setup — instantiating an Actor, registering a Reactor, queueing Tasks against a Runner, or capturing references that span multiple effects. `loadVideoSegments` is at the far end of this spectrum: it composes a `SegmentLoaderActor`, a `SourceBufferActor`, bandwidth-state signals, and a `ChunkedStreamIterable`-backed fetch pipeline.

Decision criterion: **the shape of the work, not its importance.** A trivial-feeling behavior can warrant an Actor (ownership of a stateful resource is the deciding factor), and an important-feeling behavior can be a handful of `effect()` lines (`syncPreload` is load-bearing despite being a two-effect simple behavior).

The set of primitives below describes **today's** options. SPF's primitive set isn't closed — when a behavior's shape doesn't fit either simple or any existing primitive, the right answer may be to surface a missing primitive rather than force-fit. See [Sniffs that say "no good fit yet"](#sniffs-that-say-no-good-fit-yet).

### Sniffs that say "reach past simple"

SPF has four primitive shapes a behavior can reach for under its setup. Pick by the shape of the work, not by importance:

- **Task + Runner** — discrete async work units with status, cancellation, and scheduling.
- **`createTransitionActor`** — reducer-shaped Actor: `(context, message) => context`, side effects allowed in the reducer. The simplest Actor shape; correct when the unit processes messages serially over a context but has no per-state behavior.
- **`createMachineActor`** — finite-state-machine Actor with per-state effects and entry handlers. Correct when the unit owns a resource *and* its behavior varies by state (e.g. MediaSource lifecycle: `idle` → `attaching` → `open` → `tearing-down`).
- **`createMachineReactor`** — finite-state-machine Reactor with reactive state derivation, per-state effects, and entry handlers. Correct when the work is *observe-and-react* (no resource ownership), with behavior gated on a derived state.

See [`../actor-reactor-factories.md`](../actor-reactor-factories.md) and [`../primitives.md`](../primitives.md) for the factory shapes and underlying implementation.

| Sniff | Reach for |
| ----- | --------- |
| Multi-step async work with status, cancellation, or scheduling | **Task + Runner** |
| Stateful unit that owns a resource and processes messages serially — no FSM, just a reducer over context | **`createTransitionActor`** |
| Stateful unit with per-state behavior (entry handlers, distinct effects per state, valid-transition rules) | **`createMachineActor`** |
| "Observe signal, dispatch message to actor" repeated several times — translation only | A Reactor; reach for **`createMachineReactor`** when the dispatch depends on a derived state |
| Hand-rolled FSM in the behavior body (nested `effect`s + flag-shaped `computed` signals like `canSetup` / `shouldSetup` / `isXing`) | **`createMachineReactor`** if observe-and-react; **`createMachineActor`** if the work owns a resource and processes messages |
| Body manually serializes work via flags (`isLoading`, `pending`, `inFlight`) | **`createTransitionActor`** — Actor message handling already serializes; the flag is reinventing the queue |

When the body is short, signal-only, and effect-shaped, simple is correct. Reaching for a Reactor when an `effect` would do is overkill on **D — Simplicity** without buying anything.

## One behavior or several

The decomposition question. The default leans toward **split until merging is required** — narrow slot maps are how `defineBehavior` exhaustiveness pulls its weight, and small behaviors compose more flexibly across engine variants (axis A — Reusability).

### Sniffs that say "split"

- `stateKeys` / `contextKeys` cluster into two disjoint groups touched by disjoint code paths in the body.
- The cleanup function has two unrelated halves (one tearing down a subscription, another disposing a resource).
- Two concerns happen to be wired together but don't share state — one reads a slot, another writes a different slot, and the only connection is "we set them up at the same time."
- The body has multiple lifecycle phases with different cleanup timing.
- Some keys in `stateKeys` / `contextKeys` are read only by some code paths in the body, never together.
- **Explicit per-type axis declared inline.** A `type FooType = 'video' | 'audio'`, a `KeyByType` map, a `for (const type of types)` loop that writes per-type slots. The axis being declared inline is itself a sniff: per-type specialization was already in mind when the merged form was written, and the merged form usually exists because of a perceived cross-type constraint (atomicity, ordering, shared lifecycle). Surface the constraint as the invariant `/change-spf-behavior`'s cross-boundary audit will evaluate, rather than treating it as foreclosing the split. The audit's possible outcomes include "split is fine, the invariant survives in registration order" and "keep merged, the invariant doesn't survive cleanly" — pre-deciding short-circuits both. Distinguishing this from the [uniform-across-tracks foil](#inverse-behaviors-that-operate-uniformly-across-tracks) is the *downstream consumer interface*: if consumers consume per-type, the per-type interface is the destination shape; if consumers iterate the aggregating resource, the aggregate is the destination shape.

### Sniffs that say "merge"

- Two behaviors share most of their slot map and always run together.
- One behavior is only meaningful when ordered immediately after another.
- Both are setting up against the same Actor and have to coordinate handoff through context to do it.
- Splitting required introducing a new "coordination" slot whose only purpose is bridging the two.

### Anti-pattern: split-by-domain instead of split-by-shape

A behavior named *after a domain concept* ("everything about audio") is often a merged version of three real behaviors (track selection, segment loading, sync). Conversely, a behavior named *after a small mechanical task* ("update the duration when buffered ranges change") is more likely to stay correctly sized. The split that matters is the slot-map split, not the conceptual one.

## Multi-effect behaviors

Most simple behaviors are a single `effect()`. The decomposition section above defaults to splitting before merging — but neither split nor merge fits a third shape: **multiple directions of dataflow over the same slot surface**, where each direction is shaped as its own continuous effect.

`syncPreload` is the canonical case: state.preload ↔ mediaElement.preload, one effect per direction. Splitting into two behaviors would mean both touch the same two slots and have to coordinate; merging into a single effect would conflate read-reactivity and write-reactivity (one wants `peek`, the other wants `get` — see hazards below).

### When to reach for it

- More than one direction of dataflow across the same slot surface (read-side and write-side, or two writes from different signal triggers that would be hard to express in one body).
- Each direction has a clean dependency set you wouldn't combine into one effect even if you could (one direction wants to react to a signal the other shouldn't subscribe to).
- The directions share cleanup lifecycle and slot ownership — splitting would require coordination through context.

### Hazards (and how `syncPreload` addresses each)

- **Creation-order dependency.** When two effects share a dependency signal, they run in registration order. This is load-bearing if the directions resolve a conflict on the shared change. Order the `effect()` calls deliberately and **document the invariant inline** so a future reorder is a flagged regression. `syncPreload` puts read before write to get "most-recent-wins on attach."
- **Echo loops.** A's write triggers B which writes back triggering A. Mitigate with **dedup before every write**: `if (target === current) return`. The dedup is also a brake against transitive triggers downstream (e.g., `resolvePresentation` reading `state.preload`).
- **Asymmetric reactivity** — one direction subscribes (`get`), the other reads-without-subscribing (`peek`). The peek-side effect is the one that should *only* react to upstream changes, not to its own / its partner's writes. Easy to "fix" the peek into a get and silently break the invariant — annotate inline.
- **Resolution-rule obligation.** When two effects fire on the same signal change, the first-to-write claims the slot. Spell out the *semantic* resolution rule (most-recent-wins, state-canonical, DOM-canonical, etc.) in the file-level JSDoc — not as an emergent property of effect order. The order is the *mechanism*; the rule is the contract.

### Not a Reactor

Bidirectional sync via two effects *looks* state-machine-y but has no states. The deciding factor is whether there are distinct states with per-state cleanup (cf. [`reactors.md`](reactors.md)). Two-effect simple behaviors don't qualify — leave them as `effect()`s.

## How to write a behavior — code sniffs

When you're inside a behavior body and something feels off, the question is usually one of:

1. *Is this behavior fighting its shape?* (refactor in place)
2. *Should this reach for a primitive underneath?* (augment with an existing primitive)
3. *Is this two behaviors pretending to be one?* (split)
4. *Is the right primitive missing?* (no good fit yet — surface a gap, hold the sniff visibly)

The sniffs below map to those answers. The fourth bucket is the most easily mistaken for one of the others — it's worth being explicit when an existing primitive is being stretched past its fit.

### Sniffs that say "fix in place"

- Lots of `if (signal.get() === undefined) return` guards at the top of an `effect`. Either the slot annotation is wrong (`Signal` should be `ReadonlySignal` from a writer that hasn't fired yet, suggesting the consumer should treat the value as eventually-arriving), or the guard is really a Reactor *predicate* — see "fight the shape" below.
- Imperative wiring of multiple subscriptions that all want to be torn down together. Reach for an `AbortController` (see CLAUDE.md "Cleanup Pattern") rather than tracking individual unsubscribes.
- Repeated `.get()` on the same signal across an `effect` body. Lift to a `computed` once and read the computed — clearer dependency, easier to reason about.

### Sniffs that say "augment with a primitive"

- Setup body grows past ~50 lines of imperative effect code. Almost always a Reactor or Actor wants to live underneath.
- The behavior creates a resource (SourceBuffer, MediaSource, fetch reader) that has its own lifecycle and needs disposing in cleanup. Move resource ownership to an Actor whose lifecycle the behavior orchestrates.
- The behavior captures **long-lived references** it didn't get from context. Those references want to be in context, written by another behavior or from outside the composition. A behavior that creates *and stashes* a reference is doing two jobs.
- Body branches on `config.type` at runtime. Split into per-type specializations (see [Per-type specialization](#per-type-specialization)).

### Sniffs that say "fight the shape"

This bucket is for cases where an existing primitive is the right answer and the body just isn't using it.

- Nested `effect` calls where the inner `effect` is gated by a flag the outer set up. Almost always wants a `createMachineReactor` (or a `createMachineActor` if the work also owns a resource).
- Hand-rolled FSM via flag-shaped `computed` signals (`canSetup`, `shouldSetup`, `isAttached`, `isTearingDown`) feeding a single `effect`. Same conversion targets as above — the FSM shape *is* what the machine factories provide.
- Imperative `addEventListener` plumbing for events that should drive a signal. Wire the events into a context-held signal (often via another behavior), then react to the signal.
- Subscribe/unsubscribe bookkeeping inside the body that an Actor or Reactor's lifecycle would handle.
- Reaching for a raw Actor (or hand-rolled message-and-context bookkeeping) when the work fits one of the factories. Use `createTransitionActor` or `createMachineActor`; the raw Actor primitive is below the convention layer.

### Sniffs that say "no good fit yet"

This bucket is for cases where neither simple nor any existing primitive fits cleanly — and forcing the work into the closest existing primitive degrades it. The honest answer is to surface the gap.

**Before declaring this bucket, check the factory inventory.** It's easy to write off a sniff as "no good fit" while overlooking an existing primitive — the case in `setup-mediasource.ts:63` (a comment about needing "Reactors with internal finite state") was almost certainly written before `createMachineReactor` shipped, and is now better classified as a fight-the-shape sniff. When you suspect a gap, name the existing primitives you considered and *why* each is a stretch, not just "doesn't quite fit."

Genuine signals that you're really in this bucket (not just unfamiliar with the inventory):

- A primitive-augmented behavior whose body is mostly *coordinating between* multiple primitives (an Actor's lifecycle gated on a Task's status gated on a signal), where the coordination logic itself is the bulk of the body. The coordination shape may want a name and a primitive of its own.
- A pattern that recurs across multiple Behaviors but isn't quite the same as any existing primitive — three Behaviors all hand-rolling the same scaffold with minor variations is a signal the scaffold wants extracting. Could be a helper or factory; sometimes a new primitive.
- A piece of the work doesn't fit *anywhere* in the existing primitive set — the body genuinely needs something not covered by signals, Tasks, the Actor factories, or the Reactor factory.

What to do when you've confirmed the gap:

- **Hold the sniff visibly in code.** A `// NOTE` or `// TODO` comment naming the missing primitive (or the conjectured shape of one) is more useful than a clean-looking force-fit, because it prevents the next reader from "fixing" the misshapen wiring without addressing the actual gap.
- **Surface the gap up the stack.** Add an entry to the cleanup plan or a relevant design doc (`internal/design/spf/`), or open an RFC if the missing primitive affects the public composition surface. Don't let the sniff live only in code.
- **Don't force-fit.** Reaching for the closest existing primitive when the shape genuinely doesn't fit costs **D** + **C** (more elaborate than the problem requires *and* a pattern violation that future readers will have to either decode or undo).
- **Convert when the primitive lands.** When a missing primitive is added, the held sniffs become migration targets — they're already self-documenting.

### Worked example: where `setup-mediasource.ts` falls today

- Augmented (it owns lifecycle of a MediaSource it creates), so not a simple behavior.
- Currently a single behavior — splitting would create two halves that have to coordinate through a new "ms ready" slot, which the merge-sniffs argue against.
- Has a fight-the-shape sniff: the `canSetup` / `shouldSetup` / nested-effect pattern is a hand-rolled FSM. The file's own comments hint at two refactor candidates — `createMachineActor` (treating MediaSource as a resource the Actor owns) or `createMachineReactor` (if the work is observe-and-react). Both already provide internal finite state. The older "if/when Reactors have internal finite state" comment likely predates `createMachineReactor` and should be reconciled when the cleanup is executed; the deciding factor between machine-Actor and machine-Reactor is whether MediaSource ownership belongs in this behavior or a longer-lived unit.

**Counterpoint** already shipped: `setupTrackResolution` in `packages/spf/src/playback/behaviors/resolve-track.ts` (commit series ending at `f707b0e9`) followed the same fight-the-shape sniff to a `createMachineReactor` migration with `entry: () => () => runner.abortAll()` for source-change cancellation. See the current file for the worked example of source-identity states + the entry-returns-state-exit-cleanup idiom; see [`reactors.md`](reactors.md) for the convention guidance.

The example is illustrative and may decay — read the code first when applying these sniffs to it.

## Refactoring an existing behavior

Refactoring a behavior is a different exercise from writing one fresh. The trap: starting from the code and working inward — "what does this do? what's wrong with it? how do I fix it?" — produces refactors that improve the code but miss the *purpose*. Skipping the purpose step is the canonical failure.

Use this sequence:

### 1. Articulate the purpose

In one sentence: what is this behavior **for**? Not what it does — the goal of having it.

If the file has a [top-level JSDoc](#file-level-jsdoc) articulating purpose, start there. If not, that's itself a finding (and a doc gap to fix as part of the refactor). If you can't state the purpose without reading the body in detail, the behavior's responsibility is unclear; that's a finding too.

**Purpose-statement verb diagnostic.** The verbs and timing markers in the purpose statement already foreshadow where the behavior lives in a reactor — and how much architectural weight it carries:

| Verb shape | Reactor location | Complexity weight |
| --- | --- | --- |
| "pick X on Y", "clear X on Z", "set X when W" | `entry` + cleanup | Light |
| "continuously adjust X based on Y", "track Y", "sync X to Y" | `effects:` | Heavy (state-driven) |
| "adjust X based on Y, gated by Z, resetting on W" | `effects:` + `entry` reset + state-exit cancel | Heaviest |

This matters for single refactors (a "continuously … gated by … resetting on …" purpose tells you you're in `createMachineReactor` territory before you read the body) and is load-bearing for [merges](#merging-two-behaviors--extra-discipline) where the heavier verb shape identifies the constrained side.

**Per-type structure diagnostic.** Independent of verb shape, the *grammatical subject* of the purpose statement signals per-type structure vs uniform operation:

| Subject shape | Implication |
| --- | --- |
| "Atomically X all Y" / "X every Z" / "X all needed Y" | Atomic-aggregate framing. Often hides a per-type axis under a cross-cutting constraint. |
| "Per available track type, X the Y for that type" / "For each type, X" | Explicit per-type structure. Each type is a unit; cross-type concerns are constraints linking the units, not the headline operation. |

If the file declares an inline per-type axis (`type FooType = 'video' | 'audio'`, a `KeyByType` map, a `for (const type of types)` loop), the purpose statement should match. Atomic-aggregate framing on per-type-structured work hides the axis and propagates the miss through downstream steps — `/change-spf-behavior`'s split-candidate check (Step 6a) is unlikely to recover the axis from body-iteration sniffs alone if Step 1's framing already collapsed it. The per-type axis is a Step-1 concern, not a Step-6 discovery.

Cross-type constraints (atomicity, ordering, shared-lifecycle) are *secondary* to the per-type axis in the purpose statement — they describe how the per-type units interact, not what the behavior does. Demoting atomicity from headline verb ("atomically X") to constraint clause ("…in one synchronous block") is what surfaces the per-type axis as primary.

**Worked example**: `setup-sourcebuffer.ts`'s current file-level JSDoc opens with "atomically create all needed `SourceBuffer`s for the current source" — atomic-aggregate framing on per-type-structured work. Corrected: "per available track type, when the selected track of that type is resolved with codecs, create a `SourceBuffer` + actor for that type; do all the `addSourceBuffer` calls in one synchronous block per the Firefox `mozHasAudio` invariant; on `mediaSource` detach or destroy, tear down per type." Atomicity demotes from headline verb to constraint clause; the per-type axis becomes the headline. Step 6a's per-type-axis trigger then fires from the purpose statement alone, before any body-iteration analysis.

### 2. List the business rules

Given the stated purpose, what are the implicit rules the behavior should satisfy?

- What should it do on **initial load** (first time the relevant inputs are available)?
- What should it do on **source unload / reset** (inputs become unavailable)?
- What should it do on **internal updates** (inputs change but identity preserved)?
- What should it do on **external writes** to the slots it owns?
- Are there **per-type / per-variant** rules?
- What's **out of scope** — what other behaviors should handle?

### 3. Gap analysis

Compare current code to those rules. Where does it fall short?

- **Implicit gaps** — rules the purpose implies but the code doesn't enforce. (Most common; the load-bearing finding.)
- **Explicit gaps** — flagged in the assessment, in TODOs, in code comments.
- **Process gaps** — closure-mutable state, defense-in-depth without an articulated failure mode, fight-the-shape sniffs.

### 4. Pattern selection

Pick from the documented patterns:

- Continuous reactivity → `effect()`.
- Distinct states with per-state continuous behavior → [`createMachineReactor`](reactors.md) with `effects`.
- One-shot work on state transitions → `createMachineReactor` with `entry`. If the work has a cleanup that should fire on state exit, return it from the same `entry` rather than expressing it as the next state's `entry` — the entry-returns-cleanup form covers the destroy path that the next-state's-entry form silently misses. See [`reactors.md` → Bind cleanup to its setup](reactors.md#bind-cleanup-to-its-setup-not-to-the-next-states-entry).
- Stateful resource ownership with serial work → `createMachineActor` or `createTransitionActor`.
- Source-driven async work needing cancellation → reactor with [source-identity states](reactors.md#source-identity-states-for-source-driven-work) + abort-on-state-exit.

The [transition-driven vs state-driven distinction](reactors.md#transition-driven-vs-state-driven-work) is the most-commonly-missed one for behaviors with FSM shape — using `effects` for transition-driven work produces spurious re-runs.

For the lightest verb shape ("set X when Y resolves"), pattern selection isn't always decisive — see [Where both shapes are legitimate](#where-both-shapes-are-legitimate-the-light-reactor--simple-effect-band) below. Run the band check before locking in `effect()` vs `createMachineReactor` with `entry`.

### 5. Convention checks

Before writing the refactor, run through:

- Setup-shape helper signature?
- [Pure helpers extracted to `media/` or `network/`](#pure-helpers-dont-belong-in-behaviors)?
- File placement (DOM-free vs DOM-bound)?
- [Naming](#naming) (descriptive verb, no `*Behavior` suffix; helpers `setup*`, factories `make*`)?
- [File-level JSDoc](#file-level-jsdoc) articulating purpose?

### 6. Decomposition check

Having stated the purpose: **should this behavior still exist as-is?**

If the purpose overlaps with another behavior's purpose — both writing the same slot, both reacting to the same source-identity transitions — the multi-writer arrangement may be a symptom of a single purpose split across two behaviors.

**Diagnostic — do the writers share a decision-making domain?**

- **Same domain → likely split-symptom; consider merging.** Multiple writers that read the *same inputs* and choose among the *same options* are aspects of one concern. Example: `selectVideoTrack` (default on load) and `quality-switching` (ABR over bandwidth) both decide what to write to `selectedVideoTrackId` based on presentation + bandwidth + config. They're two aspects of one "manage video track selection" concern; merging dissolves the multi-writer arrangement.
- **Different domains → separate behaviors, but prefer an intent slot over co-writing the resolved slot.** Writers that reflect *genuinely different inputs* (config-driven default vs DOM-driven user action; programmatic vs network-event-driven) belong in separate behaviors — but route them to a shared *intent* slot that a single owner resolves, rather than co-writing the resolved output. Example: text selection once had `selectTextTrack` (config default) and `sync-text-tracks` (DOM `change`) both writing `selectedTextTrackId`. That multi-writer was resolved by moving the DOM bridge to write `userTextTrackSelection` (intent) and making `switchTextTrack` the single writer of the resolved `selectedTextTrackId` (see [clusters.md § multi-writer](../features/clusters.md)).

Make this decision *after* the refactor proposal lands so the simpler shape is what you're evaluating, not the current shape. The decomposition merge often slots cleanly into the larger refactor of the *other* writer — e.g., `selectVideoTrack` would naturally merge into a refactored `quality-switching` rather than land as a standalone change.

### Where both shapes are legitimate: the light-reactor / simple-effect band

For the lightest verb shape — "set X when Y resolves," with no follow-on continuous reactivity — both a single-positive-state `createMachineReactor` and a guarded `effect()` are legitimate. Outside this band, the pattern is prescribed by [Step 4](#4-pattern-selection); the band is the narrow case where both forms genuinely apply.

By definition, the band is the case where both forms are correct on **A — Reusability** and **B — Robustness** (per [`../evaluation-axes.md`](../evaluation-axes.md)). The choice sits on the **C vs D tension**: the reactor wins on **C — Patternability** (sibling consistency, structural state-exit naming); the simple effect wins on **D — Simplicity** (less scaffolding, matches actual complexity).

**Default to D — pick the simpler form unless C factors are load-bearing for this specific case.** Load-bearing C looks like: many siblings already established, external observers that benefit from named lifecycle states, plausible additional state on the [pressure list](../evaluation-axes.md#pressure-list-axis-a-target). "An adjacent file uses X" is a C-axis signal that needs to earn its keep at this call site, not be applied by file-name kinship. Per the C vs D tension entry in `evaluation-axes.md`: *"the convention earns its keep across many call sites, not at any one."*

The band applies when **all four** of these hold. If any one fails, the pattern is prescribed (typically reactor for state-machine cases, effect for non-state-machine cases) — there's no choice to surface.

1. **Single positive state.** One resolved/active condition; no per-state effects to distinguish.
2. **Source-identity-driven.** The work is bounded by a source signal's lifecycle (typically `state.presentation`).
3. **Re-fire-safe entry work.** The entry is idempotent on re-fire — an `if (already done) return` guard at the top is a natural no-op against internal source updates, not a fight-the-shape sniff.
4. **No undo semantic on state exit, OR the undo is structurally bound to a single effect run.** Two sub-cases keep you in the band:
   - **4a — No undo needed**: the written value lives inside an object replaced wholesale on source change (e.g., a field of `state.presentation`), or the slot is re-initialized by another behavior on the new source.
   - **4b — Undo is one effect-cleanup away**: this behavior is the **sole writer** of the slot it clears, and the clear is the effect's natural cleanup return — no `let lastFoo` closure-state needed. Synchronous resource ownership (`create() → destroy()` driven by a single signal) fits here.

   The band does *not* apply when the slot has **multiple writers** AND a stale value would block downstream work — a simple effect there would need closure-mutable transition state (`let wroteLastTick`) to know whether to clear, which is the anti-pattern the reactor's structural state-exit cleanup solves.

Trade-offs when all four hold:

| Reactor (single-positive-state) wins on | Simple effect wins on |
| --- | --- |
| Sibling consistency with other reactor-using behaviors in the same engine | Cognitive overhead — matches the actual complexity of the work |
| State-exit and destroy paths are structural and named | Less boilerplate — no `deriveState` / `derivedStateSignal` / `monitor` scaffolding for one positive state |
| Future headroom if a second positive state emerges | Reads as appropriately light when the work stays single-state |
| Self-documenting lifecycle (state names *are* the contract) | No fight-the-shape risk if the work stays this simple |

Concretely: weigh the table against the D-default framing above. Sibling count, expected headroom, and how heavy the behavior reads at the call site are all C-axis weights; they only override D when load-bearing for this case.

**Worked examples**:

- `calculate-presentation-duration` — **in the band, lives as a simple effect (D wins).** Duration is written *into* the presentation object itself; a new source's presentation arrives with `duration === undefined` and no explicit clear is needed (criterion 4a).
- `setupTextTrackActors` — **in the band, lives as a simple effect (D wins).** Single-resource synchronous create/destroy (the `TextTracksActor` + `TextTrackSegmentLoaderActor` co-owned pair), sole writer of `textTracksActor` / `textTrackSegmentLoaderActor`, no async, no per-state continuous reactivity. Criterion 4b applies: the effect's cleanup return handles destroy + slot clear structurally with no closure state. File-name kinship with `setupMediaSource` (reactor) is a C-axis pull that doesn't earn its keep here — that sibling carries genuine A/B weight (async + source-reset cancellation via `waitForMediaSourceOpen` + abort-on-state-exit) that this behavior lacks.
- `select-tracks` — **outside the band, lives as a reactor.** `selectedTrackId` is a top-level slot with multiple writers (default-on-load *and* DOM-driven sync); a stale id blocks the new source's `resolve-track`, so explicit clear-on-unload is required *and* the effect form would need closure-mutable transition state to coordinate with the other writers (criterion 4 fails on the multi-writer clause).

The first three behaviors share verb-shape "set X when Y resolves" and look superficially identical against the diagnostic in [Step 1](#1-articulate-the-purpose) — the band check (and the D-default inside the band) is what distinguishes them.

### Cleaned-shape sketch

When projecting what a behavior should look like post-refactor — especially across two sides for [merge analysis](#merging-two-behaviors--extra-discipline) — use this structured format. The template makes shapes directly comparable and forces explicit answers to questions the unstructured "Proposed changes" prose tends to skim:

```text
- States:                            [list, or 'n/a' for non-FSM]
- entry work:                        [what runs once on state entry]
- effects: (continuous reactivity):  ['none' if not state-driven]
- State-exit cleanup:                [what runs on state exit / behavior destroy]
- Source-reset concerns:             ['none' or describe the reset contract]
- Private temporal state:            ['none' or describe what + where it lives]
```

For single-behavior refactors the sketch is optional — "Proposed changes" prose usually carries the same content. For merges the sketch is **required for both sides** so the [complexity inventory](#complexity-inventory-which-side-is-more-constrained) and merge direction have a comparable artifact to operate on.

A sketch is not a refactor commitment. If a side already conforms to current conventions, sketch from its current code; only project a cleaned shape when the side's gap analysis turned up real issues.

### Merging two behaviors — extra discipline

> This section is the canonical reference for the merge workflow. The [`change-spf-behavior`](../../../../.agents/skills/change-spf-behavior/references/merge.md) skill operationalizes it; either reach for that skill or follow the steps below directly.

When the decomposition check says merge, the refactor is **two separate analyses combined**, not one:

1. **Per-side standalone analysis.** For each side, run Steps 1–4 of the refactoring sequence (purpose, business rules, gap analysis, pattern selection) *as if it were a standalone refactor*. Produce a [cleaned-shape sketch](#cleaned-shape-sketch) per side in the structured format. **A side that already conforms to current conventions doesn't need refactoring** — sketch from its current code. Only project a cleaned shape when the gap analysis finds real issues; don't steer toward refactors that aren't warranted.
2. **Identify the constrained side** via the [complexity inventory](#complexity-inventory-which-side-is-more-constrained).
3. **Declare merge direction explicitly.** "Building from \<constrained side\>'s reactor; folding \<simpler side\> into \<where\>." Pause for user confirmation before combining — direction is the load-bearing call and the natural place for human judgment to override the inventory.
4. **Combine.** The constrained side's reactor is the host; the simpler side's `entry`/cleanup folds into the host's `entry`/cleanup; the constrained side's `effects:` ride along.

Skipping per-side analysis and going straight to "combine the existing bodies" produces a relocated mess: each side's anti-patterns survive into the merged form (closure-state, fight-the-shape sniffs, defense-in-depth that has lost its rationale, etc.). **Merge is not relocation.**

#### Complexity inventory: which side is more constrained?

Count "yes" answers per side. The side with more is the constrained one — build the merged shape from there. Bias toward "yes": under-counting an item that's there is the failure mode (the simpler-side declaration arrives a sentence later either way; the inverse mistake leads you to extend the simpler shape outward, which produces conditional branches and afterthought integrations).

| Inventory item | Yes if … |
| --- | --- |
| Multiple states / sub-states | the cleaned shape needs more than a single `resolved`/`unresolved` split |
| `effects:` needed (continuous reactivity) | work has to re-fire on signal changes within a state |
| Source-reset semantics | per-source state must reset on URL change / behavior destroy |
| Per-source temporal state | timers, gates, accumulators, "last X at" comparisons |
| Conditional / gating logic on the writes | downgrade-immediate / upgrade-gated / threshold-based decisions |
| Hand-rolled FSM-shape sniffs in the current code | latent architectural weight even if expressed as a flat effect today |
| Defense-in-depth or short-circuit guards beyond input validation | implies a failure mode worth explicit state-machine expression |

**Common failure mode**: anchoring on the current *merged-helper parameter count* rather than the *cleaned standalone shape*. The merged helper's parameters reflect every input from both sides; the per-side cleaned-shape sketch is what shows architectural weight. The complexity inventory operates on the sketches, not on the merged file.

**Build from the more constrained side.** Use the constrained side's cleaned shape as the starting structure for the merged shape; the simpler input fits as a special case (often a no-op or default) within it. Building the other direction (extending the simpler shape outward to host the complex case) tends to produce conditional branches and afterthought integrations — the leaky-abstraction sniff in [`reactors.md`](reactors.md).

## Source-reset handling (playback-engine behaviors)

Behaviors composed into a playback engine almost always have an implicit dependency on a current source — typically `state.presentation`. Source reset (URL change, presentation cleared, behavior destroyed mid-stream) is a first-class concern: every playback-engine behavior should be designed with explicit semantics for it.

Three categories of source-dependence, each with its own reset contract:

### 1. Async work tied to a source

The behavior schedules tasks (fetches, parses, transforms) whose result is meaningful only for the source they were scheduled against.

**Reset contract**: cancel in-flight work; do not let it commit.

**Pattern**: `createMachineReactor` with source-identity states; `entry: () => () => runner.abortAll()` on the active state. See [`reactors.md`](reactors.md) → "Source-identity states for source-driven work." `setupTrackResolution` in `packages/spf/src/playback/behaviors/resolve-track.ts` is the canonical worked example.

**Hazard**: the spec-defined fetch signal abort cancels in-flight body reads, so tasks awaiting fetch completion fail-fast on signal abort. Behaviors that bypass the signal (e.g., manual `addEventListener('updateend')` plumbing) need explicit teardown in the same cleanup.

### 2. State derived from a source

The behavior holds derived state (closure flags, computed projections, accumulated counters) computed against the current source.

**Reset contract**: reset the derived state when the source changes.

**Pattern**: don't carry derived state in closure-mutable variables; either compute it via `computed` (auto-tracks the source signal), scope it to a state-machine state so it's freshly initialized on each entry, or — when the state has external observers — express it as a writable slot the reactor drives via [slot-driven derivation](reactors.md#slot-driven-state-derivation) + [effects-based cleanup](reactors.md#effects-based-cleanup-for-within-state-identity-changes). Closure-mutable state (`let lastUpgradeTime`, `let hasEnded`) survives source resets and produces stale answers.

**Hazard**: the easy bug. `quality-switching`'s closure-state flags and `end-of-stream`'s `hasEnded` are open instances of this category; `update-mediasource-duration`'s former `running` flag was dissolved when the behavior migrated to a reactor (state-exit cleanup replaces the manual serialization flag).

### 3. Resources owned per source

The behavior creates a resource (MediaSource, SourceBuffer, Actor, listener) whose lifecycle is bound to the source.

**Reset contract**: dispose the resource when the source changes; create fresh on the new source.

**Pattern**: state-machine state-exit cleanup or behavior-level cleanup. For MediaSource-shaped resources where the lifecycle has multiple states (idle / attaching / open / tearing-down), `createMachineActor` is often the right primitive — the resource owns its own state machine.

**Hazard**: mid-flight teardown vs. late commits. If the resource is being torn down while in-flight work referencing it is completing, the work must short-circuit. `setup-mediasource`'s nested-effect-via-flags pattern is an instance.

### Source-reset checklist

When designing or reviewing a playback-engine behavior:

- What does this behavior depend on from the source?
- On `set source → unset → set new`: does the behavior recover correctly? (Common URL-change path.)
- On `set source → set new` directly (no unset intermediate): is this assumed not to occur, or is there defense in depth?
- On `behavior destroyed mid-async`: is teardown clean? Does in-flight work bail or leak?
- Is any state that should reset on source change carried in closure variables instead of state-machine state or signal-derived computed?

The cleanup pass should re-audit each behavior through this lens; the symptom-level findings in the assessment (closure flags, manual cleanup, hand-rolled FSMs) cluster around source-reset gaps.

## Behavior shape

Always construct via `defineBehavior` rather than building the behavior object literal manually. `defineBehavior` enforces single-behavior key/param consistency: declared `stateKeys` must equal `keyof S` inferred from the setup's state-param type. Drift between the declared keys and the body's reads/writes becomes a type error at the definition site.

```ts
export const syncPreload = defineBehavior({
  stateKeys: ['preload', 'presentation'],
  contextKeys: ['mediaElement'],
  setup: syncPreloadSetup,
});
```

The narrow exception is `defineExternalSignals` (and any similar generic behavior factory): `defineBehavior`'s exhaustiveness check only resolves on concrete types, so a factory generic over its keys checks them on its own parameter and returns a `Behavior<>` literal. If you find yourself reaching for the literal form for any other reason, pause — there's probably a missing key declaration.

### Setup-param typing (read/write intent)

Type the `setup` deps with `Signal<T>` for slots the body **writes** and `ReadonlySignal<T>` for slots the body only **reads**. This is a real contract enforced by the type system — `Signal<T>` permits `.set()`, `ReadonlySignal<T>` does not. See [`signals.md`](signals.md) for the broader treatment.

```ts
function syncPreloadSetup({
  state,
  context,
}: {
  state: { preload: Signal<State['preload']> };          // body writes
  context: { mediaElement: ReadonlySignal<...> };        // body only reads
}): () => void { ... }
```

### Narrow the slice with `Pick`

When a behavior touches only a few keys of a wider state shape (`PresentationState`, `EngineContext`, etc.), narrow the slice with `Pick` rather than typing against the wide shape. This makes the read/write contract visible at the definition and lets `defineBehavior`'s exhaustiveness check do its job.

```ts
type State = Pick<PresentationState, 'preload'>;
```

### Required vs optional config

A behavior's `config` fields are typically optional with sensible defaults (`defaultPreload?: StandardPreload`, `defaultCurrentTime?: number`). Mark a field **required** only when supplying a default would force the behavior to depend on a layer it shouldn't.

**When to require:**

- The default would couple the behavior to a format / platform / library it doesn't otherwise import. `parsePresentation` defaulting to `parseMultivariantPlaylist` would force `resolve-presentation.ts` to import HLS — coupling a format-neutral behavior to one specific format.
- No format-neutral default exists — the value is intrinsically caller-specific (a parser, decoder, or resolver whose shape varies by format).

**When to keep optional with a default:**

- The default is a true spec/standard fallback (`'metadata'` is a W3C preload value, not a library binding).
- The default lives at the same layer as the behavior — no upward dep.
- The default is correct ≥99% of the time and overriding is the exceptional case.

**How required config composes through the stack:**

Mark the field as required on the behavior's `Config` interface and drop the `?` on the setup-fn deps' `config:`. `defineBehavior`'s `RequireIfNonEmpty<'config', Cfg>` already makes the config arg required at the behavior call site whenever `Cfg` has any keys; the new force is at the *field* level, propagated through `ResolveBehaviorConfig` so `createComposition`'s intersected `Cfg` carries the required field — typecheck forces the engine to supply it.

The composing engine binds the default in its exported `defaultConfig`; the engine-level config field stays optional so engine users don't think about it unless they want a non-default value:

```ts
// In the behavior — required, no default
export interface ResolvePresentationConfig {
  parsePresentation: ParsePresentation; // required
  defaultPreload?: StandardPreload;     // optional, spec-fallback
}

// In the engine — optional, defaulted in defaultConfig
interface EngineConfig {
  parsePresentation?: ParsePresentation;
  // ...
}

export const defaultConfig = {
  parsePresentation: parseMultivariantPlaylist,
  // ...
};

// createEngine: `config` overrides; `defaultConfig` fills every key it leaves out or `undefined`
createComposition([...behaviors], { defaultConfig, config, initialState });
```

The behavior stays format-neutral; the engine binds it to HLS at compose time. Engines for other formats wire their own parser without touching `resolvePresentation`.

**Worked example**: `resolvePresentation.parsePresentation` (required) + the `hls/video` engine's `EngineConfig.parsePresentation?` (optional, defaults to `parseMultivariantPlaylist`).

### Cleanup contract

Return one of:

- `() => void` — most common; an unsubscribe-style cleanup (often the return value of `effect(...)`).
- `void` — when the behavior only registers handlers that are owned by something with its own lifecycle.
- `{ destroy(): void | Promise<void> }` — when cleanup is multi-step or async.

If a behavior owns an Actor, the cleanup should call the Actor's `destroy()` (or equivalent) — leaving an Actor running past its parent behavior's teardown is a leak.

#### Multi-cleanup: collect named cleanups, return a wrapper

When a behavior's setup — or an `effect()` body inside it — produces multiple cleanups, collect each as a named `const` and return a wrapper function that calls them. Do **not** reach for `AbortController` to coordinate in-behavior multi-cleanup, even though CLAUDE.md → "Cleanup Pattern" suggests it. That guidance applies to class-based long-lived lifecycle (e.g., a controller's `connect()` / `disconnect()` where the signal needs to be shared across methods); it does not apply inside behavior bodies.

```ts
// At behavior return — multiple effects' cleanups
const cleanupRead = effect(() => { ... });
const cleanupWrite = effect(() => { ... });
return () => {
  cleanupRead();
  cleanupWrite();
};

// Inside an effect — multiple listeners' cleanups
return effect(() => {
  const mediaElement = context.mediaElement.get();
  if (!mediaElement) return;

  const removeTimeupdate = listen(mediaElement, 'timeupdate', sync);
  const removeSeeking = listen(mediaElement, 'seeking', sync);
  return () => {
    removeTimeupdate();
    removeSeeking();
  };
});
```

Why: each `listen` / `subscribe` call already returns its own removal function — that's the natural cleanup contract. Collecting them into a named wrapper makes the cleanup set explicit ("these specific things, in order") and composes directly with `effect()`'s cleanup-return shape. `AbortController` introduces a control-plane primitive (controller + signal) that isn't necessary inline and routes cleanup through a side channel less direct than calling the returned removers. See `sync-preload.ts` (multi-effect behavior cleanup) and `track-current-time.ts` (multi-listener inside one effect) for the canonical shape.

## Per-type specialization

> This section codifies the *destination shape* for per-type behaviors. The [`change-spf-behavior`](../../../../.agents/skills/change-spf-behavior/references/split.md) skill operationalizes the *refactor moment* — converting a single behavior into per-type variants — with an explicit axis declaration + cross-boundary constraint audit so implicit ordering invariants in the merged code aren't silently dropped.

When a behavior's logic varies by media type (video / audio / text), prefer **separate exports per type** over a single behavior with a `config.type` discriminant.

```ts
// good — narrow per-type keys, no runtime discriminant, dead code drops out
export const selectVideoTrack = defineBehavior({ ... });
export const selectAudioTrack = defineBehavior({ ... });
// (text selection is the switchTextTrack variant in track-switching.ts)
```

Engines opt into specific tracks (e.g. an audio-only engine uses `selectAudioTrack` only). This wins on **A — Reusability** (engines aren't forced to carry video logic), **C — Patternability** (call sites read the same shape regardless of type), and **E — Size** (unused specializations tree-shake out).

The runtime cost is shared body code. Three modules currently share via a typed helper (`resolve-track`'s `setupTrackResolution`, `select-tracks`'s now-fully-inlined bodies, `load-segments`'s `setupSegmentLoading`); the trade-off is documented in `.claude/plans/spf/discrete-signals-and-behavior-objects.md` under "Code-reuse compromise" and is a pending follow-up — see [Helpers and behavior factories](#helpers-and-behavior-factories) below.

### Inverse: behaviors that operate uniformly across tracks

Per-type specialization addresses behaviors whose *logic varies* by type. The dual case is behaviors whose logic is *uniform across tracks* — they do one thing that crosses all attached tracks at once. `updateMediaSourceDuration` is the canonical example: it writes a single `mediaSource.duration` covering the whole presentation, regardless of which tracks are loaded. These behaviors should compose against the aggregating resource, **not** enumerate per-type slot pairs.

> **Disambiguator — body-shape isn't enough; the downstream consumer interface is.** A body that iterates a per-type pair via `KeyByType[type]` looks identical between "uniform-across-tracks → aggregate" and "per-type-split candidate." The distinguishing question is *what shape downstream consumers consume*:
>
> - **Consumers operate uniformly** (e.g., `endOfStream` calls `endOfStream` on every actor; a hypothetical `updateMediaSourceDuration` iterates `mediaSource.sourceBuffers`) → this section's prescription: compose against the aggregating resource.
> - **Consumers operate per-type** (e.g., `loadVideoSegments` reads `videoBufferActor`, `loadAudioSegments` reads `audioBufferActor`) → the per-type interface is the destination shape; the writer should split per type with a shared setup-shape helper. See [Per-type specialization](#per-type-specialization) and `/change-spf-behavior` for the audit workflow (atomicity / ordering / shared-lifecycle constraints are exactly what the cross-boundary audit evaluates).
>
> A behavior whose body iterates a per-type pair *and whose downstream consumers split per-type* is a `/change-spf-behavior` candidate, not a `/change-spf-behavior` in-place fix. `setup-sourcebuffer.ts` is the worked example: explicit `MediaTrackType` axis, per-type write loop, per-type consumers (`loadVideoSegments` / `loadAudioSegments`) — per-type split with a shared `setupSourceBuffer` helper is the destination shape, with the Firefox `mozHasAudio` atomicity invariant as the cross-boundary audit's headline item.

**Sniff** (for the aggregate-composition path, given the disambiguator above): `contextKeys` (or `stateKeys`) enumerates a per-type slot pair (`videoBuffer` + `audioBuffer`, `videoSegmentLoaderActor` + `audioSegmentLoaderActor`, etc.) and the behavior's body treats them interchangeably — filtering both into a single collection, iterating both with identical logic, or referencing them only to forward into helpers that operate uniformly — **and** the downstream consumers also operate uniformly.

**Why this is a problem**: per-type slots in a generic behavior lock the engine to a fixed track configuration. An audio-only engine (no `videoBuffer` slot) or video-only engine (no `audioBuffer` slot) can't compose the behavior without either typing trickery or wiring no-op slots — both costs the behavior's call site shouldn't bear. The behavior's slot map advertises a per-type structure it doesn't actually need.

**Fix**: compose against the resource that aggregates the per-type units. For MSE-spec work that crosses all attached buffers, that's `mediaSource.sourceBuffers` (the spec-canonical aggregate). For text-track DOM work, that's `mediaElement.textTracks`. The per-type slots stay reserved for behaviors that genuinely vary per type (per-type segment loading, per-type resolution).

```ts
// bad — locked to two-track configuration
export const updateMediaSourceDuration = defineBehavior({
  contextKeys: ['mediaSource', 'videoBuffer', 'audioBuffer'],
  // body iterates [videoBuffer, audioBuffer] uniformly
});

// good — reads `mediaSource.sourceBuffers` directly
export const updateMediaSourceDuration = defineBehavior({
  contextKeys: ['mediaSource'],
  // body passes `mediaSource.sourceBuffers` into helpers
});
```

**The aggregate doesn't need to be a signal-map slot when the owning resource is.** `mediaSource.sourceBuffers` is a mutable DOM collection; the behavior reads it at use-time, not via `computed(...)`. That's fine — buffer additions/removals don't drive state transitions in a duration-write behavior; only `updating` flags and `buffered` ranges, which are sampled at use-time anyway.

**Worked example**: `updateMediaSourceDuration` originally took `videoBuffer` + `audioBuffer` slots; it now reads `mediaSource.sourceBuffers` directly, so audio-only and video-only engines compose it without modification. The cleanup removed two slots from `contextKeys` *and* dropped a slot-pair smell from the engine context type for any future variant.

**Don't confuse with legitimate per-type pairs**: a behavior that *does* specialize per type (per-type body, per-type config, per-type slot writes) is in the [Per-type specialization](#per-type-specialization) shape above, not this one. The diagnostic is "does the body treat the pair interchangeably?" — if yes, this is the smell; if no, the pair is load-bearing.

## Helpers and behavior factories

Decomposition tools used *within* the Behavior shape, not alternatives to it. **This section is expected to iterate** as the cleanup pass surfaces real cases. Three forms are recognized.

### Inline helper

A function operating on already-resolved values, called from inside a Behavior body. Has no setup/cleanup of its own; the Behavior owns its lifecycle. Lives near its caller (same file, or a sibling module if shared across a small group).

When to extract an inline helper:

- A piece of pure logic in a Behavior body is reused by another Behavior in the same module (or sibling).
- A computation that's pure given its inputs and is verbose enough to obscure the surrounding `effect` / `computed` body.
- The same predicate or projection appears in two `computed` definitions.

When **not** to extract an inline helper:

- The code is used only once and reads naturally inline.
- The helper needs to read or write composition signals. That's a setup-shape helper (see below), not an inline helper.

### Setup-shape helper

A function whose signature matches `Behavior.setup` — `({ state, context, config }) => cleanup` — called from inside a behavior's setup. Operates on signals (state/context), owns its own setup/cleanup contract, and bakes per-type or per-export parameterization into `config` at the call site (each per-type export adapts the call inline).

`setupTrackResolution` (in `resolve-track.ts`, commit `54707e59`) is the canonical example: three per-type behaviors (`resolveVideoTrack`, `resolveAudioTrack`, `resolveTextTrack`) each call it from their `defineBehavior` setup, supplying their per-type config (`selectedKey`, `findTrackToResolve`) inline.

When to use a setup-shape helper:

- The orchestration shape repeats across 2+ Behaviors with per-type parameterization (selected key, finder fn, type discriminant).
- The reuse is at the composition layer (touches signals), but each per-type export should keep its own `defineBehavior` declaration — for visibility of `stateKeys` at the call site, for the exhaustiveness check to run per export, or because each export has its own JSDoc / test boundary.
- You want a uniform "helpers shaped like setup" convention reproducible across many shared helpers without each becoming a wrapper around `defineBehavior`.

When **not** to use a setup-shape helper:

- The reuse is pure logic over already-resolved values — that's an inline helper.
- The lightest call sites are the priority and you're willing to hide `defineBehavior` inside a wrapper — that's a behavior factory.

Trade-off: per-export call sites carry the `defineBehavior` boilerplate plus an inline `config` object (~3 extra lines per export vs. a factory). Acceptable when the shape uniformity is reproducible across many helpers and you want each export's slot intent legible at the export site.

#### Parameterization shape: parameterize by typed key

**Rule: parameterize by typed key.** The helper takes a `selectedKey` / `actorKey` / similar in `config`; variants pass `state` and `context` through directly and supply the key. Generic parameters on the helper carry the key type, so reads (`state[selectedKey]`, `context[actorKey]`) are typed exactly to the supplied slot.

```ts
// Helper is generic over the key type.
function setupSegmentLoading<K extends SelectedTrackKey, A extends BufferActorKey>({
  state, context, config,
}: {
  state: SegmentLoadingStateMap<K>;
  context: SegmentLoadingContextMap<A>;
  config: { type; selectedKey: K; actorKey: A; fetch };
}) { /* reads state[selectedKey], context[actorKey] */ }

// Variant passes state/context through; config carries the typed keys.
setupSegmentLoading({
  state, context,
  config: { type: 'video', selectedKey: 'selectedVideoTrackId', actorKey: 'videoBufferActor', fetch },
});
```

Sibling precedents: `setupTrackResolution` in `resolve-track.ts`, `setupSegmentLoading` in `load-segments.ts`, `setupSourceBuffer` in `setup-sourcebuffer.ts`. Variants pass `state` / `context` through with no aliasing, keeping the call site spread-style.

**Antipattern: alias slot names in the helper signature.** Don't rename the per-type slots to abstract names (`buffer`, `actor`) and have each variant remap its per-type slots onto those names at the call site:

```ts
// Antipattern — don't do this.
function setupSourceBuffer({ state, context, config }: {
  state: { /* ... */ };
  context: { mediaSource; buffer; actor };  // ← abstract names
  config: { type: MediaTrackType };
}) { /* reads context.buffer, context.actor */ }

// Variant reconstructs the context to fit the helper's aliasing.
setupSourceBuffer({
  state,
  context: { mediaSource: context.mediaSource, buffer: context.videoBuffer, actor: context.videoBufferActor },
  config: { type: 'video' },
});
```

Two failure modes combined:

1. **Aliasing to a generic name loses per-type intent at the call site.** A reader scanning `setupVideoSourceBuffer.setup` sees `buffer: context.videoBuffer` and has to follow into the helper to learn what `buffer` means in this slot. The slot's concrete identity (`videoBuffer`) was meaningful — flattening it to `buffer` erases that.
2. **The caller reconstructs the context object to fit the helper.** This inverts the natural helper-declares-shape / caller-binds-values relationship: the caller has to know the helper's internal slot mapping (`videoBuffer` → `buffer`, `videoBufferActor` → `actor`) and assemble a bespoke object that matches it. Shape B parameterizes the binding via `config` instead — the helper still declares its shape (generic over the typed keys), but the variant supplies the bindings as keys rather than as an aliasing remap.

**Cross-helper consistency:** when adding a new sibling helper in an area that already has setup-shape helpers, match the existing shape. If you encounter a Shape A helper in older code, the conversion to Shape B is mechanical — bring it across when you next touch the area.

#### Per-helper-per-type config constants + engine spread

**Rule: hoist per-type defaults into named constants; variants spread engine config over them.** Each per-type variant in a per-type-shared-helper module references a per-helper-per-type config constant — a spread of the shared `*_TYPE_CONFIG` from `track-types.ts` plus the helper-specific per-type closures (resolver, picker, dispatch function). The variant's `setup` accepts an optional `config?` parameter and spreads it over the constant; engines override fields by passing them through `config`.

```ts
// Per-helper-per-type defaults, defined once next to the helper.
const VIDEO_SEGMENT_LOADING_CONFIG = {
  ...VIDEO_TYPE_CONFIG,                    // selectedKey, actorKey, loaderKey, type
  findResolvedTrack: findResolvedVideoTrack,
} as const;

// Variant: spread defaults, then spread engine config (engines override).
export const loadVideoSegments = defineBehavior({
  stateKeys: [...],
  contextKeys: [...],
  setup: ({ state, context, config = {} }: { /* ... */; config?: object }) =>
    setupSegmentLoading({
      state, context,
      config: { ...VIDEO_SEGMENT_LOADING_CONFIG, ...config },
    }),
});
```

Why:

- **Single source of truth per type per helper.** Per-type identity (slot keys, per-type closures) lives in one place — variants reference it, tests can reuse it, engines can introspect it. No drift between variant body / tests / wiring.
- **Engine-configurable from day one.** Engines layer composition-supplied overrides (a custom segment resolver, an alternative picker, a non-default fetch) on top of the defaults without forking the variant. The spread pattern means today's "no overrides" doesn't cost anything; the override surface is already there when needed.
- **Future facets flow through.** Adding a new field to the shared `*_TYPE_CONFIG` propagates automatically into every helper's per-type constant. Helpers that don't consume the extra field ignore it under structural typing.

Canonical examples: `load-segments.ts` (`VIDEO_SEGMENT_LOADING_CONFIG` / `AUDIO_SEGMENT_LOADING_CONFIG` / `TEXT_SEGMENT_LOADING_CONFIG`), `setup-buffer-actors.ts` (variants spread `VIDEO_TYPE_CONFIG` / `AUDIO_TYPE_CONFIG` directly + their own per-helper additions), `resolve-track.ts` (`VIDEO_TRACK_RESOLUTION_CONFIG` etc.), `select-tracks.ts` (`VIDEO_TRACK_SELECTION_CONFIG` etc.).

See [`config.md`](config.md) for the broader patterns this slots into: engine config as single source of truth, nested sub-configs at the engine surface, threading through to helpers / actors / lower-layer functions, multi-layer source-of-truth principle.

The `config?: object` type on the variant's setup is intentionally loose — engines pass whatever fits, and helper-side constraints catch invalid combinations. Tighter typing (e.g. `Partial<typeof VIDEO_SEGMENT_LOADING_CONFIG>`) is fine when the engine config schema is fully nailed down; the loose type is the right default while overrides are accumulating.

#### Inferred-Track generic for typed-message-send helpers

A refinement that applies *only* when the helper dispatches typed messages to a per-variant typed actor (different actor types per variant; different track types per actor's message). For helpers that don't have this dispatch pattern, plain typed-key generics (`<K extends SelectedTrackKey>`) are sufficient.

**Rule: when the helper's `loader.send(...)` would require widening or casting at the boundary, add an inferred `Track` generic constrained by `SegmentLoaderLike<Track>`-style structural typing on the loader signal.** TS infers `Track` from the variant's `findResolvedTrack` (or equivalent) return type; the structural constraint on the loader signal validates that the variant's loader actor accepts the inferred track type via function-parameter contravariance. No widening of actor message types is needed; no casts inside the helper.

```ts
interface LoadMessage<Track> {
  type: 'load';
  track: Track;
  range?: { start: number; end: number };
}

interface SegmentLoaderLike<Track> {
  send: (msg: LoadMessage<Track>) => void;
}

function setupSegmentLoading<
  K extends SelectedTrackKey,
  L extends SegmentLoaderActorKey,
  Track extends { segments: readonly Segment[] },
>({ state, context, config }: {
  state: SegmentLoadingStateMap<K>;
  context: { [P in L]: ReadonlySignal<SegmentLoaderLike<Track> | undefined> };
  config: { selectedKey: K; loaderKey: L; findResolvedTrack: (...) => Track | undefined };
}): Reactor<...> {
  // ...
  context[loaderKey].get()!.send({ type: 'load', track: selectedTrack.get()!, range });
}
```

How inference resolves at each variant call:

- `findResolvedTrack: findResolvedVideoTrack` (returns `VideoTrack | undefined`) → TS infers `Track = VideoTrack`
- `context.videoSegmentLoaderActor`'s `.send` accepts `{track: VideoTrack | AudioTrack, ...}` — assignable to the slot expecting `(msg: {track: VideoTrack, ...}) => void` via function-parameter contravariance (a function accepting wider input is assignable to a slot expecting narrower input). ✓
- For text: `findResolvedTextTrack` → `Track = TextTrack`; loader's `.send` accepts exactly `{track: TextTrack, ...}`. ✓

Apply this refinement only when there's an actual contravariance gap to dissolve. Worked example: `setupSegmentLoading` in `load-segments.ts` dispatches across `SegmentLoaderActor` (for v/a) and `TextTrackSegmentLoaderActor` (for text) without casts or widened actor message types — the per-variant Track inference + structural-typing constraint does the binding work.

For helpers that don't dispatch typed messages — `setupTrackResolution`, `setupTrackSelection`, `setupBufferActors` — the extra `Track` generic is dead weight. Stick with plain typed-key generics there.

### Behavior factory

A function that *returns* a Behavior, parameterized by the type/keys/config the caller cares about. The product is a Behavior; the factory captures the parameterization. `defineExternalSignals<ExternalState, ExternalContext>()` is the canonical example.

When to use a behavior factory:

- The same Behavior shape applies to multiple keys, and you want the lightest call sites — each export is a single-line factory invocation, no `defineBehavior` boilerplate per export.
- A Behavior is parameterized by something that varies *across compositions but is fixed within one* — pass it via factory args rather than via runtime `config`, so each composition gets a Behavior with the parameterization baked in (and dead branches drop out).
- The `stateKeys`/`contextKeys` themselves are parameterized in a way the factory can express but a setup-shape helper can't (e.g. `defineExternalSignals` declares exactly the keys of `ExternalState` / `ExternalContext`, checked where it is called).

When **not** to use a behavior factory:

- The shape is reproducible without wrapping `defineBehavior` — a setup-shape helper is lighter.
- `config` already does the job. A factory parameter that ends up rebroadcast as `config` adds a layer for no gain.
- When parameters vary at runtime within a single composition. That's `config`'s domain, not the factory's.

### Inline helper, setup-shape helper, factory, or another behavior?

The decision pivots on *what's shared*, *what's parameterized*, and *whether you want each export to keep its own `defineBehavior` declaration*.

| Shared shape | Parameterized over | Reach for |
| ------------ | ------------------ | --------- |
| Inline computation, used by one Behavior body | (nothing — inline) | Inline code |
| Pure logic over already-resolved values, shared by 2+ Behaviors | Their inputs | **Inline helper** |
| Setup orchestration over signals, shared by 2+ Behaviors with per-type config; keep `defineBehavior` per export | Per-type config (passed via `config`) | **Setup-shape helper** |
| Same as above, but lightest call sites preferred over per-export `defineBehavior` visibility | Slot-map types (`S`, `C`, …) or per-type opts | **Behavior factory** |
| Behavior shape shared, but slot intent or set of touched keys varies per type | Per-type structure | **Per-type specialization** (separate exports), often combined with a setup-shape helper or factory |
| Same problem solved twice in two unrelated places | (none — coincidence) | Leave as two |

The "abstracted helpers should look like Behaviors" goal is satisfiable through either the setup-shape helper or the behavior factory pattern. Pick by which trade-off you want: setup-shape preserves per-export `defineBehavior` (and its exhaustiveness check) at the cost of slightly verbose call sites; factory hides `defineBehavior` for lighter call sites at the cost of an extra wrapping layer. All current per-type-shared helpers in the playback layer (`setupTrackResolution`, `setupTrackSelection`, `setupQualitySwitching`, `setupSegmentLoading`, `setupBufferActors`) use the setup-shape helper form.

## File placement

Per [`packages/spf/src/CLAUDE.md`](../../../../packages/spf/src/CLAUDE.md):

- DOM-free Behaviors live in `playback/behaviors/` (e.g. `select-tracks.ts`, `quality-switching.ts`).
- DOM-bound Behaviors live in `playback/behaviors/dom/` (e.g. `setup-mediasource.ts`, `load-segments.ts`).

The split is enforced by tsconfig `lib` settings — a non-DOM behavior that imports `HTMLMediaElement` will fail typecheck, not just lint. If a Behavior currently lives outside `dom/` but reaches into DOM types, that's a placement bug, not a style nit.

Actor factories the Behaviors instantiate live alongside in `playback/actors/` (or `playback/actors/dom/`). Cross-imports between sibling Behaviors and Actors are expected; reaching across `media/`, `network/`, or `core/` follows the dependency rules in CLAUDE.md.

### Pure helpers don't belong in behaviors

If a top-level function in a behavior module has no `core/` dependency (no signals, effects, or reactors), it probably doesn't belong in `playback/behaviors/`. Move it to `media/` (or `network/`, or `@videojs/utils` if generically useful).

This is the inverse of the smell already documented in [`packages/spf/src/CLAUDE.md`](../../../../packages/spf/src/CLAUDE.md) (a primitive that reaches into `core/`). Same layering principle, opposite direction.

Rule of thumb when reviewing a behavior file: scan the top-level helpers. If any are pure data-manipulation / lookup / format-handling code with no reactive concerns, they should move out.

Concrete instance: `findTrack` and `updateTrackInPresentation` lived in `resolve-track.ts` until commit `a9ef69ba`; both operate purely on HAM-shaped types from `media/types` and were extracted to `media/utils/tracks.ts`.

### File-level JSDoc

Every behavior file should open with a top-level JSDoc / module comment articulating the behavior's *purpose* — what the module is for, not what it does. Example:

```ts
/**
 * **Default track selection on src load.** When a presentation is resolved,
 * sets `selectedTrackId` to a per-type-picker default if no selection
 * already exists. Unselects on src unload.
 */
```

Per-export JSDoc (already conventional) describes individual exports; the file-level comment names the *module's* purpose so reviewers and refactors can evaluate against it. The first step of [Refactoring an existing behavior](#refactoring-an-existing-behavior) starts here — if the file-level purpose is missing or misaligned with the body, that's a finding before any code change.

## Naming

- Behaviors are named as **descriptive verbs**: `syncPreload`, `selectVideoTrack`, `loadVideoSegments`, `endOfStream`. No `*Behavior` suffix.
- Files match the exported name in kebab-case: `sync-preload.ts` exports `syncPreload`.
- Per-type specializations co-locate in one module: `select-tracks.ts` exports `selectVideoTrack` / `selectAudioTrack`; `track-switching.ts` exports `switchVideoTrack` / `switchAudioTrack` / `switchTextTrack`.
- Behavior factories that produce a behavior from a declarative spec are named `define*`, as `defineBehavior` and `defineExternalSignals` are. The factory's product is a Behavior; the prefix distinguishes the factory from a Behavior export.
- Setup-shape helpers are named `setup*`: `setupTrackResolution`. The shape is a `Behavior.setup`-style function called from inside a per-type behavior's setup.
- **Name by the unit-of-work this behavior triggers, not by its downstream observable.** When per-type-specialized behaviors exist (video / audio / text), the names must match the work they share — sibling consistency is load-bearing. `loadVideoSegments` triggers segment fetches; segments produce frames downstream, but we don't call it `loadVideoFrames`. Same for audio (`loadAudioSegments`, not `loadAudioSamples`) and text (`loadTextTrackSegments`, not `loadTextTrackCues`). A name that breaks the sibling pattern is a sniff that the author was thinking about a different layer than the convention assumes.
- **Domain-prefix slot / context keys when a same-shape sibling can exist** in the engine's composition. `segmentLoaderActor` reads as generic when there's only one in scope, but the moment a sibling appears — text-track segment loader, audio segment loader — the unqualified name becomes ambiguous. Prefer `videoSegmentLoaderActor` / `textTrackSegmentLoaderActor` even if only one exists today; the rename later is non-trivial because the slot leaks through behavior signatures and engine state types.
- **Domain-prefix behavior names** when the bare verb could plausibly act on more than one similarly-shaped target. `updateDuration` reads as generic because "duration" exists at three layers — `presentation.duration`, `mediaSource.duration`, the `<video>` element's `duration` — and the unqualified name doesn't say which one the behavior writes. Prefer `updateMediaSourceDuration` (or whichever target is right) so the verb-noun pair is unambiguous at the call site, in the engine composition list, and in greps. Same diagnostic as the slot-key rule above: if removing the qualifier would make a future reader ask "which X?", the qualifier was load-bearing. Worked example: `updateDuration` → `updateMediaSourceDuration`.

## Testing

Tests live in `tests/` next to the source (`packages/spf/src/playback/behaviors/tests/sync-preload.test.ts`). The vitest project assignment is automatic by path:

- `playback/behaviors/**/*.test.ts` (non-DOM) → `behaviors` project (Node).
- `playback/behaviors/dom/**/*.test.ts` (DOM) → `dom` project (Chromium).

Use `describe('<exact exported name>', ...)`. For per-type specializations, prefer one `describe` per export rather than a single shared `describe` block — call sites read the same shape regardless of type, and tests should too.

When a Behavior is augmented with an Actor, the Actor's own tests live in `playback/actors/tests/`. The Behavior's tests should cover the wiring (slot reads/writes, cleanup ordering, lifecycle); they shouldn't re-test the Actor's internals.

## Anti-patterns

- **Building behavior objects without `defineBehavior`** outside the generic-factory exception (`defineExternalSignals`). Drops the exhaustiveness check and lets `stateKeys` / body drift.
- **Typing setup deps against the full state/context shape** instead of `Pick`'d slices. Hides the read/write contract; makes wide-to-narrow casts necessary inside the body.
- **Runtime `config.type` discriminants** for per-media-type behaviors. Costs all three of A/C/E for a small body-reuse gain.
- **Behaviors that mutate slots they didn't declare** in `stateKeys` / `contextKeys`. The type system stops most of this, but mutating a slot via a wider ref in scope (such as the composition's own `state` map) can still slip past — convention: write to your own declared slots only, even when a wider ref is in scope.
- **Reaching for a Reactor or Actor when a simple behavior would do.** The dual of the augment-sniffs above. If the body is short, signal-only, and effect-shaped, leave it.
- **Force-fitting a "no good fit" sniff into the closest existing primitive** to make the body look conventional. Hold the sniff visibly with a comment and surface the gap; a clean-looking force-fit hides the real signal.
- **Declaring "no good fit yet" without naming what you considered.** The factory inventory has grown; what looked like a gap a year ago may have a real primitive now. Name the candidates you ruled out and why before flagging a missing primitive.
- **Reaching for the raw Actor primitive when one of the factories (`createTransitionActor`, `createMachineActor`) fits.** The factories are the convention layer; the raw Actor is below it.
- **Behaviors that own an Actor without disposing it in cleanup.** Always a leak; usually a sign the Actor's lifecycle should be expressed through context (so cleanup ordering is explicit) rather than captured locally.
- **Splitting by domain rather than by shape.** A "video" Behavior that's really three Behaviors (selection, loading, sync) glued together is harder to reuse in audio-only contexts than three small Behaviors with overlapping slot maps.
- **Defense-in-depth checks without an articulated failure mode.** Every guard added "just in case" should name the specific thing it protects against. When the architecture changes, revisit the guard — it may have become unreachable. Carrying unreachable guards is technical debt that obscures the real safety properties of the surrounding code. (Concrete instance from this branch: a commit-time presentation id check in `setupTrackResolution` that became redundant once the reactor's state-exit abort + spec-compliant fetch signal propagation handled the same race; removed in commit `5456d9db`.)
- **Closure-mutable state that should reset on source change.** See "Source-reset handling" — closure variables survive source resets. Express the state in a `createMachineReactor` state or a signal-derived `computed` so reset happens structurally.
- **Merging without refactoring** — combining two behaviors by relocating their bodies into one file/helper without first running purpose-first analysis on each. Symptom: the merged behavior's body looks suspiciously like its inputs glued together; each side's anti-patterns (closure-state, hand-rolled FSMs, leaky abstractions, conditional branches around optional work) survive into the merge. See [Merging two behaviors — extra discipline](#merging-two-behaviors--extra-discipline).
- **Building a merged behavior from the simpler side outward.** When merging behaviors of unequal architectural weight, extending the simpler shape outward to host the more constrained one produces conditional branches and afterthought integrations in the lifecycle helper. Build from the more constrained side; the simpler case fits as a special case within that shape.
- **Per-type slot pairs in a uniform-across-tracks behavior.** A behavior whose `contextKeys` enumerates `videoBuffer` + `audioBuffer` (or any per-type slot pair) while its body treats them interchangeably is composing at the wrong aggregation level — it locks the behavior to a fixed track configuration and forces audio-only / video-only engines to wire no-op slots. Compose against the aggregating resource (e.g., `mediaSource.sourceBuffers`). See [Inverse: behaviors that operate uniformly across tracks](#inverse-behaviors-that-operate-uniformly-across-tracks).
