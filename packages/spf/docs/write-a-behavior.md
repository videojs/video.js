# Write a behavior

<!--
AI first draft (2026-10-23), for Christian to rewrite. Retraces trackPlaybackRate
(packages/spf/src/playback/behaviors/dom/track-playback-rate.ts), quoted with its JSDoc trimmed. It is
exported from @videojs/spf/behaviors/dom/track-playback-rate and composed by none of the pre-composed
engines, which is why the last step composes it. defineBehavior's key check: ExhaustiveKeys in
core/composition/define-behavior.ts. Cleanup handling: createComposition retains every setup's return.
-->

Most of SPF's functionality lives in behaviors. On this page you walk through a small real one, `trackPlaybackRate`, and add it to the engine you composed.

## The job

`trackPlaybackRate` keeps `state.playbackRate` in step with the media element's `playbackRate`. Other behaviors can then read the rate as state, without touching the element.

A behavior does one job like this. It doesn't know which engine it's in or which other behaviors are there.

## Declare what it uses

Start with the types for the state, context, and config the behavior uses. Each type describes the key the way any behavior that uses it would:

```ts
export interface PlaybackRateState {
  playbackRate?: number;
}

export interface PlaybackRateContext {
  mediaElement?: HTMLMediaElement | undefined;
}

export interface TrackPlaybackRateConfig {
  defaultPlaybackRate?: number;
}
```

## Write the setup

The setup receives the signals for its keys and the engine's config. Its parameter types say what it writes and what it only reads. This behavior writes `playbackRate`, so that's a `Signal`. It only reads `mediaElement`, so that's a `ReadonlySignal`:

```ts
function trackPlaybackRateSetup({
  state,
  context,
  config,
}: {
  state: { playbackRate: Signal<PlaybackRateState['playbackRate']> };
  context: { mediaElement: ReadonlySignal<PlaybackRateContext['mediaElement']> };
  config?: TrackPlaybackRateConfig;
}): () => void {
  const defaultPlaybackRate = config?.defaultPlaybackRate ?? 1;

  return effect(() => {
    const mediaElement = context.mediaElement.get();

    if (!mediaElement) {
      state.playbackRate.set(defaultPlaybackRate);
      return;
    }

    const sync = () => state.playbackRate.set(mediaElement.playbackRate);

    sync();

    return listen(mediaElement, 'ratechange', sync);
  });
}
```

The body is one `effect()`. An effect runs once, tracks every signal it reads, and runs again when one changes. This one reads `context.mediaElement`, so it reruns when the adapter attaches or detaches an element.

Each run can return a cleanup, and the cleanup runs before the next run. Here the cleanup is the `listen()` return value, which removes the `ratechange` listener from the old element before the effect attaches one to the new element.

The setup returns the effect's own cleanup. The engine calls it when it's destroyed, which stops the effect and removes the last listener.

## Define the behavior

`defineBehavior()` pairs the setup with the keys it uses:

```ts
export const trackPlaybackRate = defineBehavior({
  stateKeys: ['playbackRate'],
  contextKeys: ['mediaElement'],
  setup: trackPlaybackRateSetup,
});
```

The key lists must match the setup's parameter types exactly. Leave one out, and the type checker names it. The composition uses the lists at runtime to create a signal for each key.

## Compose it

A behavior runs only in an engine that composes it. Wrap it in a feature and add the feature to your list from [Compose an engine](./compose-an-engine.md):

```ts
import { defineFeature } from '@videojs/spf';
import { trackPlaybackRate } from '@videojs/spf/behaviors/dom/track-playback-rate';

export const playbackRateFeature = defineFeature({ behaviors: [trackPlaybackRate] });
```

The engine's state now has a `playbackRate` key, and its config accepts `defaultPlaybackRate`. Remove the feature, and both go away.

## Rules a behavior follows

- **Never import or call another behavior.** Read and write shared state and context instead.
- **Declare every key you use.** The composition creates signals only for declared keys.
- **Clean up everything you start.** Return a cleanup from the setup, and the engine calls it on destroy.
- **Use the smallest tool that fits.** An effect is enough here. Async work, owned resources, and work in stages each have their own tool, covered on the next pages.

## Next

Some behaviors do async work that must stop when the source changes. Next, see [tasks and runners](./tasks-and-runners.md).
