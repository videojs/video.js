---
status: implemented
date: 2026-05-20
definition: sketched
---

# Subtitles

User-facing subtitle / caption playback for HLS sources. The engine recognizes subtitle renditions from a multivariant playlist, exposes them via DOM `TextTrack` slots, applies default-selection logic, supports user- and programmatic-driven switching, and fetches + parses WebVTT segments on demand.

This doc captures the **capability surface**: what works, what doesn't, which behaviors / actors / state slots implement it, and how it relates to other features. For the architectural patterns (Actor/Reactor state machines, friction points, open questions), see [text-track-architecture.md](../text-track-architecture.md).

## Status

- **Composition:** `createHlsVideoEngine` (HLS VoD)
- **Definition depth:** sketched — capability surface and implementation footprint documented; architectural deep-dive lives in [text-track-architecture.md](../text-track-architecture.md)

## Phases of complexity

What's implemented today, organized from base case to richer support. Each row is a slice that could in principle stand alone; in practice they share the same five behaviors and two actors.

| Phase | What | Notes |
|---|---|---|
| Base WebVTT captions | Single subtitle track, segmented WebVTT, browser-native parsing | `resolveVttSegment` uses an offscreen `<video><track>`; VTTCue settings (position, line, align, size) pass through; voice spans, regions, ruby pass through opaquely |
| Multi-language tracks | Any number of subtitle renditions surfaced from a multivariant playlist | `LANGUAGE`, `NAME`, `DEFAULT`, `AUTOSELECT`, `FORCED`, `URI` parsed from `#EXT-X-MEDIA:TYPE=SUBTITLES` |
| Default selection | Auto (no user intent) runs the opt-in three-tier policy: `preferredSubtitleLanguage` → `DEFAULT=YES + AUTOSELECT=YES` → none | `switchTextTrack`'s terminal (`pickResolvedTextTrack` → `pickTextTrackFromTracks`) over the constrained, CDN-scoped candidates. Forced-only tracks excluded by default (Apple-spec); opt-in via `includeForcedTracks` |
| User selection (DOM-driven) | Browser captions UI / host-page button → DOM `mode='showing'` → `userTextTrackSelection` intent → resolved into `selectedTextTrackId` | `change` listener on `mediaElement.textTracks` writes a language-based partial (or `'off'`); Chromium settling-window + echo guard (`showingId === selectedTextTrackId`) reject auto-pick / mirror echoes |
| Programmatic selection | Consumer writes `state.userTextTrackSelection` (partial / `'off'`) through the engine's `state` | `switchTextTrack` resolves it; `syncTextTracks` mirrors the resolved id into DOM `mode`. (Was a direct `selectedTextTrackId` write.) |
| Constraint- & CDN-aware selection | Selection runs the track-switching chain: failed-CDN renditions pruned, narrowed to the active CDN | `[excludeFailedCdns]` + `[preferActiveCdn]`; re-resolves on failover. Sticky language / `'off'` intent persists across source changes |
| Cue deduplication | Per-track cue cache in `TextTracksActor`; segment reloads don't double-add | Dedup by exact `(startTime, endTime, text)` match |
| Preload-aware segment loading | FSM gates fetches: `'preconditions-unmet' → 'dormant' → 'metadata-only' → 'full-range'` driven by `preload` + `loadActivated` | `metadata-only` is a no-op for text (no init-segment concept) |
| Source-reset cleanup | `'clear'` message to `TextTracksActor` evicts cue + segment cache; `<track>` elements removed | Symmetric with manifest unload |

## What's not implemented

Extension boundaries — each could become its own feature doc or a phase extension on this one:

