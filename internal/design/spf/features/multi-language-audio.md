---
status: partial
date: 2026-05-25
definition: sketched
---

# Multi-language audio

Recognize multiple audio renditions from a multivariant HLS playlist, expose them with language metadata, apply a default-selection picker, and support user / programmatic switching of the active audio track — including mid-stream switching with audio-buffer flush at the next-segment boundary.

## Status

- **Composition:** Tier 1 (recognition + default selection) and most of Tier 2 (programmatic selection via `userAudioTrackSelection` + mid-stream switching) implemented in the `hls/video` engine and the `hls/audio` engine. A/V sync policy on mid-stream switch is "switch at next-segment boundary" (starting point, area for improvement). Persistence (Tier 2 phase 6) deferred.
- **Definition depth:** sketched — implementation surface populated for Tier 1 and Tier 2; specific phases (A/V sync policy refinement, persistence) remain coarse pending follow-up.

## Phases of complexity

| Phase | What | Status |
|---|---|---|
| **Tier 1 — Recognition + exposure** | Parser surfaces all audio renditions with `LANGUAGE`, `NAME`, `DEFAULT`, `AUTOSELECT`, `CHANNELS`, `URI`, `CODECS` metadata; engine state exposes the candidate list via `presentation.selectionSets`. | **Implemented** (free — owned architecturally by `parseMultivariantPlaylist` and surfaced via `audio-playback`) |
| **Tier 1 — Default selection** | Three-tier picker: `preferredAudioLanguage` → `DEFAULT=YES` → first track. | **Implemented** — `pickAudioTrack` wired as default in `selectAudioTrack`'s `AUDIO_TRACK_SELECTION_CONFIG` (and shared with `switchAudioTrack`). `preferredAudioLanguage` config field active (was inert before this feature) |
| **Tier 2 — Programmatic selection** | Consumer writes `userAudioTrackSelection` (`Partial<AudioTrack>`) to narrow the candidate set; `switchAudioTrack` reads the filter, re-fires on changes, short-circuits picker when filter narrows to single track, falls back to unfiltered candidates when filter excludes all. | **Implemented** — sibling of `userVideoTrackSelection`; constraint+filter shape matches video precedent. Slot ownership moved from `selectAudioTrack` to **new behavior `switchAudioTrack`** (precursor to audio-abr's `switchAudioQuality`) |
| **Tier 2 — Mid-stream switching** | When the audio segment loader receives a `load` for a different track than the one currently buffered, `planTasks` compares the new track's language to the buffered track's language (captured on `SourceBufferActor.context.initTrackLanguage`). On mismatch, the loader emits a `{ type: 'remove', start: nextBoundary, end: Infinity }` task *before* the new `append-init` / `append-segment` tasks. Same split as video: `switchVideoQuality` writes the slot; `segment-loader` plans the buffer ops. Loader replan happens naturally via `loadAudioSegments` reactivity to `selectedAudioTrackId`. | **Implemented** — language-predicate today (covers multi-language audio + text language switching; video ABR is unaffected because video tracks have no language). Cross-codec switching (e.g., AAC → AC-3) is a separate predicate handled by 5.1-surround-selection (DWIM — see Stage 2 below) |
| **Tier 2 — A/V sync during switch** | Flush range is "next segment boundary at/after playhead." Current segment plays through; new rendition starts at boundary. | **Implemented (starting point)** — area for improvement: smoother sync via pause / silence-pad alternatives. Stage 2 lifts the predicate / strategy to a per-actor config (see Open questions) |
| **Tier 2 — Persistence** | Remember user's last audio-track choice across sources or sessions. | **Deferred** — policy on top of API, not core to feature mechanism. Future work |

## What's in scope vs out of scope

**In scope (implemented):**
- All Tier 1 and Tier 2 phases above except persistence
- HLS spec compliance for `EXT-X-MEDIA:TYPE=AUDIO` rendition handling
- VoD content

**Out of scope (separate candidate features):**
- **[audio-abr](./audio-abr.md)** *(documented; not implemented)* — bandwidth-driven switching within an audio rendition group. The slot writer `switchAudioQuality` will replace `selectAudioTrack` when audio-abr ships, mirroring video's `selectVideoTrack` / `switchVideoQuality` precedent. `userAudioTrackSelection` filter shape is shared between this feature and audio-abr (single slot serves both bitrate-pinning and language-pinning, per audio-abr's open question pending resolution).
- **[5.1-surround-selection](./5.1-surround-selection.md)** *(coarse, not yet documented)* — capability-gated codec selection for audio. Layers on top of multi-language-audio's rendition surfacing. Owns codec-change switching (cross-codec `changeType()` or buffer recreation).
- **[audio-only-mode-override](../use-cases/audio-only-mode-override.md)** *(use case; Phase 2 partial — this feature composes in as Phase 2 constituent)* — engine variant for audio-only delivery. Different composition concern.

