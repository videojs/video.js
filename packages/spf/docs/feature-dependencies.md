# Features depend on each other

<!--
AI first draft (2026-10-23), for Christian to rewrite. Verified 2026-10-23 in Playwright Chromium with
the eight-feature engine from compose-an-engine.md behind an adapter: without mediaSourceFeature, the
playlists resolve and no segment loads, with no error reported; without initialLoadFeature, only the two
init segments load; without currentTimeFeature (on a 2.5-minute source), playback froze at 29.95s with
0-30s buffered while the full engine played past 54s. On a source shorter than the 30s window, the
symptom is instead that the stream never ends (mediaSourceFeature's own doc says the same).
NOTE for Christian: initialLoadFeature's JSDoc says "Without it, a composition loads the moment a source
is set", which reads as the opposite of what happens (only init segments load unless loadActivated is
seeded). Candidate doc fix.
-->

A feature can need another feature to do its job. Composing an engine means composing every feature each of its features needs. When one is missing, nothing throws. Playback just stops at the point where the missing piece was needed.

## Behaviors wait for state

Behaviors never call each other. A behavior reads state and context that other behaviors write, and it waits until those values exist. The video feature's segment loader waits for a `MediaSource` in `context.mediaSource`. `mediaSourceFeature` writes it. Leave that feature out, and the loader waits forever.

That waiting is deliberate. It's what lets behaviors stay unaware of each other, and it's what lets you remove a feature without editing the rest. It also means a missing dependency looks like a stall, not an error.

## Each feature says what it requires

Every feature's documentation lists what it needs from other features and what happens without each one. The video feature's list looks like this:

> Requires, from this or other features:
>
> - A writer of `context.mediaSource`, such as `mediaSourceFeature`; nothing loads without one.
> - A writer of `state.currentTime`, such as `currentTimeFeature`; without one, loading stops after the first window.
> - A writer of `state.loadActivated`, such as `initialLoadFeature`, or a seeded `loadActivated: true`; without one, only init segments load.

The same text opens each feature's [reference page](./reference/README.md#features), and the reference's state and context tables show which behavior reads each key. Read the list before you remove a feature, and check whether anything left in your engine needs it.

## What a missing feature looks like

Each requirement names its symptom, so you can work backward from what you see. For the eight-feature engine from the [previous page](./compose-an-engine.md):

| Remove | What happens |
| --- | --- |
| `mediaSourceFeature` | The playlists resolve, but no segment loads. Nothing writes `context.mediaSource`. |
| `initialLoadFeature` | Only the init segments load. Nothing writes `state.loadActivated`. |
| `currentTimeFeature` | Playback starts, then stalls after the first loading window. Nothing writes `state.currentTime`, so the loader never asks for more. |
| `hlsLoadingFeature` | Nothing resolves. No feature has a presentation to read. |

None of these report an error. The engine is waiting, correctly, for a value that nothing will write.

## A writer can be a seed

A requirement names "a writer", not a particular feature. Another feature can satisfy it, and so can a value in the engine's initial state. The background-video engine doesn't compose `initialLoadFeature`. It seeds `loadActivated: true` instead, so loading starts the moment a source is set:

```ts
// packages/spf/src/playback/engines/hls-background-video.ts
export const initialState = { ...composed.initialState, loadActivated: true };
```

## Order matters when features replace config

Most features don't care where they sit in the list. Config defaults are the exception: when two features default the same key, the later one wins. `drmFeature` replaces the playability check that `videoFeature` and `audioFeature` set, so it has to come after them. Before them, their check wins and encrypted renditions are refused.

## Next

Features connect through three kinds of shared values. Next, see what goes in [state, context, and config](./state-context-and-config.md).