- **Styled WebVTT cues** — VTTCue properties pass through unmodified, but no SPF-side styling logic. Styling is consumer-side via CSS `::cue`. Could be its own feature if SPF needs to inject styles for theme-aware captions.
- **Multi-track concurrent selection** — single `selectedTextTrackId`. HLS-compliant, but not aligned with HTML `TextTrack.mode = 'showing'` semantics where multiple tracks can in principle show simultaneously.
- **Back-buffer cue eviction** — cues live for the presentation lifetime once added (small-footprint assumption). May need revisit for long-form content with dense caption tracks.
- **Segment-fetch error recovery** — current behavior: log to console, continue to next segment. No retry, no fallback, no error surfaced to state.
- **`TextTracksActor` cue handling for disabled/missing tracks** — documented uncertainty in source. Silent gate if `textTrack` not found on `mediaElement`. Open design question — see [text-track-architecture.md § Cue deduplication](../text-track-architecture.md#cue-deduplication-open-design-question-in-texttracksactor).
- **Embedded caption tracks (CEA-608/708)** — out of scope; subtitle tracks must be separate playlist renditions.

## Implementation surface

**Composition:** `packages/spf/src/playback/engines/hls/engine.ts` — HLS VoD engine.

**Behaviors:**

| Behavior | File | Responsibility |
|---|---|---|
| `switchTextTrack` | `packages/spf/src/playback/behaviors/track-switching.ts` | Owns `selectedTextTrackId`: resolves `userTextTrackSelection` intent (incl. `'off'` / opt-in default policy) against failed-CDN-pruned, active-CDN-scoped renditions; may resolve to none |
| `resolveTextTrack` | `packages/spf/src/playback/behaviors/resolve-track.ts` | Fetches media playlist for selected text track |
| `syncTextTracks` | `packages/spf/src/playback/behaviors/dom/sync-text-tracks.ts` | DOM `<track>` lifecycle; one-way mirror of resolved id → `mode`; DOM `change` → `userTextTrackSelection` intent (echo-guarded) |
| `setupTextTrackActors` | `packages/spf/src/playback/behaviors/dom/setup-text-track-actors.ts` | Creates `TextTracksActor` + `TextTrackSegmentLoaderActor`; element-bound lifecycle |
| `loadTextTrackSegments` | `packages/spf/src/playback/behaviors/dom/load-segments.ts` | Dispatches `'load'` messages to segment-loader actor |

**Actors:**

| Actor | File | Role |
|---|---|---|
| `TextTracksActor` | `packages/spf/src/playback/actors/dom/text-tracks.ts` | Per-track cue cache, dedup, `TextTrack.addCue()` |
| `TextTrackSegmentLoaderActor` | `packages/spf/src/playback/actors/text-track-segment-loader.ts` | VTT segment fetch + parse, serial scheduling, continue/preempt |

**State slots:**

- `selectedTextTrackId` — **single-writer output**, owned by `switchTextTrack` (cleared on src unload by its exit cleanup). Other behaviors only read it.
- `userTextTrackSelection` — the user-intent **input**: `Partial<TextTrack>` (language-based) selects, `'off'` disables, `undefined` is auto. Written by `syncTextTracks` (DOM) and consumers (through the engine's `state`); both are intent surfaces, so dual-write is last-write-wins by design. Declared with `defineExternalSignals`; **not** cleared on src unload (sticky preference, like `userAudioTrackSelection`).
- `cdnPriority`, `failedCdns` — read by the chain (active-CDN scope + failed-CDN constraint).
- `presentation`, `preload`, `loadActivated`, `currentTime` — read-only consumers.

**Manifest parsing:** `parseMultivariantPlaylist` (`packages/spf/src/media/hls/parse-multivariant.ts`) extracts subtitle renditions; each becomes a `PartiallyResolvedTextTrack` carrying language, default, autoselect, forced metadata.

**Cue resolver:** `resolveVttSegment` (`packages/spf/src/media/dom/text/resolve-vtt-segment.ts`) — browser-native VTT parser via offscreen `<video><track>`. Pluggable via `config.resolveTextTrackSegment`.

## Config surface

```ts
{
  preferredSubtitleLanguage?: string;   // BCP-47 language tag for default selection
  includeForcedTracks?: boolean;        // default false — exclude forced-only tracks from auto-selection
  enableDefaultTrack?: boolean;         // default false — honor DEFAULT=YES + AUTOSELECT=YES when set
  resolveTextTrackSegment?: (url: string) => Promise<Cue[]>;  // override VTT parser
  getCdnId?: (url: string) => string;   // shared CDN-id derivation (active-CDN scope + failed-CDN constraint)
}
```

## Verification

- **Unit tests:**
  - `packages/spf/src/playback/behaviors/tests/track-switching.test.ts` — `switchTextTrack` selection: auto-default policy, explicit language, `'off'` (incl. sticky across a candidate-set refresh), stale-pick fall-through, FORCED exclusion, CDN co-location + failover re-resolution; plus the `setupTrackSwitching` `resolveSelection` no-selection seam.
  - `packages/spf/src/playback/behaviors/dom/tests/sync-text-tracks.test.ts` — `<track>` slot allocation, mode mirror, the DOM `change` → `userTextTrackSelection` intent bridge, and the echo guard (mirror echo + resolver correction are not written back).
- **Sandbox:** no dedicated multi-language captions demo today. `apps/sandbox/src/spf-segment-loading/` auto-selects the first text track via `userTextTrackSelection` but isn't a focused captions demo.

## Related features

References to other features in the registry. Bracketed entries are candidate features that don't yet have their own doc — they're tracked here so the registry surfaces them when work begins.

- **[chapters](./chapters.md)** — chapter markers from `#EXT-X-SESSION-DATA` Apple JSON, projected as hidden `chapters` `<track>` elements beside these subtitle tracks. Separate ownership tag (`data-src-chapters-track`), no part in text selection; `syncTextTracks`' `change` bridge ignores its mode changes because it only reads showing caption/subtitle tracks.
- **preload-modes** — `loadTextTrackSegments` reads the same `(preload, loadActivated)` gate state as the audio/video segment loaders; the load-mode FSM rows are direct consumers of the preload-modes contract.
- **buffer-management** — text tracks share the per-type segment-loading dispatcher pattern with video/audio (the `'preconditions-unmet' → 'dormant' → 'metadata-only' → 'full-range'` FSM is the same shape). Text uses `TextTrackSegmentLoaderActor` rather than the v/a `SegmentLoaderActor`, but the dispatcher contract is unified.
- **hls-multivariant-parsing** *(not yet documented)* — subtitle rendition extraction is one slice of manifest parsing.
- **track-switching** — text selection is now a `switchTextTrack` variant of the shared track-switching chain (constraints + rules + a `resolveSelection` terminal). It diverges from video/audio in being *optional* (opt-in / `'off'`), which is what motivated the no-selection terminal seam.
- **multi-cdn-failover** — text selection consumes the same `failedCdns` constraint + `cdnPriority` scope as video/audio, so captions co-locate on the active CDN and re-resolve on failover.
- **track-registry-primitive** *(coarse, not yet documented)* — `selectedTextTrackId` is now a single-writer resolved output; the dual-input (DOM + consumer) lives on the `userTextTrackSelection` *intent* slot, which is the natural multi-writer. Any generalized registry primitive would formalize the intent → resolved split rather than a multi-writer resolved slot.
- **styled-webvtt-cues** *(coarse, not yet documented)* — candidate extension for SPF-side cue styling.
- **text-track-error-recovery** *(coarse, not yet documented)* — candidate extension for retry / fallback / state-surfacing on segment fetch errors.

## Use cases that compose this feature

- **[`video-only-mode-override`](../use-cases/video-only-mode-override.md)** *(coarse)* — Phase 2 constituent. The video-only delivery variant composes subtitles for the muted-video + captions a11y delivery pattern — a canonical accessible consumption shape for video-only contexts.

## See also

- [text-track-architecture.md](../text-track-architecture.md) — architectural deep-dive (Actor/Reactor patterns, state machines, friction, open questions)
- [presentation-modeling.md](../presentation-modeling.md) — architectural deep-dive on the format-neutral data shape and parser interface that surfaces subtitle renditions (the `parsePresentation` contract this feature's recognition phase relies on)
- [conventions/behaviors.md](../conventions/behaviors.md) — when to define a behavior; behavior shape
- [conventions/actors.md](../conventions/actors.md) — actor shapes and conventions
- [packages/spf/docs/hls-engine.md](../../../../packages/spf/docs/hls-engine.md) — full HLS engine composition walkthrough
