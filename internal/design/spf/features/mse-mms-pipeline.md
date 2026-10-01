---
status: implemented
date: 2026-05-20
definition: sketched
---

# MSE / MMS pipeline

The lifecycle that makes a `MediaSource` a valid driver of the
`HTMLMediaElement`: create + attach the MediaSource, set up per-type
SourceBuffers wrapped in actors, propagate presentation duration, and
coordinate `endOfStream()` once playback reaches the appended tail. Spans
both standard `MediaSource` and Safari's `ManagedMediaSource`.

This doc captures the **capability surface**: what works, what doesn't,
which behaviors / actors / helpers implement it, and how it relates to
other features. Segment loading orchestration and buffer flushing are
sibling features — this one ends at the lifecycle boundary, not at "data
appears in the buffer."

## Status

- **Composition:** The `hls/video` engine (HLS VoD)
- **Definition depth:** sketched — capability surface and implementation
  footprint documented; `MediaSourceActor` factoring is an open
  follow-up tracked under sibling candidates. Audio SourceBuffer flush
  orchestration is part of [multi-language-audio](./multi-language-audio.md)'s
  Tier 2 mid-stream-switching phase, not a separately-scoped feature

## Phases of complexity

What's implemented today, organized as platform / capability slices. Each
row is a slice that could in principle stand alone; in practice they
share the same four behaviors and one actor.

| Phase | What | Notes |
|---|---|---|
| MediaSource attach / detach lifecycle | Create `MediaSource`, attach to element, await `'open'`, publish on `context.mediaSource`; detach + clear on source reset | `setupMediaSource` rides `resolvePresentation`'s resolved/unresolved transitions for source resets — direct URL replacement is structural, not a special case |
| Per-type SourceBuffer + actor setup | One `SourceBuffer` per type (CMAF A+V), each wrapped in `SourceBufferActor` + `SegmentLoaderActor`; gates only on that type's selection + codecs | `setupVideoBufferActors` / `setupAudioBufferActors` share `setupBufferActors`. The behaviors are decoupled — no cross-type coupling in `stateKeys` |
| Firefox `mozHasAudio` cross-type invariant | Both `addSourceBuffer` calls land in the same `runPending` iteration so the video buffer exists by the time any append begins | Preserves Firefox's permanent-`mozHasAudio=false` guard. Carried by SPF effect coalescing + composition order (video registered before audio in the engine). Sandbox repro at `apps/sandbox/src/firefox-mse-repro/` |
| ManagedMediaSource (Safari) | `preferManaged: true` → MMS via `srcObject` + `disableRemotePlayback`; standard MSE via `createObjectURL` otherwise | Same lifecycle shape, different attach surface. `preferManaged` is hardcoded `true` today (no config knob) |
| Initial `mediaSource.duration` write | Write `presentation.duration` to `mediaSource.duration` exactly once per MediaSource, gated on MS open + sourceBuffers idle + clamp ≥ `getMaxBufferedEnd` | `updateMediaSourceDuration`; idempotent — leaves any non-NaN value alone. `Infinity` supported for live |
| End-of-stream coordination | Call `mediaSource.endOfStream()` once every active actor's currently-loading track has its last segment appended + the playhead reaches that segment; re-arm on each `open → ended → open` cycle | `endOfStream`; sets final duration from `getMaxBufferedEnd` first to keep the value deterministic against CMAF timestamp drift |

## What's not implemented

- **Mid-stream same-codec buffer flush orchestration** — `SourceBufferActor`
  accepts `remove` messages and `flushBuffer` exists in `media/dom/mse/`,
  but no SPF behavior drives flushing on language switch or other
  mid-stream cleanup. Belongs to [multi-language-audio](./multi-language-audio.md)'s
  Tier 2 mid-stream-switching phase, which orchestrates flush on top
  of this feature's `remove`-message + `flushBuffer` primitives.
- **`changeType()` codec-change switching** — cross-tick mid-stream track
  switch after appends begin is "out of scope for this behavior" per
  `setup-buffer-actors.ts`. Routes to `[5.1-surround-selection]` and
  `[hevc-variant-selection]` (where the codec change motivates the
  buffer-recreation or `changeType` path).
