---
status: partial
date: 2026-05-21
definition: sketched
---

# Audio-only mode override

Engine variant that delivers audio-only playback. Composes regardless of
source shape: handles both truly audio-only HLS sources (manifests with
no video stream-inf entries) and mixed-AV sources (video / subtitle
renditions ignored at composition time). The variant decision is encoded
in the adapter choice — instantiating `HlsAudioAdapterCore`
opts the consumer into audio-only delivery.

This is a Player-level composition variant per [`../features/clusters.md` §
Feature classification axes](../features/clusters.md#feature-classification-axes).
It subsumes what Notion originally framed as two separate concerns
(Notion epic #4a "Basic Audio-only" — source-shape correctness — and
epic #4b "Audio-only Mode Override" — delivery-mode choice) into a
single composition with two variant-decision-source paths
(see *Variant-decision signal source* below).

## Status

- **Composition:** Phase 1 implemented. `createHlsAudioEngine` and
  `HlsAudioAdapterCore` ship in `packages/spf/src/playback/engines/hls/`
  and re-export from `@videojs/spf/hls`. The adapter handles both truly
  audio-only HLS sources and mixed-AV sources (video / subtitle renditions
  ignored at composition time). Phases 2 (audio-abr, multi-language-audio)
  and 3 (alternative buffer-target defaults) are not yet implemented.
- **Definition depth:** sketched — Phase 1 implementation surface populated;
  Phases 2 and 3 remain coarse pending their constituent features.
- **Source material:** Notion epics
  [#4a](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4) (Basic
  Audio-only, Eng=S / Validation=S) and
  [#4b](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4) (Audio-only
  Mode Override, Eng=M / Validation=S). Originally classified as separate
  Case-1 (Media-src composition case) + Case-2 (Player composition case)
  concerns; consolidated here because both ship the same engine factory
  and adapter, distinguished only by which signal sources the variant
  decision.

## Target delivery context

**Source-shape correctness — truly audio-only sources** (where the manifest
declares only audio renditions):

- **Audio-only HLS assets** — sources published as audio-only (podcasts,
  music, audio articles). The current default `createHlsVideoEngine` *tolerates*
  these via `setupVideoBufferActors` / `loadVideoSegments` no-op-ing when
  `presentation.videoTracks` is empty; this variant composes the audio-only
  pipeline *explicitly*, saving the no-op overhead and making the "no video"
  state structural rather than incidental.

**Delivery-mode choice — mixed-AV sources delivered as audio-only**:

- **"Listen on the go" toggles** — user opts into audio-only delivery to save
  data or because they're not viewing the screen (background playback, screen
  off, headphones-only).
- **Audio-podcast modes** — content is podcast-flavored even when the source
  manifest is a standard mixed-AV HLS asset (no audio-only-source variant
  published).
- **Mux-billing-driven audio-only sessions** — Mux billing context may make
  audio-only sessions cheaper; consumers opt into audio-only to reduce billing.
- **Adapter-layer audio-only player chrome** — consumer surface presents an
  audio-only UI (cover art, podcast controls), engine variant matches the
  surface.

Common to all: the *delivery* is audio-only. The variant composes identically
across both source shapes; what differs is the *variant-decision source* (see
below).

## Phases of complexity

| Phase | What |
|---|---|
| **1 — Basic functionality** *(implemented)* | Parallel engine-factory + adapter pair. `createHlsAudioEngine` composes the audio-side subset of `createHlsVideoEngine`'s behavior list, subtracting video-side and text-track behaviors entirely (Phase 1 ships without subtitle support). `HlsAudioAdapterCore` wraps the engine with the same pattern as `HlsVideoAdapterCore`. See *Implementation surface* below |
| **2 — Features/functionality relevant to the use case** | Compose constituent feature behaviors as they land: [`audio-abr`](../features/audio-abr.md) when implemented (multi-bitrate audio support in the variant), [`multi-language-audio`](../features/multi-language-audio.md) when implemented (language selection within the variant). Both are additive — the variant gains capability as the constituent features get built |
| **3 — Optimizations** | Alternative default configurations for the audio-only delivery context: shorter forward-buffer targets (audio is lower-bandwidth; less ahead-buffering needed), possibly different `preload` defaults. The Path-A (update existing behavior's defaults) vs Path-B (audio-only-specific buffer-management behavior) judgment call applies — see [`README.md` § Implementation note](./README.md#implementation-note-customizing-behaviors-for-use-cases) |

## Composition specifics

Phase 1 is subtractive-only; Phases 2 and 3 surface the other mechanisms.

### Behaviors subtracted (Phase 1)

From `createHlsVideoEngine`'s composition, omit:

**Video-side:**
- `resolveVideoTrack` — no video media playlist fetch
- `switchVideoQuality` — no video ABR switching (also subsumes the
  default-pick that owns `selectedVideoTrackId`; see `engine.ts:240-243`)
- `setupVideoBufferActors` — no video `SourceBuffer` / actor
- `loadVideoSegments` — no video segment loading

**Text-track-side** *(Phase 1 ships without subtitle support; future phase
may add back):*
- `switchTextTrack` — no subtitle rendition selection
- `resolveTextTrack` — no subtitle media playlist fetch
- `syncTextTracks` — no `TextTrack` slot sync
- `setupTextTrackActors` — no text-track actors
- `loadTextTrackSegments` — no subtitle segment loading

**`initialState` seed dropped:** the parent engine seeds `bandwidthState` to
let `switchVideoQuality` fire on its initial subscribe. With
`switchVideoQuality` subtracted and no Phase 1 audio behavior subscribing to
bandwidth, the seed becomes unnecessary and is omitted. Returns when
`audio-abr` (Phase 2) lands.

### Behaviors added (Phase 1)

**None.** This use case ships as an *independent adapter* paired with its own
engine factory. The variant-decision is encoded in the adapter choice itself —
consumers instantiate `HlsAudioAdapterCore` to opt in. No runtime
variant-decision behavior is needed.

### Alternative implementations (Phase 3 candidates)

- Possibly an audio-only-tuned `buffer-management` behavior with different
  defaults (Path-B). Phase 3 surfaces this candidate; the Path-A vs Path-B
  judgment per [`README.md` § Implementation note](./README.md#implementation-note-customizing-behaviors-for-use-cases)
  defers.

### Alternative default configurations (Phase 3 candidates)

- `forwardBuffer.bufferDuration` — shorter for audio-only (e.g., 10s instead of
  30s) since audio is lower-bandwidth and there's no display-paced render to
  ahead-buffer for.
- `preload` default — potentially more eager for audio-only (the cost of
  speculative fetching is lower).

## Constituent features

Phase 1 baseline:

- **[`audio-playback`](../features/audio-playback.md)** — used as-is. Provides
  rendition selection, media playlist resolution, segment loading; the variant
  inherits all of it.
- **[`engine-adapter-integration`](../features/engine-adapter-integration.md)** —
  used with an alternative adapter shape. The variant ships its own
  `HlsAudioAdapterCore`-style adapter parallel to
  `HlsVideoAdapterCore`. The mixin pattern composes
  unchanged; the consumer-facing API differs.
- **[`mse-mms-pipeline`](../features/mse-mms-pipeline.md)** — used as-is.
  `MediaSource` + `endOfStream` gate compose unchanged across variants (per the
  uniform-across-tracks discipline — `endOfStream` reads
  `mediaSource.sourceBuffers` aggregately).
- **[`buffer-management`](../features/buffer-management.md)** — used as-is in
  Phase 1; Phase 3 surfaces alternative defaults.

Phase 2:

- **[`audio-abr`](../features/audio-abr.md)** *(not yet implemented)* — when
  implemented, composed in for multi-bitrate audio. Used as-is.
- **[`multi-language-audio`](../features/multi-language-audio.md)** *(partial — landed)* —
  composed in unchanged; variant state exposes `userAudioTrackSelection` slot.
  Variant engine composes `switchAudioTrack` (slot owner with filter + flush)
  instead of `selectAudioTrack`; `setupAudioBufferActors` carries over from
  the default engine. Consumer can write language filters or specific track
  IDs for mid-stream switching within the audio-only variant.

## Customer-policy surface

The variant ships as an **independent adapter** parallel to
`HlsVideoAdapterCore`:

```ts
// Default (mixed AV delivery)
const player = new HlsVideoAdapterCore();
player.src = mixedSourceUrl;

// Audio-only mode override
const audioPlayer = new HlsAudioAdapterCore();
audioPlayer.src = sameMixedSourceUrl;
```

The adapter encodes the variant choice. Detect-from-parser routing in the
default adapter (Variant-decision path 2) is not yet built — consumers
currently select the adapter that matches their delivery surface explicitly.

Specific consumer-facing properties (loop flag, autoplay-muted defaults, etc.)
are adapter-layer concerns, not engine-variant concerns. The engine-variant
surface is the composition itself; the adapter wraps it with the API consumers
actually call.

## Variant-decision signal source

The variant composes identically regardless of signal source. Two paths
exist; both target the same `createHlsAudioEngine` factory:

**1. Adapter-upfront (implemented; Phase 1).** Selecting
`HlsAudioAdapterCore` over `HlsVideoAdapterCore` *is* the
variant choice. No detect-from-parser logic, no runtime config branch.
Used by consumers that know they want audio-only delivery (the
delivery-mode-choice scenarios in *Target delivery context*).

**2. Detect-from-parser (future).** A routing-from-default-adapter path
where `HlsVideoAdapterCore` (or a higher-level adapter) detects an
audio-only source shape from the parsed presentation
(`presentation.videoTracks` empty) and switches its internal engine
factory to `createHlsAudioEngine` for that source. Targets the
source-shape-correctness scenario without forcing consumers of
audio-only sources to opt into a separate adapter type. The default
adapter would default to `createHlsVideoEngine` for mixed sources and
`createHlsAudioEngine` for audio-only ones; existing tolerance
behavior would be supplanted by explicit composition. Not yet built.

Both paths can coexist. The shared factory is the load-bearing
artifact; how the variant is signaled is orthogonal.

## Likely cross-cutting impact

- **Adapter shape proliferation.** Each use-case composition that gets its own
  adapter multiplies the adapter surface. As more use cases land
  (background-video, video-only-mode-override, audio-podcast mode,
  etc.), the inventory of `Hls*MediaElement` classes grows. Worth flagging
  as a registry-level concern; may surface a future "use-case adapter factory"
  pattern.
- **Default-adapter routing change (when Variant-decision path 2 lands).**
  Detect-from-parser routing in `HlsVideoAdapterCore` would change the
  default engine for audio-only sources from `createHlsVideoEngine` (current
  tolerance) to `createHlsAudioEngine` (explicit composition). Compatible
  in observable behavior — both produce working audio playback — but the
  composition shape changes structurally. Worth a test-fixture pass when the
  routing lands.
- **`audio-only endOfStream` simplification.** `endOfStream` reads
  `mediaSource.sourceBuffers` aggregately and composes unchanged across
  variants. With only one buffer in the audio-only variant, the gate
  naturally simplifies — no per-type changes needed (verified in Phase 1
  integration tests).
- **Audio-only ABR composition (Phase 2).** When `audio-abr` lands, the
  variant gains multi-bitrate audio support additively. The audio path's
  `createTrackedFetch` integration lives in `audio-abr`'s implementation
  surface; this variant composes it in unchanged.

## Open questions

- **Buffer-target tuning baseline.** Phase 3 alternative defaults — empirical
  question of whether the default 30s forward-buffer is appropriate for
  audio-only or wants tuning. Defer until usage signals appear from Phase 1.
- **Mux-billing integration.** If audio-only sessions are billed differently,
  where does the billing context surface? Adapter-layer (consumer reports
  session type) vs engine-layer (engine exposes "this is audio-only mode"
  signal). Likely adapter-layer.
- **Variant-decision source for live + audio-only.** Live + audio-only
  intersection (radio-stream-like delivery from mixed source) — same
  adapter-upfront pattern, or does live add complications?
- **Subtitle support for Phase 2+.** Phase 1 ships without subtitles. Some
  audio-only consumer scenarios (podcast transcripts, accessibility) want
  subtitles back; a future phase can add the text-track behaviors as an
  additive composition. Whether subtitles compose unchanged from the default
  engine or need a tuning pass is open.

## Resolved during Phase 1 implementation

These questions were open in the original `coarse` draft and resolved by the
Phase 1 implementation pass (kept for traceability):

- **Engine variant factory shape** — *single shared factory.* Originally the
  Case-1 source-shape concern and the Case-2 delivery-mode concern were
  documented as separate features+use-case (`audio-only-composition` +
  `audio-only-mode-override`); the Phase 1 implementation pass landed a
  single `createHlsAudioEngine` serving both, and the two docs
  consolidated into this one. Variant-decision source remains the
  orthogonal axis (see *Variant-decision signal source* above).
- **Adapter naming** — `HlsAudioAdapterCore` (with
  `HlsAudioMixin` for mixin consumers and
  `hlsAudioAdapterDefaultProps` for default values), matching the
  `Simple{Variant}HlsMediaElement` naming pattern.
- **Subtitle / text-track handling for Phase 1** — *subtracted entirely.*
  Phase 1 ships without subtitles to keep the initial surface lean; future
  phases may add back additively (see *Open questions*).

## Implementation surface

Phase 1 landed across the full SPF→core→html/react→sandbox cascade,
parallel to the existing `hls-video` pair.

**SPF — engine factory** (`packages/spf/src/playback/engines/hls/`):

| Export | File | Purpose |
|---|---|---|
| `createHlsAudioEngine` | `engine-audio-only.ts` | Subtractive composition variant; omits all video + text-track behaviors |
| `HlsAudioEngineState` | `engine-audio-only.ts` | Trimmed state — no `selectedVideoTrackId` / `selectedTextTrackId` / `userVideoTrackSelection` / `bandwidthState` |
| `HlsAudioEngineContext` | `engine-audio-only.ts` | Trimmed context — no video buffer / video segment loader / text-track actor slots |
| `HlsAudioEngineConfig` | `engine-audio-only.ts` | Trimmed config — no video-quality, bandwidth, or text-track fields |

**SPF — adapter** (`packages/spf/src/playback/engines/hls/`):

| Export | File | Purpose |
|---|---|---|
| `HlsAudioAdapterCore` | `hls-audio/adapter.ts` | Standalone adapter, no base class |
| `HlsAudioMixin` | `hls-audio/adapter.ts` | Mixin for adapters with a custom base |
| `HlsAudioAdapterProps` / `…API` | `hls-audio/adapter.ts` | Adapter API surface — same WHATWG src/preload/play contract as `HlsVideoAdapterCore` |
| `hlsAudioAdapterDefaultProps` | `hls-audio/adapter.ts` | Default-prop constants |

Public re-export: `@videojs/spf/hls` — all of the above ship via
`packages/spf/src/playback/engines/hls/index.ts`.

**Media** (`packages/spf/src/playback/adapters/hls-audio/`):

| Export | File | Purpose |
|---|---|---|
| `HlsAudioAdapter` | `index.ts` | Applies `HlsAudioMixin` to `HTMLAudioAdapter` (audio host, not video — symmetric with `mux-audio`) |

Public re-export: `@videojs/spf/hls-audio`.

**HTML — custom element** (`packages/html/src/media/hls-audio/`):

| Export | File | Purpose |
|---|---|---|
| `HlsAudio` | `media/hls-audio/adapter.ts` | Applies `MediaAttachMixin` + `CustomMediaElement('audio', HlsAudioAdapter)` |
| `HlsAudioElement` (tag `hls-audio`) | `media/hls-audio/element.ts` | Custom-element implementation; `define/media/hls-audio.ts` registers it via `safeDefine` |

CDN entry: `packages/html/src/define/media/hls-audio.ts` →
`@videojs/cdn/media/hls-audio`.

**React — component** (`packages/react/src/media/hls-audio/`):

| Export | File | Purpose |
|---|---|---|
| `HlsAudio` | `index.tsx` | React component rendering an `<audio>` element bound to `HlsAudioAdapter`; props mirror the HTML element's WHATWG-style attribute surface |

Public re-export: `@videojs/react/media/hls-audio`.

**Composed behaviors (current):** `syncPreload`, `trackLoadTriggers`,
`resolvePresentation`, `resolveAudioTrack`, `calculatePresentationDuration`,
`setupMediaSource`, `updateMediaSourceDuration`, `setupAudioBufferActors`,
`trackCurrentTime`, `switchAudioTrack`, `loadAudioSegments`, `endOfStream`,
and a `makeExternalInputs` behavior for the external inputs. (Phase 1 composed `selectAudioTrack`; `switchAudioTrack`
replaced it when [`multi-language-audio`](../features/multi-language-audio.md)
Tier 2 landed.)

`endOfStream` composes unchanged from the default engine — it iterates
buffer actors via `[videoBufferActor, audioBufferActor].filter(Boolean)`
and reads `mediaSource.sourceBuffers` aggregately, so the audio-only
configuration drives end-of-stream correctly with no per-type changes.

## Verification

**Unit tests** (`packages/spf/src/playback/engines/hls/tests/`):

- `engine-audio-only.test.ts`:
  - `"creates engine with state, context, and destroy"` — basic API surface
  - `"does not seed bandwidthState (no ABR behavior subscribed at init)"` —
    asserts the dropped seed
  - `"plays truly audio-only HLS source (parity with default-engine tolerance)"`
    — asserts `selectedAudioTrackId`, `audioBufferActor`, and an open
    `MediaSource` against an audio-only manifest. Parity baseline with
    `engine.test.ts` → "handles audio-only stream (no video tracks)"
  - `"plays mixed HLS source as audio-only (video tracks ignored)"` —
    **the Case-2 acceptance criterion.** Asserts the variant ignores video
    stream-inf entries: no `selectedVideoTrackId`, no `videoBufferActor`,
    no fetch of the video media playlist
  - `"plays mixed HLS source with subtitles ignored"` — asserts no
    text-track machinery is set up against a manifest that contains a
    `TYPE=SUBTITLES` rendition
  - `"cleans up on destroy"` — `engine.destroy()` does not throw

- `hls-audio/tests/mixin.test.ts` — 28 tests covering the WHATWG
  `src`/`preload`/`play()`/`attach`/`detach`/`destroy` contract on
  `HlsAudioAdapterCore`. Mirrors `adapter.test.ts` semantically
  (the variant differs in composition, not in adapter contract).

**Sandbox demos** (templates checked in; `src/` is mirrored from
`templates/` by `pnpm dev:sandbox` per the sandbox README):

- `apps/sandbox/templates/html-hls-audio/` — exercises
  `<hls-audio>` against the shared `SOURCES` registry,
  wrapped in the standard `audio-player` skin shell. Sandbox parity with
  `html-mux-audio` / `html-hls-video`.
- `apps/sandbox/templates/react-hls-audio/` — exercises
  `<HlsAudio>` against the same registry through the React
  audio skin component. Sandbox parity with `react-mux-audio` /
  `react-hls-video`.

**Out of scope for Phase 1 (deferred):**

- E2E tests — engine-level integration + manual sandbox verification
  suffice for Phase 1; E2E reliability coverage deferred until behavior
  stabilizes.

## Related features

- **[`audio-playback`](../features/audio-playback.md)** — constituent baseline.
- **[`engine-adapter-integration`](../features/engine-adapter-integration.md)** —
  constituent; variant adapter parallels `HlsVideoAdapterCore`.
- **[`mse-mms-pipeline`](../features/mse-mms-pipeline.md)** — constituent;
  composes unchanged.
- **[`buffer-management`](../features/buffer-management.md)** — constituent;
  Phase 3 alternative defaults candidate.
- **[`audio-abr`](../features/audio-abr.md)** *(documented; pending
  implementation)* — Phase 2 constituent.
- **[`multi-language-audio`](../features/multi-language-audio.md)** *(coarse;
  not yet implemented)* — Phase 2 constituent.

## Related use cases

- **[`video-only-mode-override`](./video-only-mode-override.md)** *(coarse)* —
  inverse-axis sibling. Same shape, video-side instead of audio-side: subtract
  audio behaviors from any source to deliver video-only. Distinct from
  `[background-video]` despite shared constituent features.

## See also

- [`README.md`](./README.md) — use-case-composition doc-type spec
- [`../features/clusters.md` § Composition vs Policy vs middle pattern](../features/clusters.md#composition-vs-policy-vs-middle-pattern) — composition implementation shape
- [`../features/clusters.md` § Feature classification axes](../features/clusters.md#feature-classification-axes) — Notion's Composition cases per mode framing
- [`../conventions/behaviors.md` § Inverse: behaviors that operate uniformly across tracks](../conventions/behaviors.md#inverse-behaviors-that-operate-uniformly-across-tracks) — composition-variant discipline; the `updateMediaSourceDuration` worked example
- [SPF Epics Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4) — Notion epic #4b
- [`packages/spf/docs/hls-engine.md`](../../../../packages/spf/docs/hls-engine.md) — current HLS engine composition walkthrough; the variant subtracts from this baseline
- [`packages/spf/src/playback/engines/hls/engine-audio-only.ts`](../../../../packages/spf/src/playback/engines/hls/engine-audio-only.ts) — Phase 1 engine factory
- [`packages/spf/src/playback/adapters/hls-audio/mixin.ts`](../../../../packages/spf/src/playback/adapters/hls-audio/mixin.ts) — Phase 1 adapter
- [`packages/spf/src/playback/engines/hls/tests/engine-audio-only.test.ts`](../../../../packages/spf/src/playback/engines/hls/tests/engine-audio-only.test.ts) — Phase 1 engine integration tests
- [`packages/spf/src/playback/adapters/hls-audio/tests/mixin.test.ts`](../../../../packages/spf/src/playback/adapters/hls-audio/tests/mixin.test.ts) — Phase 1 adapter tests
- [`packages/spf/src/playback/adapters/hls-audio/adapter.ts`](../../../../packages/spf/src/playback/adapters/hls-audio/adapter.ts) — Phase 1 media wrapper
- [`packages/html/src/media/hls-audio/adapter.ts`](../../../../packages/html/src/media/hls-audio/adapter.ts) — Phase 1 HTML custom element
- [`packages/react/src/media/hls-audio/adapter.tsx`](../../../../packages/react/src/media/hls-audio/adapter.tsx) — Phase 1 React component
- [`apps/sandbox/templates/html-hls-audio/`](../../../../apps/sandbox/templates/html-hls-audio/) — Phase 1 HTML sandbox demo template
- [`apps/sandbox/templates/react-hls-audio/`](../../../../apps/sandbox/templates/react-hls-audio/) — Phase 1 React sandbox demo template
