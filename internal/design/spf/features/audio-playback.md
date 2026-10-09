---
status: implemented
date: 2026-05-20
definition: sketched
---

# Audio playback

Today's single-rendition audio playback in the HLS engine. The engine
parses audio renditions from the multivariant playlist, picks one via
the default picker at source load, fetches its media playlist, sets up
an audio `SourceBuffer`, and loads segments. The selected rendition is
locked for the lifetime of the source — mid-stream switching belongs to
[`multi-language-audio`](./multi-language-audio.md) (coarse, not yet
implemented).

Symmetric with `video-abr` (video) and `subtitles` (text) in the
per-track-type capability set. Most of the implementation surface is
*owned architecturally* by other features (`mse-mms-pipeline`,
`buffer-management`, `source-replacement`); this doc captures what's
audio-specific.

## Status

- **Composition:** The `hls/video` engine (HLS VoD)
- **Definition depth:** sketched — capability surface documented;
  language-aware selection exists in `media/primitives/` but isn't
  wired (see *What's not implemented*)

## Phases of complexity

Capability slices around today's audio playback contract.

| Phase | What | Notes |
|---|---|---|
| Audio rendition recognition | `parseMultivariantPlaylist` surfaces audio renditions from `#EXT-X-MEDIA:TYPE=AUDIO` lines with `language`, `name`, `default`, `autoselect`, `channels`, `codecs`, `uri` | Engine consumes at most one today; parsing handles multiple — the foundation `multi-language-audio` builds on |
| Default audio rendition selection | `selectAudioTrack` runs the default picker once on `'presentation-resolved'` entry. Default picker today is `pickFirstTrackId` (first track in the audio selection set) — language-unaware | Config-overridable via `SelectAudioTrackConfig.picker`. The language-aware `pickAudioTrack` exists in `media/primitives/` but isn't wired — see *What's not implemented* |
| Audio media playlist resolution | `resolveAudioTrack` (sibling of resolveVideoTrack / resolveTextTrack, shared `setupTrackResolution` helper) fetches the selected rendition's media playlist on entry; aborts on source un-resolve via state-bound `AbortController` | Same shape as video / text resolution |
| Audio SourceBuffer + actor setup | `setupAudioBufferActors` creates the audio `SourceBuffer` + `SourceBufferActor` + `SegmentLoaderActor`. Uses plain `fetchStream` (no bandwidth sampling — there's no audio ABR yet) | Owned architecturally by `mse-mms-pipeline`; the Firefox `mozHasAudio` cross-type invariant lives in that feature's documentation |
| Audio segment loading | `loadAudioSegments` dispatches the per-type 4-state segment-load FSM (`'preconditions-unmet' / 'dormant' / 'metadata-only' / 'full-range'`) consuming `(preload, loadActivated)`. Same gate behavior as video | Owned architecturally by `buffer-management` |
| Source-change clearance | On source un-resolve, `selectedAudioTrackId` clears, audio actors tear down, in-flight playlist fetch aborts. New source's audio rendition picked fresh on the next resolve | Owned architecturally by `source-replacement` |

## What's not implemented

- **Multi-rendition recognition + programmatic selection + mid-stream
  switching** — covered by
  [`multi-language-audio`](./multi-language-audio.md) (partial, sketched —
  Tier 1 + most of Tier 2 implemented). Default selection in the HLS
  engines is track switching's rule chain, which applies no preferred
  language or `DEFAULT=YES` tier (dropped in #1658); a consumer sets
  `userAudioTrackSelection: { language }` for the same preference.
  `preferredAudioLanguage` is read only by `selectAudioTrack`'s policy and
  is not an HLS engine config option. Tier 2 programmatic selection via
  `userAudioTrackSelection` filter and same-codec mid-stream switching
  with next-segment-boundary flush also implemented. Persistence and
  A/V sync policy refinements deferred.
- **Audio ABR** — covered by [audio-abr](./audio-abr.md).
  `setupAudioBufferActors` uses plain `fetchStream`; the
  bandwidth-sampling `createTrackedFetch` isn't wired into the audio
  fetch path. The sampling primitive exists (used by video); audio
  needs a parallel `switchAudioQuality` behavior to consume it.
- **Channels-aware selection (5.1 / surround)** — covered by
  [5.1-surround-selection](./5.1-surround-selection.md). Audio tracks
  carry a `channels` field surfaced by the parser, but it's not yet
  used for selection or capability filtering.
- **Audio-only composition optimizations** — the engine tolerates
  audio-only sources today (basic coverage via `engine.test.ts`
  "handles audio-only stream"), but the default engine doesn't
  *explicitly* compose for audio-only contexts (no shorter buffer
  targets, no subtracted video-related work). The explicit variant
  ships via the
  [audio-only-mode-override](../use-cases/audio-only-mode-override.md)
  use case (Phase 1 landed); detect-from-parser routing in the default
  engine to supplant the tolerance is future work tracked there.
- **A/V sync handling** — delegated entirely to the browser's MSE
  pipeline. The engine doesn't intervene on audio/video sync.

## Implementation surface

**Composition:** `packages/spf/src/playback/engines/hls/engine.ts` —
audio behaviors composed alongside video and text:

```ts
// Track selection (reads config for initial preferences).
selectAudioTrack,

// Resolve selected tracks (fetch media playlists)
resolveVideoTrack,
resolveAudioTrack,
resolveTextTrack,

// ...

// MSE setup
// ...
setupAudioBufferActors,

// Segment loading
// ...
loadAudioSegments,
```

**Behaviors:**

| Behavior | File | Responsibility |
|---|---|---|
| `selectAudioTrack` | `packages/spf/src/playback/behaviors/select-tracks.ts` | Default audio rendition selection on source load. Lifecycle-only; mutually exclusive with `switchAudioTrack` |
| `switchAudioTrack` | `packages/spf/src/playback/behaviors/track-switching.ts` | Filter-reactive slot owner + mid-stream flush dispatcher. **Owned architecturally by [`multi-language-audio`](./multi-language-audio.md)** — composed in both the `hls/video` engine and the `hls/audio` engine today |
| `resolveAudioTrack` | `packages/spf/src/playback/behaviors/resolve-track.ts` | Fetches the selected audio media playlist |
| `setupAudioBufferActors` | `packages/spf/src/playback/behaviors/dom/setup-buffer-actors.ts` | Audio SourceBuffer + actor setup. **Owned architecturally by `mse-mms-pipeline`** |
| `loadAudioSegments` | `packages/spf/src/playback/behaviors/dom/load-segments.ts` | Audio segment loading dispatcher. **Owned architecturally by `buffer-management`** |

**Helpers:**

| Helper | File | Status |
|---|---|---|
| `pickAudioTrack(presentation, config)` | `packages/spf/src/media/primitives/select-tracks.ts` | **Default picker today** — language-aware three-tier (`preferredAudioLanguage` → `DEFAULT=YES` → first-track). Wired by [`multi-language-audio`](./multi-language-audio.md) Tier 1 |
| `pickFirstTrackId(presentation, 'audio')` | `packages/spf/src/media/primitives/select-tracks.ts` | Simple first-track fallback (still available for callers overriding via `SelectAudioTrackConfig.picker`) |

**State slots:**

- `selectedAudioTrackId` — single-writer. Owner depends on which audio-
  selection behavior is composed: `selectAudioTrack` (lifecycle-only) or
  `switchAudioTrack` (filter-reactive + mid-stream flush; the variant
  composed in the `hls/video` engine and the `hls/audio` engine
  today). Becomes `switchAudioQuality`'s responsibility when
  [audio-abr](./audio-abr.md) lands (extends `switchAudioTrack`).
- `userAudioTrackSelection` — added by [`multi-language-audio`](./multi-language-audio.md).
  Consumer-driven `Partial<AudioTrack>` filter narrowing the audio
  candidate set before `switchAudioTrack`'s picker runs.
- Reads `presentation` (audio renditions surface in
  `presentation.selectionSets`)

**Manifest parsing:** `parseMultivariantPlaylist`
(`packages/spf/src/media/hls/parse-multivariant.ts`) extracts audio
renditions from `#EXT-X-MEDIA:TYPE=AUDIO` lines.

## Config surface

```ts
{
  // None at the engine level: preferred-language selection goes
  // through `userAudioTrackSelection` state.
}
```

Plus the behavior-level override:

```ts
// SelectAudioTrackConfig (consumed via composition config)
{
  picker?: TrackPicker<SelectAudioTrackConfig>;  // Override default
                                                  // pickFirstTrackId
}
```

Consumers wanting language-aware selection today must override
`picker` — e.g., to use `pickAudioTrack` from
`@videojs/spf` primitives.

## Verification

- **Unit tests:**
  - `packages/spf/src/playback/engines/hls/tests/engine.test.ts` →
    "orchestrates complete pipeline" — asserts `selectedAudioTrackId`
    defined, audio track resolved, audio buffer actor present
  - `packages/spf/src/playback/engines/hls/tests/engine.test.ts` →
    "handles audio-only stream" — basic audio-only coverage
  - `packages/spf/src/playback/behaviors/dom/tests/setup-buffer-actors.test.ts`
    — per-type audio setup
  - **Coverage gap:** no dedicated `select-tracks.test.ts` coverage
    specifically asserting audio picker behavior (the default
    `pickFirstTrackId` path is exercised through the orchestration
    tests; the `pickAudioTrack` primitive has its own unit tests in
    `media/primitives/tests/`)
- **Sandbox:**
  - `apps/sandbox/src/spf-segment-loading/` — exercises audio
    playback as part of HLS playback

## Open questions

- **Audio-only composition guarantees.** The engine *tolerates*
  audio-only sources today, but is it *designed* for them? The
  [audio-only-mode-override](../use-cases/audio-only-mode-override.md)
  use case (Phase 1 landed) supplies the explicit variant; whether
  the default engine routes to it for audio-only sources via
  detect-from-parser is future work tracked there.
- **Channels exposure vs use.** The parser surfaces `channels` on
  audio tracks but no selection logic consumes it. Stays inert until
  [5.1-surround-selection](./5.1-surround-selection.md) wires it.

## Related features

- **[multi-language-audio](./multi-language-audio.md)** *(partial, sketched)* —
  the extension covering multi-rendition surfacing (free via parser),
  language-aware default selection (wires `pickAudioTrack`), programmatic
  selection via `userAudioTrackSelection` filter, and same-codec mid-stream
  switching via next-segment-boundary flush. Today's `audio-playback`
  is the baseline it builds on.
- **subtitles** — parallel structure (default picker + per-type
  segment loading; same `setupTrackResolution` helper). Text-track
  selection is user opt-in by default; audio's default selection
  always picks something (or nothing if no audio renditions).
- **video-abr** — video equivalent. Video has ABR overlay; audio
  doesn't (yet — see [audio-abr](./audio-abr.md)).
- **mse-mms-pipeline** — owns audio SourceBuffer setup
  (`setupAudioBufferActors`). The Firefox `mozHasAudio` cross-type
  invariant lives in that feature's documentation.
- **buffer-management** — owns audio segment loading
  (`loadAudioSegments`). Same 4-state FSM as video / text.
- **source-replacement** — audio actors and `selectedAudioTrackId`
  tear down via the resolved/unresolved cascade.
- **preload-modes** — gates audio loading via the same FSM that
  gates video and text.
- **[audio-abr](./audio-abr.md)** — bandwidth sampling + quality
  switching for audio. Parallel sibling of video-abr on the audio
  axis; consumes audio-playback's single-rendition baseline + (when
  it lands) multi-language-audio's rendition-group machinery.
- **[5.1-surround-selection](./5.1-surround-selection.md)** —
  channels-aware codec-change selection. Consumer of capability-
  probing on the audio channel-count axis. Wires the `channels` field
  surfaced by the parser into selection logic.
- **[audio-only-mode-override](../use-cases/audio-only-mode-override.md)** *(use case; Phase 1 landed)* —
  engine variant optimized for audio-only delivery; covers both
  truly-audio-only sources and mixed sources delivered as audio-only.
- **capability-probing** *(candidate)* — narrows the audio candidate
  set selection runs over; unsupported codecs filtered upstream of
  the `selectAudioTrack` picker.

## Use cases that compose this feature

- **[`audio-only-mode-override`](../use-cases/audio-only-mode-override.md)**
  *(partial — Phase 1 landed)* — Phase 1 baseline constituent. The
  audio-only delivery variant composes this feature's rendition
  selection, media playlist resolution, and segment loading as-is via
  the `hls/audio` engine.

## See also

- [presentation-modeling.md](../presentation-modeling.md) —
  architectural deep-dive on the format-neutral data shape and parser
  interface that surfaces audio renditions (the `parsePresentation`
  contract this feature's recognition phase relies on)
- [multi-language-audio.md](./multi-language-audio.md) — future
  extension on top of this feature
- [clusters.md § Track & variant registry](./clusters.md#track--variant-registry)
- [conventions/behaviors.md](../conventions/behaviors.md) — per-type
  specialization pattern (`setupTrackResolution`)
- [packages/spf/docs/hls-engine.md](../../../../packages/spf/docs/hls-engine.md)
  — engine composition walkthrough (Stage 2: track selection; Stage 3:
  track resolution)