- **`MediaSourceActor` abstraction** — `endOfStream` and
  `updateMediaSourceDuration` both subscribe to readyState via
  `onMediaSourceReadyStateChange` + a behavior-local signal; both wait
  for buffers idle. A `MediaSourceActor` whose snapshot exposes
  `readyState` + accepts `duration-write` / `end-of-stream` /
  `add-source-buffer` messages would coalesce these call sites. Hinted at
  in both behaviors' JSDoc.
- **`preferManaged` opt-out** — hardcoded `true`. No engine config to
  force standard MSE on Safari (for testing parity or debugging).
- **Continuous live-duration sync** — `Infinity` is supported on the
  initial write, but `updateMediaSourceDuration`'s "exactly once"
  contract doesn't re-sync if `presentation.duration` drifts mid-source.
  Likely fine for live (one continuous `Infinity`), but
  [live-stream-support](./live-stream-support.md) may surface
  counterexamples.
- **`setLiveSeekableRange` / `clearLiveSeekableRange`** — neither is
  called today. Live streams under `duration === Infinity` have an
  empty `HTMLMediaElement.seekable` without the explicit setter.
  Belongs to [live-stream-support](./live-stream-support.md)'s Live
  edge tracking + Terminated state transition phases; lives at this
  feature's MSE boundary.

## Implementation surface

**Composition:** `packages/spf/src/playback/engines/hls/engine.ts` — MSE
behaviors composed between presentation duration calculation and segment
loading. Video buffer setup registered before audio for the Firefox
invariant.

**Behaviors:**

| Behavior | File | Responsibility |
|---|---|---|
| `setupMediaSource` | `packages/spf/src/playback/behaviors/dom/setup-mediasource.ts` | Create + attach MediaSource, await `'open'`, publish; detach + clear on source reset |
| `setupVideoBufferActors` | `packages/spf/src/playback/behaviors/dom/setup-buffer-actors.ts` | Per-type video buffer + actor setup; sole writer of `bandwidthState` via `createTrackedFetch` |
| `setupAudioBufferActors` | `packages/spf/src/playback/behaviors/dom/setup-buffer-actors.ts` | Per-type audio buffer + actor setup; uses plain `fetchStream` (no bandwidth sampling today) |
| `updateMediaSourceDuration` | `packages/spf/src/playback/behaviors/dom/update-mediasource-duration.ts` | Write `mediaSource.duration = presentation.duration` once per MS, gated on MS open + buffers idle + spec clamp |
| `endOfStream` | `packages/spf/src/playback/behaviors/dom/end-of-stream.ts` | Drive each `open → ended` transition once last segments + playhead align; re-arm on cycles |

**Actor:**

| Actor | File | Role |
|---|---|---|
| `SourceBufferActor` | `packages/spf/src/playback/actors/dom/source-buffer.ts` | Serializes `append-init` / `append-segment` / `remove` / `batch` / `cancel` via `SerialRunner` on a single `SourceBuffer`; snapshot exposes `'idle'` / `'updating'` for downstream gating (canonical idle gate for `endOfStream`) |

**DOM-bound helpers:** `packages/spf/src/media/dom/mse/`

