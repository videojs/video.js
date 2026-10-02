# HLS engine composition

The HLS video engine, `createEngine()` from `@videojs/spf/hls/video`, composes SPF behaviors into HLS playback over MediaSource. This guide describes ownership and stage relationships, not the exact behavior array or configuration interface; those live in source.

## Inputs and adapter boundary

The adapter supplies a media element and an unresolved presentation URL by writing the engine's `state` and `context` signals. It may also write preload, current-time triggers, or user track-selection intent.

The engine returns a composition with one asynchronous destruction boundary. Assigning another presentation reuses that composition while per-source behaviors clean up and set up again.

## Resolution and selection

The first stage:

1. synchronizes preload and activation;
2. fetches and parses the multivariant playlist;
3. derives CDN priority and failover eligibility;
4. resolves video, audio, and text selection intent;
5. fetches the selected media playlists;
6. derives presentation duration.

Track switching uses ordered constraints and terminal selection rules. User selection narrows candidates without disabling automatic policy through a separate mode flag. Video ABR consumes bandwidth estimates; audio and text apply their language/default policies.

## MediaSource and buffering

After the presentation resolves, browser-bound behaviors:

- attach a standard or managed MediaSource;
- propagate duration;
- create independent video and audio buffer/loader actor clusters;
- track current time and load activation;
- plan bounded forward loading and back-buffer eviction;
- serialize SourceBuffer operations;
- coordinate end-of-stream after active types finish.

Video buffer setup is registered before audio to preserve the Firefox audio-detection ordering invariant. The exact setup and cleanup behavior is tested in the DOM behavior and engine suites.

## Text tracks

Text selection is resolved through the same constraint model as other tracks. DOM synchronization converts user mode changes into selection intent and mirrors the resolved result back without creating an echo loop.

Owned actors load WebVTT segments and cues. They are destroyed on source replacement with the other per-source resources.

Chapters are separate from selection: when the multivariant playlist carries Apple JSON chapters as session data, a
behavior fetches the document and projects one hidden `chapters` track per language onto the element; the open last
chapter ends at the largest safe integer and readers clamp it to the media duration. The audio-only engine composes it
too.

## Multi-CDN behavior

The engine derives comparable CDN identifiers from track URLs. Track selection prefers one active CDN across media types, while failed-CDN state temporarily removes candidates and later expires through the failover monitor.

Single-CDN sources pass through the same composition without additional behavior.

## Configuration

Configuration supplies engine policy and replaceable operations, including parsers, capability probing, text resolution, duration policy, buffer targets, bandwidth/quality tuning, language preference, and failover behavior.

Defaults are resolved at the engine boundary and passed to the behaviors that consume them. See its `EngineConfig` for the current surface.

## Current sources

- Composition, state, context, and configuration: `packages/spf/src/playback/engines/hls/engine.ts`
- Adapter behavior: `packages/spf/src/playback/adapters/hls-video/mixin.ts`
- Behaviors and tests: `packages/spf/src/playback/behaviors/`
- Actors and tests: `packages/spf/src/playback/actors/`
- Media and network algorithms: `packages/spf/src/media/` and `packages/spf/src/network/`
- Feature status and rationale: `internal/design/spf/features/`
