# HLS engine composition

The HLS video engine, `createEngine()` from `@videojs/spf/engines/hls-video`, composes SPF features into HLS playback over MediaSource. Each feature groups the behaviors for one capability. This guide describes ownership and stage relationships and names the features behind each stage.

The [engine's reference page](./reference/engines/hls-video.md) lists its features and behaviors in composition order, with every config, state, and context key. Each feature's page lists its behaviors and what it requires from other features.

## Inputs and adapter boundary

The adapter supplies a media element and an unresolved presentation URL by writing the engine's `state` and `context` signals. It may also write preload, current-time triggers, or user track-selection intent.

The engine returns a composition with one asynchronous destruction boundary. Assigning another presentation reuses that composition while per-source behaviors clean up and set up again.

## Resolution and selection

The first stage resolves the presentation and its selected tracks. It runs these steps:

1. synchronizes preload and activation, in [initialLoadFeature](./reference/features/initial-load.md);
2. fetches and parses the multivariant playlist, in [hlsLoadingFeature](./reference/features/hls-loading.md);
3. derives CDN priority and failover eligibility, in [multiCdnFeature](./reference/features/multi-cdn.md);
4. resolves video, audio, and text selection intent, in [videoFeature](./reference/features/video.md), [audioFeature](./reference/features/audio.md), and [textTracksFeature](./reference/features/text-tracks.md);
5. fetches the selected media playlists, in the same three features;
6. derives presentation duration, in [calculateDurationFeature](./reference/features/calculate-duration.md).

Track switching uses ordered constraints and terminal selection rules. User selection narrows candidates without disabling automatic policy through a separate mode flag. Video ABR consumes bandwidth estimates; audio and text apply their language/default policies.

## MediaSource and buffering

After the presentation resolves, browser-bound behaviors take over. They do these things:

- attach a standard or managed MediaSource, in [mediaSourceFeature](./reference/features/media-source.md);
- propagate duration, in the same feature;
- create independent video and audio buffer/loader actor clusters, in [videoFeature](./reference/features/video.md) and [audioFeature](./reference/features/audio.md);
- track current time, in [currentTimeFeature](./reference/features/current-time.md), and load activation, in [initialLoadFeature](./reference/features/initial-load.md);
- plan bounded forward loading and back-buffer eviction;
- serialize SourceBuffer operations;
- coordinate end-of-stream after active types finish, in [mediaSourceFeature](./reference/features/media-source.md).

The engine lists the video feature before the audio feature. That order registers video buffer setup before audio, which preserves the Firefox audio-detection ordering invariant. The exact setup and cleanup behavior is tested in the DOM behavior and engine suites.

## Text tracks

[textTracksFeature](./reference/features/text-tracks.md) resolves text selection through the same constraint model as other tracks. DOM synchronization converts user mode changes into selection intent and mirrors the resolved result back without creating an echo loop.

Owned actors load WebVTT segments and cues. They are destroyed on source replacement with the other per-source resources.

Chapters are separate from selection. When the multivariant playlist carries Apple JSON chapters as session data, [chaptersFeature](./reference/features/chapters.md) fetches the document and projects one hidden `chapters` track per language onto the element; the open last chapter ends at the largest safe integer and readers clamp it to the media duration. The audio-only engine composes it too.

## Multi-CDN behavior

[multiCdnFeature](./reference/features/multi-cdn.md) derives comparable CDN identifiers from track URLs. Track selection prefers one active CDN across media types, while failed-CDN state temporarily removes candidates and later expires through the failover monitor.

Single-CDN sources pass through the same composition without additional behavior.

## Other features

The engine composes more features than these stages describe. These cover DRM, AirPlay, live streams, start position, timestamp shifting, player-size capping, end-stall recovery, and error collection. Each one's reference page describes it, and the [reference README](./reference/README.md#features) indexes them all.

## Other engines

`@videojs/spf/engines/hls-audio` and `@videojs/spf/engines/hls-background-video` compose other selections of these features. The audio engine drops video and text and keeps chapters. The background-video engine adds its own feature, which replaces adaptive video with one rendition picked for the whole session. The [reference README's diagram](./reference/README.md#engines-and-features) shows which engines compose which features.

## Configuration

Configuration supplies engine policy and replaceable operations, including parsers, capability probing, text resolution, duration policy, buffer targets, bandwidth/quality tuning, language preference, and failover behavior.

Each feature contributes config defaults, and the engine merges them in feature order. A default fills any key the caller leaves out or passes as `undefined`. The [engine's Config table](./reference/engines/hls-video.md#config) lists every key with its default and the behaviors that read it.

## Current sources

- Composition, state, context, and configuration: `packages/spf/src/playback/engines/hls-video.ts`
- Features the engines compose: `packages/spf/src/playback/features/`
- API reference: [`packages/spf/docs/reference/`](./reference/README.md), generated from the source JSDoc
- Adapter behavior: `packages/spf/src/playback/adapters/hls-video/mixin.ts`
- Behaviors and tests: `packages/spf/src/playback/behaviors/`
- Actors and tests: `packages/spf/src/playback/actors/`
- Media and network algorithms: `packages/spf/src/media/` and `packages/spf/src/network/`
- Feature status and rationale: `internal/design/spf/features/`
