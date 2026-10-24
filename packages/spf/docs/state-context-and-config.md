# State, context, and config

<!--
AI first draft (2026-10-23), for Christian to rewrite. Sources: fundamentals.md "State, context, and
configuration"; internal/design/spf/conventions/config.md (its rule, "Who would override this, and
why?"; its code example uses keys that no longer exist, so it isn't quoted); define-behavior.ts
(BehaviorDeps: config is "passed once at composition creation"); define-external-signals.ts; the
external signals in features/{video,audio,text-tracks,airplay}.ts. Candidate fact-check: the example
pairs below.
-->

Behaviors share three kinds of values: state, context, and config. Each holds a different kind of thing, and choosing the right one is most of the work when you add an input to an engine.

## State

State holds facts about playback and what the user asked for. The presentation, the selected tracks, the current time, and the user's track choice are all state.

State values are plain data. Each key is a signal, so behaviors can read it, write it, and react when it changes. The adapter writes some of it, such as `state.presentation` when you set `src`. Behaviors write the rest.

## Context

Context holds the objects the engine works with. The media element, the `MediaSource`, and the actors that own each `SourceBuffer` are all context.

Context values are live objects, not data. They are signals too, so a behavior can wait for an object to exist and react when it's replaced. The adapter writes `context.mediaElement`. Behaviors create and publish the rest, and clear them when they're torn down.

## Config

Config holds settings and swappable functions. The initial bandwidth estimate, the forward buffer length, and the playlist parser are all config.

Config is a plain object, passed once when the engine is created. It doesn't change for the engine's lifetime, and it isn't reactive. To change a setting, create a new engine.

## Which one to use

Ask what the value is and who changes it:

| The value is… | Use |
| --- | --- |
| A fact about playback, or a choice the user makes while playing | State |
| An object the engine creates or is handed, such as an element or an actor | Context |
| A setting or strategy that an engine, not the user, would choose | Config |

For config, the question to ask is the one our conventions ask: **who would override this, and why?** If an engine built for a different use case would want a different value, it's config. If changing it would only break correctness, it's an internal constant and belongs in the code, not in config.

A common mistake is reaching for state when config would do. A setting that never changes during playback doesn't need a signal. Config is the smaller change, and it keeps the engine's state limited to what changes.

## Who writes each key

Each behavior declares the state and context keys it uses, and its types say which it writes (`Signal`) and which it only reads (`ReadonlySignal`). Most keys have one writer. The reference's state and context tables list, for each key, the behaviors that use it.

Some keys have no behavior that writes them. The adapter or your own code writes them from outside the engine. The user's track choice is one: `userVideoTrackSelection` changes when someone picks a quality in a menu. These are **external signals**, and a feature declares them with `defineExternalSignals()`:

```ts
// packages/spf/src/playback/features/video.ts (trimmed)
export const behaviors = [
  // …the video behaviors
  defineExternalSignals<UserTrackSelectionState<'video'>>()({ state: ['userVideoTrackSelection'] }),
] as const;
```

The declaration creates no behavior that does anything. It puts the key into the engine's state type, so the adapter can write it and the behaviors that read it can find it.

## Initial state

A feature can seed state that no behavior writes on its own. The engine merges each feature's `initialState`, and a later feature's value wins. The background-video engine seeds `loadActivated: true` so loading starts as soon as a source is set.

## Next

You've seen what behaviors share. Next, [write a behavior](./write-a-behavior.md).