**Out of scope (different architectural layer):**
- **DOM `HTMLMediaElement.audioTracks` exposure** — mirroring `selectedAudioTrackId` into `HTMLMediaElement.audioTracks` is not an SPF concern. Adapter / above-the-engine layer may implement.
- **Persistence** — deferred. See *Phases of complexity*.

## Likely cross-cutting impact

Resolved during implementation:

- **Track registry primitive** — no extraction. The audio multi-writer pattern (Tier 2 programmatic) uses **constraint+filter** (single slot writer, `userAudioTrackSelection` is consumer intent), not multi-writer. `selectedAudioTrackId` stays single-writer. Premature to extract a shared abstraction at 2 data points (text + audio); text uses multi-writer-with-intent (different shape).
- **`resolveAudioTrack` re-resolution** — no extension needed. `setupTrackResolution`'s `'presentation-resolved'` state effect reads `selectedAudioTrackId` reactively; mid-stream switch fires the effect, scheduling a fetch task for the new track. Source-identity state-exit cleanup cancels stale tasks via `runner.abortAll`.
- **Audio buffer flush placement** — lives at the **`segment-loader` actor's `planTasks`** (between `SegmentLoaderActor` "what to load" and `SourceBufferActor` "remove / append" intelligence), NOT in `switchAudioTrack` (slot owner) or in `setupAudioBufferActors` (actor lifecycle). Same split as the video pipeline: `switchVideoQuality` writes the slot; `segment-loader`'s `planTasks` decides flush + init + segments. For audio, `planTasks` compares `actorCtx.initTrackLanguage` (captured from `append-init` meta) to the new `track.language` — on mismatch, emits a `remove` task spanning next-segment-boundary → Infinity ahead of init / segment tasks. Predicate is **inline today** (language-change). Stage 2 lifts it to a per-actor config (`flushPredicate?` or `flushStrategy?` at `createSegmentLoaderActor` time) for cross-codec, viewport-driven, and other variants.
- **`SourceBufferActor.context` extended with `initTrackLanguage`** — captured from `AppendInitMessage.meta.language` on each `append-init` commit. The downstream consumer is `segment-loader`'s `planTasks`.
- **`loadAudioSegments` replan** — no change needed. Already reactive to `selectedAudioTrackId` via segment loader actor's internal effect.
- **Manifest parser** — already surfaces all needed per-track metadata (verified via existing `audio-playback` Phase 1).

## Open questions

- **Stage 2: pluggable flush predicate / strategy.** Stage 1 inlines the language-change predicate in `segment-loader`'s `planTasks`. Stage 2 lifts it to a per-actor config at `createSegmentLoaderActor` time. Shape options:
  - `flushPredicate?: (prev: BufferedTrackMeta, next: Track) => boolean` — simplest; per-loader policy decision.
  - `flushStrategy?: { predicate, range }` — separate decision-of-whether and decision-of-where.
  - A/V sync policy alternatives (pause-then-resume, silence-pad) — currently next-segment-boundary is hardcoded.
  - Codec-change branching when 5.1-surround-selection lands (different predicate; `changeType()`-aware range).
