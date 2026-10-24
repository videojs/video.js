# Compose an engine

<!--
AI first draft (2026-10-23), for Christian to rewrite. Cut down from the compose-an-hls-engine spike
(branch docs/spf-compose-engine). Verified 2026-10-23 in Playwright Chromium, behind an adapter like
page 1's: the eight-feature engine composes 19 behaviors and plays; with the single-audio feature it
composes 18, plays, and `userAudioTrackSelection` is no longer a state key.
-->

The adapter you built wraps one of SPF's pre-composed engines. On this page you compose an engine of your own and put it behind the same adapter.

## An engine is a feature list

Every pre-composed engine is a module with the same shape: a list of features, flattened into behaviors and defaults, and a `createEngine()` built from the result. Your engine is a module with the same shape:

```ts
// my-engine.ts
import { defineCompositionFactory, flattenFeatures } from '@videojs/spf';
import { audioFeature } from '@videojs/spf/features/audio';
import { calculateDurationFeature } from '@videojs/spf/features/calculate-duration';
import { currentTimeFeature } from '@videojs/spf/features/current-time';
import { errorFeature } from '@videojs/spf/features/error';
import { hlsLoadingFeature } from '@videojs/spf/features/hls-loading';
import { initialLoadFeature } from '@videojs/spf/features/initial-load';
import { mediaSourceFeature } from '@videojs/spf/features/media-source';
import { videoFeature } from '@videojs/spf/features/video';

export const features = [
  initialLoadFeature,
  hlsLoadingFeature,
  errorFeature,
  calculateDurationFeature,
  mediaSourceFeature,
  videoFeature,
  audioFeature,
  currentTimeFeature,
] as const;

const { behaviors, defaultConfig, initialState } = flattenFeatures(features);

export const createEngine = defineCompositionFactory(behaviors, { defaultConfig, initialState });
```

These are eight of the twenty features in the `hls-video` engine. This engine plays on-demand HLS with adaptive video and audio. It leaves out text tracks, DRM, AirPlay, multi-CDN failover, live streams, and the rest. Each feature has its own entry point, `@videojs/spf/features/<name>`, and each pre-composed engine exports its `features` list, so you can start from one and edit it.

## Put it behind your adapter

The adapter from the [previous page](./build-an-adapter.md) creates its engine in one line. Import `createEngine` from your module instead:

```ts
import { createEngine } from './my-engine';
```

The three lines that set `muted`, `loop`, and `autoplay` belong to background video. Remove them for a general-purpose player. Nothing else changes. The adapter talks to `state.presentation` and `context.mediaElement`, and your engine declares both.

## What flattening does

`flattenFeatures()` turns the feature list into the three things a composition needs:

- **One behavior list.** Each feature's behaviors go in at the feature's position. A behavior that two features share goes in once, at its first position.
- **One `defaultConfig`.** When two features default the same key, the later feature wins.
- **One `initialState`.** The same rule applies.

The engine's `state` and `context` come from that behavior list. Every key belongs to a composed behavior, so removing a feature removes its keys from the types and from the running engine.

## Replace a feature with a smaller one

Removing features leaves the ones you need, and one of those can still do more than you need. `audioFeature` can switch audio tracks when the user picks a language. If your sources carry one audio track, there's nothing to switch to.

Write a smaller feature from the behaviors you need. `selectAudioTrack` picks a rendition once, where `audioFeature`'s `switchAudioTrack` keeps picking:

```ts
// single-audio-feature.ts
import { defineFeature } from '@videojs/spf';
import { loadAudioSegments } from '@videojs/spf/behaviors/dom/load-segments';
import { setupAudioBufferActors } from '@videojs/spf/behaviors/dom/setup-buffer-actors';
import { resolveAudioTrack } from '@videojs/spf/behaviors/resolve-track';
import { selectAudioTrack } from '@videojs/spf/behaviors/select-tracks';
import { defaultConfig as audioDefaults } from '@videojs/spf/features/audio';

export const singleAudioFeature = defineFeature({
  behaviors: [selectAudioTrack, resolveAudioTrack, setupAudioBufferActors, loadAudioSegments],
  defaultConfig: audioDefaults,
});
```

Put it in `audioFeature`'s place in your list. The engine composes one behavior fewer, and `userAudioTrackSelection` is no longer a state key, because nothing composed declares it. The pre-composed background-video engine does the same thing on the video side with `backgroundVideoFeature`.

`defineFeature()` returns what you pass it. It exists to keep the behavior list's tuple type, which the composition needs to derive its state, context, and config types.

## Config is checked against what you composed

Every config key a composed behavior reads is a key of the engine's config, and the keys a feature defaults are optional. `createEngine()` rejects a key that no composed behavior reads, with a type error that names the key. That error usually means you removed the feature that read it.

```ts
const engine = createEngine({ initialBandwidth: 2_000_000 });
```

## Next

Removing a feature can break another one, and nothing throws when it does. Next, see why [features depend on each other](./feature-dependencies.md).
