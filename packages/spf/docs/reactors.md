# Reactors

<!--
AI first draft (2026-10-23), for Christian to rewrite. Verified against
packages/spf/src/core/reactors/create-machine-reactor.ts and its tests (entry untracked, effects re-run,
cleanup on rerun / state exit / destroy, 'destroying' → 'destroyed'), the package root exports, and
internal/design/spf/conventions/reactors.md. The example is trimmed from
packages/spf/src/playback/behaviors/dom/load-segments.ts (setupSegmentLoading, used by loadVideoSegments).
-->

Some work changes shape as the engine's state changes. Segment loading is a good example: with no track there is nothing to load, with `preload="metadata"` only the init segment loads, and once playback starts segments load ahead of the playhead. A reactor gives each of those stages a name and its own work.

## A reactor is a small state machine

`createMachineReactor()`, exported from `@videojs/spf`, takes three things:

- **`initial`** is the state the reactor starts in.
- **`monitor`** is a function that reads signals and returns the state the reactor should be in. It re-runs when those signals change, and the reactor moves to the state it returns.
- **`states`** lists every state, each with the work it does. A state with no work is `{}`.

A reactor has no message channel. It watches signals and acts on what it sees. The work it does often ends in a message to an actor, which owns the resource.

## Entry work and effects

Each state can have two kinds of work:

- **`entry`** runs once when the reactor enters the state. Its body is untracked, so signal changes inside the state don't run it again.
- **`effects`** run on entry and run again whenever a signal they read changes.

Either one can return a cleanup function. An effect's cleanup runs before the effect runs again and when the reactor leaves the state. An entry's cleanup runs only when the reactor leaves the state. Destroying the reactor moves it through `'destroying'` to `'destroyed'`, and every active cleanup runs.

## A real reactor: segment loading

`loadVideoSegments` hands its work to a reactor. First a computed signal derives the stage:

```ts
// packages/spf/src/playback/behaviors/dom/load-segments.ts (trimmed)
const derivedStateSignal = computed<SegmentLoadingFsmState>(() => {
  if (!context[loaderKey].get() || !selectedTrack.get()) return 'preconditions-unmet';

  if (state.loadActivated.get() || state.preload.get() === 'auto') return 'full-range';

  if (state.preload.get() === 'none') return 'dormant';

  return 'metadata-only';
});
```

Then each stage does its own work:

```ts
// packages/spf/src/playback/behaviors/dom/load-segments.ts (trimmed)
return createMachineReactor<SegmentLoadingFsmState>({
  initial: 'preconditions-unmet',
  monitor: () => derivedStateSignal.get(),
  states: {
    'preconditions-unmet': {},
    dormant: {},
    'metadata-only': {
      entry: () => {
        const track = selectedTrack.get();
        const loader = context[loaderKey].get();
        if (!track || !loader) return;

        loader.send({ type: 'load', track });
      },
    },
    'full-range': {
      effects: () => {
        const track = selectedTrack.get();

        segmentBoundarySignal.get();
        const loader = peek(context[loaderKey]);
        if (!track || !loader) return;

        const currentTime = peek(state.currentTime) ?? 0;

        loader.send({ type: 'load', track, range: { start: currentTime, end: currentTime + bufferDuration } });
      },
    },
  },
});
```

The two dispatching stages use different kinds of work:

- **`'metadata-only'` uses `entry`.** It asks the loader actor for the selected track's init segment once, when the stage starts.
- **`'full-range'` uses `effects`.** It asks again whenever the selected track changes or the playhead crosses into a new segment. `segmentBoundarySignal` only changes at segment boundaries, so ordinary `currentTime` ticks don't re-send. `peek()` reads the loader and the current time without tracking them.

The two empty states do nothing on purpose. A dormant reactor sends nothing because its state has no work.

Both handlers check the track and loader again, even though the derived state already required them. The monitor and the handlers are separate effects, so a handler can run before a pending transition lands.

The behavior's setup returns the reactor. A reactor has `destroy()`, so it serves as the behavior's cleanup.

## Reactor or effect?

Use a plain `effect()` when the work has one shape: mirror a value, attach a listener, write a result. Use a reactor when the work has at least two stages that each do something different or clean up differently. If you find yourself writing several effects gated on flag-shaped computed signals, you are building a state machine by hand, and a reactor states it directly.

## Next

This is the last concept page. For how the pieces fit together, return to [SPF architecture](./architecture.md). For every engine, feature, and behavior, see the [API reference](./reference/README.md). The segment-loading behaviors are on the [load-segments reference page](./reference/behaviors/dom/load-segments.md).
