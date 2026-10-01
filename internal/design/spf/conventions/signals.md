---
status: draft
date: 2026-05-07
---

# Signals

> **Signals are SPF's reactive substrate — every Behavior uses them, and the Actors and Reactors a Behavior reaches for are themselves built on signals.** "When to use a signal" isn't really a question in practice; what comes up is the *contract*: per-slot read/write intent, seeding for slots no behavior writes, multi-writer cases, and bridging writes from outside the composition. This doc covers those contract questions.
>
> For the implementation — `signal()`, `computed()`, `effect()`, and the underlying primitives — see [`../signals.md`](../signals.md), [`../primitives.md`](../primitives.md), and the [TC39 Signals proposal](https://github.com/tc39/proposal-signals).

## Slot intent: `Signal<T>` vs `ReadonlySignal<T>`

Every state and context slot in a composition is annotated **per behavior** with read/write intent through the `setup` parameter type:

- **`Signal<T>`** — the behavior writes to this slot (and may also read).
- **`ReadonlySignal<T>`** — the behavior reads this slot only. Calling `.set()` on it is a type error.

This is a real contract enforced by the type system, not documentation. The same physical signal in the composition appears as `Signal<T>` in the behaviors that own writes and as `ReadonlySignal<T>` in the behaviors that consume it.

```ts
function setup({
  state,
  context,
}: {
  state: { preload: Signal<...> };               // this behavior writes preload
  context: { mediaElement: ReadonlySignal<...> }; // this behavior reads mediaElement
}) { ... }
```

### Decision criterion

For each slot a behavior touches, ask:

- Does the body call `.set()` on it? → `Signal<T>`.
- Does the body only call `.get()` (or pass to `computed` / `effect`)? → `ReadonlySignal<T>`.

When in doubt, default to `ReadonlySignal<T>`. Tightening from `Signal<T>` to `ReadonlySignal<T>` later is a no-op for callers; loosening the other way isn't.

## Multi-writer slots

The general guidance is **0-or-1 writer behaviors per slot**, but multi-writer slots are accepted as legitimate patterns when they fit one of these shapes:

| Pattern | Example | Notes |
| ------- | ------- | ----- |
| **Intent + default** | `selectedVideoTrackId` written by `switchQuality` (ABR-derived default) and by external code (user intent) | Decompose when the writers diverge enough to confuse readers; documented as a TODO in `quality-switching.ts` |
| **Pipeline** | Stage 1 writes raw, Stage 2 writes processed | Acceptable when stages are sequenced by composition order |
| **Two-way DOM sync** | Behavior writes from DOM events, handler writes from external API | Common for input-shaped DOM properties |

If a slot has more than one writer and **doesn't** fit one of these shapes, that's a smell — it likely wants decomposition into separate slots with a derived signal computing the resolved value.

**When the multi-writer is a behavior-decomposition smell** rather than a slot-decomposition smell: the writers share a decision-making domain (same inputs, same options) rather than reflecting genuinely different inputs. That's a signal of one purpose split across two behaviors, not one slot that needs splitting. See [`behaviors.md` → Decomposition check](behaviors.md#6-decomposition-check) for the diagnostic.

A custom linter rule that warns on multi-writer slots with a `// writer-audit-allow: <reason>` ignore mechanism is a planned follow-up. Until it lands, the writer audit in `.claude/plans/spf/discrete-signals-and-behavior-objects.md` documents the legitimate cases.

## Seeding 0-writer slots: `initialState` / `initialContext`

A slot with **zero writer behaviors** must be seeded via the composition's `initialState` or `initialContext` option. The type system requires this — if no behavior declares write intent, the seed is mandatory, not optional.

```ts
createComposition({
  behaviors: [...],
  initialState: { preload: 'auto' },          // required — no behavior writes preload
  initialContext: { mediaElement: undefined } // required — no behavior writes mediaElement
});
```

Use `initialState` / `initialContext` for **constants** and **shaped initial values**. Time-varying inputs from outside the composition are written through the composition's own `state` / `context` instead (see below).

## External writes: the composition's `state` and `context`

When something outside the composition needs to drive composition state (an adapter, a sandbox harness, an engine consumer), it writes through the `state` and `context` signal maps that `createComposition` returns. Every behavior receives these same signal objects, so an external write reaches every behavior that reads the key.

A key the consumer writes but no behavior declares still has to exist in the composition. `user*TrackSelection` is the example: the selection rules only read it, and read it optionally. Declare such keys as external signals with `defineExternalSignals`, composed like any other behavior:

```ts
const externalSignals = defineExternalSignals<{ userChoice?: string }>()({ state: ['userChoice'] });
const composition = createComposition([...otherBehaviors, externalSignals], { config });

// elsewhere — drive composition state from outside
composition.context.mediaElement.set(element);
composition.state.userChoice.set('en');
```

### When to write from outside

- An adapter pushes external values into the composition (e.g. `SpfMedia` writing `mediaElement`, `preload`, `presentation`, `playbackInitiated`).
- A test or harness needs to inject values to drive a behavior's reactivity.

### When not to write from outside

- When the value is **constant** at composition time. Use `initialState` / `initialContext` — same effect, less ceremony.
- When the value is **derived from other signals**. Use a behavior with `computed` or an `effect` writing into a state slot — keeps the dataflow inside the composition.
- When you find yourself wanting to read composition state from outside and act on it. Prefer adding a Behavior that exposes the concern in-composition; reaching across the boundary to read inverts the dependency.

## Where signals show up in Actors, Reactors, and Tasks

Reaching for a primitive doesn't escape signals — it embeds them in a particular shape. Knowing where signals already live in each primitive prevents duplicate-state hazards.

- **`createTransitionActor` / `createMachineActor`** — the actor's snapshot is itself a Signal. A Behavior that observes an actor reads the snapshot directly; it doesn't (and shouldn't) maintain a parallel state slot mirroring the same value.
- **`createMachineReactor`** — the reactor's `monitor` function reads signals to derive its current state; per-state `effects` re-run when their signal dependencies change. Reactors are signal-consumers by construction.
- **Task + Runner** — Task context is **not** a Signal. If reactive observation of a Task's status is needed, the Behavior owns a Signal that mirrors the status, set from the Task's lifecycle hooks.

Corollary: when a primitive already exposes its state as a signal (Actor snapshot, Reactor state), don't introduce a parallel state slot for the same value. Two representations drift; one of them will eventually be wrong.

## Helper functions for working with signals

A handful of utilities in `core/signals/primitives` cover recurring patterns. Reach for them at sites where the unsugared form would otherwise repeat.

### `peek(signal, transform?)`

Read a signal's current value without tracking it as a dependency. Sugar for `untrack(() => signal.get())` to reduce boilerplate at single-read sites.

```ts
const value = peek(someSignal);
const id = peek(presentationSignal, (p) => p?.id);
```

The optional second argument is a transform applied in the same call; the default is a type-inferred identity so the single-arg form returns `T` unchanged.

**When to use:**

- **Inside a reactor's per-state effect** when the reactor's `monitor` already tracks the signal at the state-machine level. Tracking it again creates redundant re-runs on internal updates that don't change the state. See [`reactors.md`](reactors.md) → "Reading non-tracked signals inside effects."
- **One-off reads from non-reactive contexts** (task bodies, callbacks). Mostly equivalent to `signal.get()` since there's nothing to untrack from, but reads more clearly as "I'm intentionally not subscribing."
- **In one direction of a bidirectional-sync behavior** when the effect reads-and-writes the same slot but should only re-run on upstream changes (not on its own writes or its partner effect's writes). The partner effect subscribes normally; the peek-side effect uses `peek` to break the self-trigger loop. See [`behaviors.md`](behaviors.md) → "Multi-effect behaviors" and `syncPreload` for the worked example.

### `equalsById(a, b)`

Equality comparator for objects with an optional `id` field. Designed for use as a `computed` `equals` option when the consumer should react to identity changes (Ham-shaped objects, JSON-API-shaped resources) but ignore internal updates that preserve the id.

```ts
const presentationByIdSignal = computed(() => state.presentation.get(), {
  equals: equalsById,
});
```

Handles undefined inputs symmetrically: both undefined → equal; one undefined → different.

**When to use:** filtering out internal-update churn when a downstream consumer cares about presentation identity but not internal updates that preserve the id. Less common when the consumer is reactor-shaped (the state machine already filters at the state level), but useful for read-only consumers that can't or shouldn't restructure as a reactor.

### `update(signal, updaterFn | partial)`

Atomic read-then-write. Two overloads:

- **Updater function**: `update(signal, (current) => next)` — works for any signal type, including `Signal<T | undefined>`.
- **Partial object**: `update(signal, partial)` — merges partial into the current state. Requires `T extends object`.

```ts
update(state, { playbackRate: 2 });
update(state.presentation, (current) =>
  isResolvedPresentation(current) ? updateTrackInPresentation(current, mediaTrack) : current
);
```

Prefer the function form when the updater needs to handle different shapes (e.g., undefined vs. resolved). The partial form is sugar for the merge case where the caller is supplying just the changed fields.

## Anti-patterns

- **Typing a write-only slot as `ReadonlySignal<T>`** because the type happened to import that way. Subsequent `.set()` calls will be type errors at the body, not at the import.
- **Reaching for `Signal.State` directly instead of the composition's signal map** in a behavior body. Composition slots are constructed by `createComposition` for a reason — the engine destroy loop relies on the map being canonical.
- **Writing through the composition's `state` to bridge two parts of the same composition.** If both ends are inside the composition, write a Behavior. External writes are for crossing the composition boundary.
- **Writing from outside to state a behavior also declares write intent on.** This bypasses the per-behavior write annotation. Convention: an external writer should be treated as "the canonical owner of this slot for write purposes," and no behavior in the composition should also declare write intent on it. (The current adapter-driven slots — `mediaElement`, `preload`, `presentation`, `playbackInitiated` — follow this rule.)
- **Defining a state slot for a value that never changes after setup.** A Signal that's set once and never updated is just a constant with extra plumbing — close over it or seed it via `initialState` / `initialContext`.
- **Maintaining a parallel state slot for an Actor's snapshot.** The snapshot is already a Signal; observe it directly. A duplicate slot drifts.
- **Framing a design choice as "signal vs Actor" or "signal vs Reactor."** Signals are the substrate either way — the real choice (covered in [`behaviors.md`](behaviors.md)) is what additional primitive lives *under* the signals.

## Follow-ups

This doc is intentionally scoped to the contract questions (read/write intent, seeding, multi-writer, external writes, primitive embedding). Several adjacent topics are live but not yet documented; capturing them here so they're tracked in-place rather than only in conversation:

- **Signal-shape decomposition patterns.** When to take a flag-shaped slot (`abrDisabled`) and decompose it into intent-shaped slots (`userSelectedVideoTrackId` written by external code, plus an ABR-derived counterpart) with the resolution happening in a `computed` or pushed to config. The multi-writer section names "intent + default" as a legitimate pattern; the *how-to* (naming conventions for intent slots, where the resolution lives, when config beats a derived signal) wants its own section once the planned `abrDisabled` refactor lands and there's a real shape to document.
- **`computed` best practices** beyond `equalsById`. When to lift a derivation into a `computed` vs inline `.get()` calls, predicate-shaped computeds vs inline guards in `effect` bodies, computed-of-computed, what `computed` does and doesn't memoize. (One concrete piece already documented: in reactor-shaped behaviors, source-identity filtering via custom `equals` is often unnecessary — the state machine handles relevant transitions at a different layer; see [`reactors.md`](reactors.md).)
- **`effect` best practices.** Cleanup return-value conventions, `AbortController` integration, the perils of nested effects (briefly covered in `behaviors.md` sniffs but signal-specific guidance belongs here), batching, when an `effect` should become a `createMachineReactor` (see [`reactors.md`](reactors.md)).
- **Extending the SPF signals library.** The `peek` / `equalsById` / `update`-overload landings (commits `abe38a48` / `51b0d9db` / `d8e97753`) are concrete examples of the pattern: when a recurring shape across behaviors warrants a named helper in `core/signals/`, surface it as a candidate, build it generically (no domain-specific assumptions), and consume it in the original site as a follow-up commit. Decision criteria mirror the missing-primitive bucket in [`behaviors.md`](behaviors.md) → name the existing helpers you considered before declaring a gap, and prefer overloads / structural typing over breaking-change signature redesigns.

Each of these is a candidate for a sub-section under this doc; some may grow large enough to deserve their own doc (`computed.md`, `effects.md`). Defer that decision until the content forces it.