| Module | Role |
|---|---|
| `mediasource-setup.ts` | `createMediaSource({ preferManaged })`, `attachMediaSource` (MMS `srcObject` + `disableRemotePlayback` / MSE `createObjectURL` branch), `createSourceBuffer`, `buildMimeCodec`, `isCodecSupported`, `onMediaSourceReadyStateChange`, `waitForMediaSourceOpen`, `supportsMediaSource`, `supportsManagedMediaSource` |
| `append-segment.ts` | `appendSegment` — ArrayBuffer + streaming append primitive (used by `SourceBufferActor`'s append tasks) |
| `buffer-flusher.ts` | `flushBuffer` — range removal primitive (used by `SourceBufferActor`'s `remove` task; [multi-language-audio](./multi-language-audio.md)'s Tier 2 mid-stream-switching phase consumes via the actor message, not directly) |
| `duration.ts` | `shouldUpdateDuration`, `waitForSourceBuffersReady`, `getMaxBufferedEnd` (spec-clamp helper) |
| `end-of-stream.ts` | `isLastSegmentAppended` predicate |
| `mediasource.d.ts` | `ManagedMediaSource` global type augmentation (Safari-only API, not in standard DOM lib) |

**State slots — reads only.** Every MSE behavior has read-only state
signatures. Engine state flows in; DOM mutations flow out.

- Reads: `presentation` (all four behaviors), `currentTime` (`endOfStream`),
  `selectedVideoTrackId` (`setupVideoBufferActors`), `selectedAudioTrackId`
  (`setupAudioBufferActors`)

**Context slots:**

- `context.mediaSource` — sole writer `setupMediaSource`. Readers:
  `setupVideoBufferActors`, `setupAudioBufferActors`,
  `updateMediaSourceDuration`, `endOfStream`, `loadVideoSegments`,
  `loadAudioSegments`.
- `context.videoBufferActor` + `context.videoSegmentLoaderActor` — sole
  writer `setupVideoBufferActors`. Readers: `loadVideoSegments`,
  `endOfStream`.
- `context.audioBufferActor` + `context.audioSegmentLoaderActor` — sole
  writer `setupAudioBufferActors`. Readers: `loadAudioSegments`,
  `endOfStream`.

**DOM-property multi-writer.** `mediaSource.duration` is written by both
`updateMediaSourceDuration` (initial, once-per-MS while NaN) and
`endOfStream` (final, from `getMaxBufferedEnd` before EOS). Decision
domains are non-overlapping — `updateMediaSourceDuration`'s idempotency
on non-NaN keeps it out of the EOS path. Not a state-signal multi-writer;
the convention from `conventions/signals.md` doesn't apply directly.

## Config surface

This feature has essentially no engine-level config surface today —
behaviors read `presentation` for codecs + duration and operate on
context-published resources, with no tuning knobs of their own.
`preferManaged: true` is hardcoded in `setupMediaSource`. Related
engine config (`forwardBuffer`, `backBuffer`, `bandwidth`, `quality`)
flows through `setupVideoBufferActors`'s SegmentLoaderActor construction
but belongs to `buffer-management` (`forwardBuffer` / `backBuffer`) and
`video-abr` (`bandwidth` / `quality`) respectively.

## Verification

- **Unit tests:**
  - `packages/spf/src/playback/behaviors/dom/tests/setup-mediasource.test.ts`
  - `packages/spf/src/playback/behaviors/dom/tests/setup-buffer-actors.test.ts`
  - `packages/spf/src/playback/behaviors/dom/tests/update-mediasource-duration.test.ts`
  - `packages/spf/src/playback/behaviors/dom/tests/end-of-stream.test.ts`
  - `packages/spf/src/playback/actors/dom/tests/source-buffer.test.ts`
  - `packages/spf/src/media/dom/mse/tests/*` — helper-level coverage
    (MS/MMS detection, attach branch, duration helpers, EOS predicate)
- **Sandbox:**
  - `apps/sandbox/src/spf-segment-loading/` — main SPF MSE pipeline
    demo; exercises full lifecycle end-to-end
  - `apps/sandbox/src/firefox-mse-repro/` — Firefox `mozHasAudio`
    invariant repro; load-bearing for verifying composition order +
    `runPending` semantics survive future refactors
  - `apps/sandbox/src/hls-video-html/` / `hls-video-react/` — engine
    integration through the adapter layer

## Open questions

- **`MediaSourceActor`?** Both `endOfStream` and
  `updateMediaSourceDuration` carry behavior-local `msIsOpen` mirrors and
  buffers-idle waits. An actor that owns the MediaSource (snapshot for
  `readyState`; messages for `duration-write` / `end-of-stream` /
  `add-source-buffer`) would coalesce three call sites and prepare for a
  future loop-mode (auto-fetch earlier segments mid-`ended`) where MS and
  SourceBuffer coordination grows. Hinted at in both behaviors' JSDoc.
- **`preferManaged` as config.** Should there be an engine-level opt-out
  for testing standard MSE on Safari, or remain hardcoded?
- **Two-fire `endOfStream()` on mid-end ABR switches.** Accepted today
  as the price of dropping `selectedTrackId` dependence in
  `endOfStream`. Worth flagging if it ever surfaces downstream issues
  (e.g., spurious `ended` events on the element between the two fires).

## Related features

- **preload-modes** — gates this feature indirectly. `setupMediaSource`
  rides `resolvePresentation`'s resolved/unresolved transitions, which
  only flip to resolved once the preload gate (`preload !== 'none'` or
  `loadActivated`) is open.
- **capability-probing** *(candidate)* — owns the upstream codec
  filtering that would prevent `createSourceBuffer`'s late-failure
  throw from firing in practice. Today's `isCodecSupported` helper is
  the seed primitive; capability-probing wraps it into a uniform
  surface and adds multivariant-level filtering before selection.
- **source-replacement** — the resolved/unresolved lifecycle
  `setupMediaSource` rides is the canonical mechanism for in-place
  source replacement. Detach-on-state-exit is what makes URL changes
  work without recreating the engine.
- **subtitles** — text tracks share the per-type segment-loading FSM
  but do **not** touch MSE (no SourceBuffer for text); cleanly separated
  by `media/dom/mse/` not appearing in the text path.
- **video-abr** — `setupVideoBufferActors` is the sample producer
  (`createTrackedFetch` writes `bandwidthState`); ABR consumes. Sampling
  lives here, selection lives there.
- **multi-language-audio** — its Tier 2 "audio SourceBuffer flush on
  switch" orchestrates flush on top of this feature's `remove`-message
  + `flushBuffer` primitives. The orchestration belongs in
  multi-language-audio (not a separately-scoped buffer-flushing
  feature).
- **buffer-management** — sibling feature for the per-type load-FSM
  and segment planning that runs *on top of* the buffers + actors this
  feature stands up. Sends `append-init` / `append-segment` / `remove`
  / `cancel` messages to the `SourceBufferActor` documented here.
- **5.1-surround-selection** *(not yet documented, candidate)* —
  cross-codec switching via `changeType()`; out of scope for this
  feature's same-codec lifecycle.
- **hevc-variant-selection** *(not yet documented, candidate)* —
  same pattern as 5.1 but for video codec swap.
- **live-stream-support** — `Infinity` duration + the EOS picture
  differ; the "exactly once" duration contract is the spot to revisit.
  Also the home for the `setLiveSeekableRange` / `clearLiveSeekableRange`
  DOM-exposure surface (see *What's not implemented* above).
- **drm-support** *(not yet documented, candidate, issue #1411)* —
  key-system readiness would gate MSE setup + append per `clusters.md`.

## Use cases that compose this feature

- **[`audio-only-mode-override`](../use-cases/audio-only-mode-override.md)**
  *(partial — Phase 1 landed)* — Phase 1 baseline constituent. Used
  as-is — `MediaSource` + `endOfStream` gate compose unchanged across
  variants per the uniform-across-tracks discipline (`endOfStream`
  reads `mediaSource.sourceBuffers` aggregately). Verified end-to-end
  in `engine-audio-only.test.ts` against both audio-only and mixed-AV
  manifests.
- **[`video-only-mode-override`](../use-cases/video-only-mode-override.md)**
  *(coarse)* — Phase 1 baseline constituent. Used as-is; the
  Firefox `mozHasAudio` cross-type invariant documented here is
  more pointedly relevant — the variant must produce
  `mozHasAudio=false` cleanly under subtractive-audio composition.
  Phase 1 includes empirical verification.

## See also

- [presentation-modeling.md](../presentation-modeling.md) — architectural
  deep-dive on the format-neutral data shape and per-track resolution
  layer; setup behaviors here gate on `isResolvedPresentation` from
  that layer
- [text-track-architecture.md](../text-track-architecture.md) — peer
  architectural deep-dive (different domain, same SPF shape)
- [packages/spf/docs/hls-engine.md](../../../../packages/spf/docs/hls-engine.md)
  — full engine composition walkthrough (Stage 5: MSE setup; Stage 8:
  end-of-stream)
- [conventions/behaviors.md](../conventions/behaviors.md) — per-type
  specialization details
- [conventions/signals.md](../conventions/signals.md) — multi-writer
  slot conventions (relevant for `mediaSource.duration` as a non-signal
  multi-writer footnote)