- **Persistence model.** When implemented: localStorage / cookie / consumer-supplied storage? Across-source preservation rules? Likely adapter-layer, not engine.
- **`userAudioTrackSelection` slot sharing with `switchAudioQuality`.** When audio-abr lands, does the slot serve both language-pinning and bitrate-pinning (video's pattern) or do they split? Resolution deferred to audio-abr implementation.

## Resolved during this phase's implementation

- **A/V sync policy** — chose **next-segment-boundary** as starting point (smoother than playhead-forward flush; cheaper than pause / silence-pad). Stage 2 will lift this to a configurable strategy.
- **Programmatic write path** — chose **constraint+filter via `userAudioTrackSelection`** over direct multi-writer write to `selectedAudioTrackId`. Aligns with video's `userVideoTrackSelection` precedent; preserves audio-abr's path to introducing `switchAudioQuality` as the slot owner.
- **Mid-stream flush placement** — flush logic lives in **`segment-loader`'s `planTasks`** (between actor planning and source-buffer execution), NOT in `switchAudioTrack` (slot owner) or `setupAudioBufferActors` (actor lifecycle). This mirrors the video pipeline's split: slot owner writes; loader decides remove / init / segment plan. Two earlier iterations bolted flush onto the wrong host: first `setupAudioBufferActors` (lifecycle violation), then `switchAudioTrack` (blended selection + flush). The final placement keeps `switchAudioTrack` purely a selection-ownership behavior and concentrates buffer-orchestration knowledge in the segment-loader where init / append / remove already get planned together.
- **Flush predicate** — Stage 1 inline check: `actorCtx.initTrackLanguage !== track.language`. Naturally covers audio language switching AND text language switching; video ABR is unaffected (video tracks have no language). Stage 2 lifts to a per-actor predicate / strategy config at `createSegmentLoaderActor` time so cross-codec (5.1 surround), per-channel-count, and other cross-rendition shapes can plug in without modifying `planTasks`.
- **Abstraction shape for `switchAudioTrack`** — chose to **mirror `switchVideoQuality`'s abstraction shape** (separate helper `setupAudioTrackSwitching`, same generic-parameter pattern over selection key + user-selection key + track type, same `getTracks` / `selectOptimal` / `picker` config points) rather than (a) reusing `setupQualitySwitching` directly or (b) shipping an ad-hoc audio-specific structure. The mirrored shape sets up the convergence path: when audio-abr ships, the two helpers either merge (shared generics with optional bandwidth) or stay parallel with minimal divergence. Audio's `selectOptimal` is `selectAudioCurrent` (pin-to-current); audio-abr swaps it for a bandwidth-driven variant matching the video signature.
- **Track-registry primitive extraction** — chose **defer**. Two data points (text + audio) with different multi-writer shapes don't justify extraction yet.

## Implementation surface

**Composition:** `packages/spf/src/playback/engines/hls/engine.ts` (default) + `packages/spf/src/playback/engines/hls/engine-audio-only.ts` (variant). Both replace `selectAudioTrack` with `switchAudioTrack` to get filter reactivity + mid-stream flush; engines that want only default-pick-on-load (test setups, future variants) keep composing `selectAudioTrack` (it remains exported, mutually exclusive with `switchAudioTrack`).

**Behaviors:**

| Behavior / Actor | File | Responsibility |
|---|---|---|
| `switchAudioTrack` *(new behavior)* | `packages/spf/src/playback/behaviors/track-switching.ts` | **Slot owner for `selectedAudioTrackId`**, filter-reactive (consumes `userAudioTrackSelection`). Single effect in `'presentation-resolved'` that mirrors `switchVideoQuality`'s pattern: filter narrow → single-candidate short-circuit → initial picker → `selectOptimal`. Uses helper `setupAudioTrackSwitching` whose abstraction shape parallels `setupQualitySwitching` (generic over selection key + user-selection key + track type + `getTracks` + `selectOptimal` + `picker`). Pure selection ownership; no flush concern. Path to `switchAudioQuality`: audio-abr Phase 3 swaps `selectAudioCurrent` (pin-to-current) for a bandwidth-driven `selectOptimal` |
| `segment-loader` actor `planTasks` *(extended)* | `packages/spf/src/playback/actors/dom/segment-loader.ts` | Already handled init / append / forward+back-flush task planning. **New Stage-1 predicate**: when `actorCtx.initTrackId !== track.id` AND `actorCtx.initTrackLanguage !== track.language`, emits a `{ type: 'remove', start: nextBoundary, end: Infinity }` task at the front of the task list (before `append-init` + `append-segment`). Generic enough to cover audio-language and text-language switches; video ABR doesn't trigger it (no language attribute). Includes `language` in the emitted `append-init` meta so downstream tracking can compare next switch |
| `SourceBufferActor` *(extended)* | `packages/spf/src/playback/actors/dom/source-buffer.ts` | Context now tracks `initTrackLanguage?` alongside `initTrackId`. Captured from `AppendInitMessage.meta.language` on commit; read by `segment-loader`'s `planTasks` to detect cross-language switches |
| `selectAudioTrack` *(unchanged purpose)* | `packages/spf/src/playback/behaviors/select-tracks.ts` | Lifecycle-only default selection on `presentation-resolved` entry; clears on src unload. Uses `pickAudioTrack` (3-tier) as default picker. Mutually exclusive with `switchAudioTrack` — engines compose one or the other |
| `setupAudioBufferActors` *(unchanged)* | `packages/spf/src/playback/behaviors/dom/setup-buffer-actors.ts` | Per-source audio `SourceBufferActor` + `SegmentLoaderActor` lifecycle |

**State slots:**

- `selectedAudioTrackId` — single-writer (`switchAudioTrack` when composed; `selectAudioTrack` when the lighter variant is composed instead — they're mutually exclusive). Constraint+filter pattern keeps writer count at 1; intent flows through `userAudioTrackSelection`.
- `userAudioTrackSelection` — new slot in the `hls/video` engine's `EngineState` + the `hls/audio` engine's `EngineState`. `Partial<AudioTrack>` shape. Single-writer (external consumer through the adapter; declared with `defineExternalSignals`). Read by `switchAudioTrack`.

**Actor state:**

- `SourceBufferActorContext.initTrackLanguage` — new field; captured from `AppendInitMessage.meta.language` on commit. Read by `segment-loader`'s `planTasks`.
- `AppendInitMessage.meta.language` — new field on the message type. Carries language from `planTasks` (which reads `track.language`) to the source-buffer actor.

**Helpers:**

| Helper | File | Status |
|---|---|---|
| `setupAudioTrackSwitching` *(new)* | `packages/spf/src/playback/behaviors/track-switching.ts` | Filter-reactive slot-management reactor. Mirrors `setupQualitySwitching`'s abstraction shape (generic over selection key + user-selection key + track type, with `getTracks` / `selectOptimal` / `picker` config). Today's audio-only consumer is `switchAudioTrack`; when audio-abr ships, `switchAudioQuality` either swaps its `selectOptimal` for a bandwidth-aware variant or the two helpers merge into a shared `setupQualitySwitching` |
| `pickAudioTrack` | `packages/spf/src/media/primitives/select-tracks.ts` | **Now wired** as the default picker in both `selectAudioTrack` and `switchAudioTrack` (was inert; required custom-picker override before this feature) |

**Composition wiring:** Both engine factories swap `selectAudioTrack` for `switchAudioTrack` in their behavior list. Engine state types in both `engine.ts` and `engine-audio-only.ts` gain `userAudioTrackSelection`.

## Verification

**Unit tests** (`packages/spf/src/playback/behaviors/tests/select-tracks.test.ts` — `selectAudioTrack` describe block, lifecycle-only variant):

- `picks track matching preferredAudioLanguage when supplied` — Tier 1 default selection via language preference
- `falls back to DEFAULT=YES track when preferredAudioLanguage does not match` — Tier 1 second-tier fallback
- `falls back to first track when no language preference and no DEFAULT track` — Tier 1 final fallback

**Unit tests** (`packages/spf/src/playback/behaviors/tests/track-switching.test.ts` — slot-owner variant; Tier 2):

- *Selection lifecycle:*
  - `selects the first audio track when no preference or filter`
  - `picks track matching preferredAudioLanguage when supplied`
  - `clears selectedAudioTrackId on src unload`
- *Filter reactivity (`userAudioTrackSelection`):*
  - `narrows candidates by filter (language)` — Tier 2 programmatic write
  - `re-picks on filter change mid-presentation` — Tier 2 reactive re-pick
  - `filter narrowing to a single track short-circuits the picker` — single-candidate short-circuit
  - `empty filter result falls back to unfiltered candidate set` — graceful no-match fallback

**Unit tests** (`packages/spf/src/playback/actors/dom/tests/segment-loader.test.ts` — cross-rendition flush predicate):

- `dispatches \`remove\` from next segment boundary on audio language switch`
- `does not dispatch cross-rendition flush when languages match (audio-abr-style switch)`
- `does not dispatch cross-rendition flush on initial load (no prior initTrackId)`
- `captures language into append-init meta for downstream tracking`

**Unit tests** (`packages/spf/src/playback/actors/dom/tests/source-buffer.test.ts` — language tracking):

- `captures initTrackLanguage from append-init meta for downstream cross-rendition flush detection`
- `leaves initTrackLanguage undefined when append-init meta omits language (video)`

**Unit tests** (`packages/spf/src/playback/engines/hls/tests/engine-audio-only.test.ts`):

- `exposes userAudioTrackSelection slot for multi-language-audio Tier 2 writes` — variant engine state exposes the filter slot

**Out of scope / deferred:**

- End-to-end mid-stream-switch verification (browser-level rendition switching) deferred to manual sandbox / E2E pass once a multi-language test source is available.
- Persistence — not implemented; no test coverage.
- A/V sync policy alternatives (pause / silence-pad) — not implemented.

## Related features

- **[audio-playback](./audio-playback.md)** — single-rendition baseline this feature extends. The "Language-aware default selection" gap there is now resolved.
- **[subtitles](./subtitles.md)** — now the same shape as audio: text selection moved onto the track-switching chain (`switchTextTrack`) with a `userTextTrackSelection` constraint+filter, converging on this feature's `userAudioTrackSelection` pattern. (Text adds an `'off'`/opt-in terminal and resolves the former `selectedTextTrackId` multi-writer to a single-writer output, with the DOM `change` bridge writing intent instead.)
- **[video-abr](./video-abr.md)** — `userVideoTrackSelection` constraint+filter precedent. Same shape as audio's new `userAudioTrackSelection` slot.
- **[audio-abr](./audio-abr.md)** *(documented; pending implementation)* — destination-architecture sibling. When implemented, `switchAudioQuality` will replace `selectAudioTrack` as the `selectedAudioTrackId` writer; `userAudioTrackSelection` filter shape carries over.
- **[5.1-surround-selection](./5.1-surround-selection.md)** *(coarse, not yet documented, candidate)* — codec-change extension. Tier 2 mid-stream flush is designed extensible to codec-change routing.
- **[mse-mms-pipeline](./mse-mms-pipeline.md)** — owns the audio `SourceBufferActor` and the `remove` / `flushBuffer` primitives that mid-stream flush builds on.
- **[buffer-management](./buffer-management.md)** — audio segment loading already replans on `selectedAudioTrackId` change via natural reactivity; no extension needed.
- **[audio-only-mode-override](../use-cases/audio-only-mode-override.md)** *(use case; Phase 2 partial)* — this feature composes in for multi-language audio selection within the audio-only variant.

## Use cases that compose this feature

- **[`audio-only-mode-override`](../use-cases/audio-only-mode-override.md)** *(Phase 2 partial — landed with this feature)* — variant engine `hls/audio` exposes `userAudioTrackSelection` and composes the filter-reactive `selectAudioTrack` + flush-aware `setupAudioBufferActors` unchanged from the default engine.

## See also

- [subtitles.md](./subtitles.md) — closest selection-shape analog
- [video-abr.md](./video-abr.md) — `userVideoTrackSelection` constraint+filter precedent
- [audio-abr.md](./audio-abr.md) — destination-architecture sibling for `selectedAudioTrackId`
- [conventions/signals.md](../conventions/signals.md) — multi-writer slot conventions
- [conventions/behaviors.md](../conventions/behaviors.md) — per-type specialization
- [packages/spf/src/playback/behaviors/select-tracks.ts](../../../../packages/spf/src/playback/behaviors/select-tracks.ts) — `selectAudioTrack` (lifecycle-only variant)
- [packages/spf/src/playback/behaviors/track-switching.ts](../../../../packages/spf/src/playback/behaviors/track-switching.ts) — `switchAudioTrack` (slot owner with filter reactivity) + `setupAudioTrackSwitching` helper (mirrors `setupQualitySwitching`'s shape)
- [packages/spf/src/playback/actors/dom/segment-loader.ts](../../../../packages/spf/src/playback/actors/dom/segment-loader.ts) — `planTasks` cross-rendition flush predicate (Stage 1: language-change inline)
- [packages/spf/src/playback/actors/dom/source-buffer.ts](../../../../packages/spf/src/playback/actors/dom/source-buffer.ts) — `initTrackLanguage` context field + `AppendInitMessage.meta.language`
