---
status: implemented
date: 2026-05-20
definition: sketched
---

# Buffer management

The engine's segment-level buffer policy: deciding which segments to
load, which to evict, how to handle the buffered ranges during seeks
and quality switches. Covers the per-type segment-loader actors that
plan and execute fetches, the forward-buffer / back-buffer policy
primitives, and the dispatcher behaviors that turn gate state +
currentTime + selected tracks into `load` messages.

Sits between `preload-modes` (produces the gate state this feature
consumes) and `mse-mms-pipeline` (owns the `SourceBufferActor` this
feature's operations land on).

This doc captures the **capability surface**: what works, what doesn't,
which behaviors / actors / primitives implement it, and how
seek + playback-rate behavior emerges from the planner's design.

## Status

- **Composition:** The `hls/video` engine (HLS VoD)
- **Definition depth:** sketched — capability surface and implementation
  footprint documented; richer forward-buffer / back-buffer policies and
  the codec-change extension (`changeType()`) are tracked as candidates

## Phases of complexity

What's implemented today, organized as capability slices around the
engine's buffer policy. Phases are non-orthogonal in places — seek
handling depends on forward-flush; quality-aware planning depends on
the in-flight tracking — but each row is a slice that earns its place.

| Phase | What | Notes |
|---|---|---|
| Forward-buffer planning | Engine maintains ~30 seconds ahead of the playhead via `getSegmentsToLoad`. Re-plans on segment-boundary crossings (debounced via `segmentStartForTime` — within-segment `currentTime` ticks don't trigger re-planning). Configurable via `forwardBuffer.bufferDuration` | Default 30 s; threaded through both dispatcher (range calc) and actor (planner) |
| Back-buffer eviction | Engine evicts older buffered ranges, keeping `keepSegments` behind the playhead. Bounded memory regardless of session length | Default `keepSegments: 2`; v/a actor only — text-track loader doesn't evict |
| Quality-aware buffer planning | Skip re-loading a segment if equal-or-higher-quality content is already buffered at the same time slot. Compares `trackBandwidth` on actor-tracked segments | Preserves buffered high-quality content during ABR downgrade; replans on upgrade |
| Seek handling | Non-contiguous buffer planning (gap-filling for the `[currentTime, currentTime + bufferDuration)` window) + forward-flush after seek-back. The forward-flush prevents unbounded scattered buffer that can cause `QuotaExceededError` on long-form content | Works because the planner is currentTime-driven and operates over actor-tracked buffered segments rather than `SourceBuffer.buffered` ranges directly |
| In-flight continue / preempt | New `load` message during `'loading'` — if the in-flight segment / init is still needed by the new plan (same track + same id), continue (`abortPending` + schedule remainder); otherwise preempt (`abortAll` + cancel SourceBuffer if needed + replan) | Driven by `inFlightInitTrackId` + `inFlightSegmentId` in actor context; the SourceBuffer cancel is conditional to avoid clobbering an init append that's still needed |
| Streaming append for media segments | Media segment body stream passed to `SourceBufferActor` as it arrives — chunks appended in flight. Init segments accumulate fully before append (`minChunkSize: Infinity`) | Affects time-to-first-frame for the first segment; init must land complete before media-segment chunks can be parsed |
| Per-type segment loading | Video / audio / text dispatcher variants share `setupSegmentLoading` helper + (`preload`, `loadActivated`) → FSM mapping. V/A share `SegmentLoaderActor`; text uses `TextTrackSegmentLoaderActor` (no MSE buffer, no codec, no append distinction) | Cross-type constraint: all three variants honor the same gate FSM, so preload behavior is uniform across rendition types |
| Playback rate | `playbackRate ≠ 1` works (the engine doesn't break) but the forward buffer is not rate-aware — 30 s of media at 2× rate is 15 s of wall-time runway | Today: basic. Consumers can manually override `forwardBuffer.bufferDuration` for higher rates; engine-side adaptation is open work — see *Smarter forward-buffer sizing* below |

## What's not implemented

Today's policy choices are simple-by-design; richer policies are tracked
here as candidate phases. The list will grow as motivating use cases
surface.

- **Smarter forward-buffer sizing** — fixed `bufferDuration` regardless
  of context. Three known motivations for a richer policy:
  - **Playback-rate-aware** — at 2× rate, 30 s of media is 15 s of
    wall-time runway; at 0.5× rate, 60 s (wasteful).
  - **`canplaythrough`-equivalent** — bigger buffer when network
    throughput is high enough to "playthrough to end without rebuffer."
    Mirrors HTMLMediaElement's `canplaythrough` event semantics.
  - **Network-conditions / seek-density-aware** — longer runway on slow
    networks; shorter runway during heavy seeking.
  Each variant is a candidate phase row when implemented.

- **Smarter back-buffer eviction** — fixed `keepSegments` proactive
  policy today. Alternative shapes to track:
  - **Quota-learning eviction** — record observed `QuotaExceededError`
    byte-thresholds and use them as a per-device ceiling for both
    eviction *and* forward-buffer fetching. Reference point:
    [mux-background-video's `evictBuffer`](https://github.com/muxinc/mux-background-video/blob/main/src/engines/hls-mini/mediasource.ts#L173-L183)
    catches the error and evicts past `currentTime - 5 s`, but doesn't
    remember the threshold for next time. A smarter variant would track
    total buffered bytes; if the error fires at 300 MB but didn't at
    299 MB, future planning keeps the buffer below ~300 MB proactively
    — both for back-buffer eviction and to constrain forward-buffer
    fetching at long `bufferDuration` / high bitrate.
  - **Time-based / size-based** — "keep N seconds" or "keep ≤ M MB"
    rather than segment count.

- **Loop-around buffer fetching for `loop=true`** — when the media
  element has `loop=true`, playback wraps from near-end back to 0. The
  planner today sees the wrap as a seek-back (gap-fill works) but
  doesn't *anticipate* it. A loop-aware policy would pre-fetch the
  beginning while still playing the end.

- **`changeType()` codec-change buffer transitions** — the planner's
  Case 1 (removes) deliberately does *not* fire on track switch
  ("appending new content overwrites existing buffer ranges, and the
  actor's time-aligned deduplication keeps the segment model accurate").
  Same-codec switches work; cross-codec switches don't.

- **Buffer health observability** — no surfaced state for "buffered
  ahead" / "back buffer used." Consumers compute from
  `SourceBuffer.buffered` + `state.currentTime` themselves.

## Implementation surface

**Composition:** each dispatcher is composed by its track's feature
(`videoFeature`, `audioFeature`, `textTracksFeature` in
`packages/spf/src/playback/engines/hls/features/`), after MSE setup.

The per-type segment-loader **actors** are owned by the MSE setup
behaviors (`setupVideoBufferActors` / `setupAudioBufferActors` /
`setupTextTrackActors`) — they're constructed there and published on
context for these dispatchers to read.

**Behaviors:**

| Behavior | File | Responsibility |
|---|---|---|
| `loadVideoSegments` / `loadAudioSegments` / `loadTextTrackSegments` | `packages/spf/src/playback/behaviors/dom/load-segments.ts` | Per-type dispatcher; shares `setupSegmentLoading` helper. 4-state FSM (`preconditions-unmet` / `dormant` / `metadata-only` / `full-range`) consumes `(preload, loadActivated)` from `preload-modes`. Sends `load` messages to the variant's loader actor |

**Actors:**

| Actor | File | Role |
|---|---|---|
| `SegmentLoaderActor` (v/a) | `packages/spf/src/playback/actors/dom/segment-loader.ts` | 3-state (`idle` / `loading` / `destroyed`). Planner produces ordered `LoadTask` list (Case 1 removes / Case 2 init / Case 3 segments). In-flight continue/preempt via `inFlightInitTrackId` + `inFlightSegmentId`. Owns the actual fetch + append-to-SourceBufferActor sequence |
| `TextTrackSegmentLoaderActor` | `packages/spf/src/playback/actors/text-track-segment-loader.ts` | Text-track variant satisfying the same `SegmentLoaderLike<Track>` contract for the dispatcher. Different actor shape (no SourceBuffer; appends to `TextTracksActor` cue cache instead) |

**Policy primitives (DOM-free):** `packages/spf/src/media/buffer/`

| Module | Exports | Role |
|---|---|---|
| `forward-buffer.ts` | `getSegmentsToLoad`, `calculateForwardFlushPoint`, `segmentStartForTime`, `ForwardBufferConfig` | Forward buffer planning + segment-boundary debounce primitive |
| `back-buffer.ts` | `calculateBackBufferFlushPoint`, `BackBufferConfig` | Back buffer eviction policy |

**State slots — reads only.** This feature consumes engine state and
emits actor messages; it doesn't write state.

- Reads: `presentation`, `preload`, `currentTime`, `loadActivated`,
  `selectedVideoTrackId` (or audio / text per variant)

**Context slots — reads only.**

- Reads: `videoSegmentLoaderActor` / `audioSegmentLoaderActor` /
  `textTrackSegmentLoaderActor` (each variant reads only its own type's
  loader-actor slot). The actors themselves are owned and written by
  `setupVideoBufferActors` / `setupAudioBufferActors` /
  `setupTextTrackActors` (under `mse-mms-pipeline` and `subtitles`).

**Downstream:** `SegmentLoaderActor` sends `append-init` /
`append-segment` / `remove` / `cancel` messages to the
`SourceBufferActor` (`mse-mms-pipeline`). Awaits the actor's `'idle'`
snapshot between operations rather than awaiting `send()` directly.

## Config surface

```ts
{
  forwardBuffer?: Partial<ForwardBufferConfig>;
  // ForwardBufferConfig: { bufferDuration: number }  // default 30 (seconds)
  backBuffer?: Partial<BackBufferConfig>;
  // BackBufferConfig: { keepSegments: number }       // default 2
}
```

- `forwardBuffer.bufferDuration` is threaded into the dispatcher
  behaviors (for `range` calculation) and into the v/a + text segment-
  loader actors (for planner forward-flush + load planning).
- `backBuffer.keepSegments` is threaded into the v/a `SegmentLoaderActor`
  only. The text-track loader doesn't perform back-buffer eviction;
  cue caches are bounded per-track-lifetime instead.

## Verification

- **Unit tests (behaviors):**
  - `packages/spf/src/playback/behaviors/dom/tests/load-segments.test.ts` —
    dispatcher FSM transitions, range calculation, segment-boundary
    debounce, per-type wiring
  - `packages/spf/src/playback/behaviors/dom/tests/load-segments-track-switch.test.ts` —
    in-flight continue/preempt during track switches (ABR + audio
    rendition); covers the v/a `SegmentLoaderActor` through the
    dispatcher
  - `packages/spf/src/playback/behaviors/dom/tests/track-current-time.test.ts` —
    `currentTime` mirroring (precondition input)
- **Unit tests (policy primitives):**
  - `packages/spf/src/media/buffer/tests/forward-buffer.test.ts` —
    `getSegmentsToLoad`, `calculateForwardFlushPoint`,
    `segmentStartForTime` algorithm coverage
  - `packages/spf/src/media/buffer/tests/back-buffer.test.ts` —
    `calculateBackBufferFlushPoint` algorithm coverage
- **Coverage gap:** no direct `packages/spf/src/playback/actors/dom/tests/segment-loader.test.ts`
  for the v/a `SegmentLoaderActor`. The actor's planner, continue/
  preempt logic, and SourceBuffer-cancel decisions are exercised through
  the behavior-level tests. Direct actor-level tests would isolate
  regressions from dispatcher changes.
- **Sandbox:**
  - `apps/sandbox/src/spf-segment-loading/` — main SPF demo; exercises
    forward-buffer, back-buffer, seek, and ABR-driven quality switches
    end-to-end

## Open questions

- **Quality-aware filter granularity.** The filter is "≥ bandwidth" —
  it preserves any same-bandwidth or higher-bandwidth content. Should
  it also consider codec / rendition identity (e.g., HEVC and H.264 at
  the same bandwidth might both be "≥" by bps but represent different
  rendition choices)? Today's assumption: bandwidth is the canonical
  quality comparator.
- **`LoadTask` / `Task` naming collision.** The actor file's own
  `@todo` flags: "LoadTask risks confusion with the Task class used for
  SourceBufferActor scheduling. These are closer to operation
  descriptors or messages than tasks in that sense." Rename pending;
  also affects `planTasks` / `scheduleAll`.
- **Direct actor-level tests.** Coverage gap noted above. When does the
  cost of behavior-level-only testing exceed the cost of writing actor
  tests?

## Related features

- **preload-modes** — produces the gate state this feature consumes.
  The 4-state load FSM maps directly to `(preload, loadActivated)`.
- **source-replacement** — segment-loader actors and in-flight fetches
  tear down via the same resolved/unresolved cascade that drives source
  replacement. New buffer-management behaviors that gate on resolved
  presentation must honor the cleanup contract.
- **mse-mms-pipeline** — owns the `SourceBufferActor` this feature's
  operations land on, plus the loader-actor lifecycle
  (`setupVideoBufferActors` etc.). The fetch path
  (`createTrackedFetch` for video) is wired in there.
- **video-abr** — quality-aware buffer planning preserves buffered
  high-quality content during ABR downgrade; bandwidth sampling lands
  in this feature's fetch path (`fetchBytes = createTrackedFetch`).
- **subtitles** — `loadTextTrackSegments` is the text-track variant of
  this feature's dispatcher; `TextTrackSegmentLoaderActor` is the
  text-side counterpart to `SegmentLoaderActor`.
- **multi-language-audio** *(coarse)* — Tier 2 audio-flush-on-switch
  will use the `remove` message primitive surfaced through this
  feature's actor.
- **Audio SourceBuffer flush orchestration** — not a separately-
  scoped feature. The primitives (`SourceBufferActor.remove` message
  + `flushBuffer` helper) live in
  [mse-mms-pipeline](./mse-mms-pipeline.md) and surface through this
  feature's actor; orchestration on `selectedAudioTrackId` change is
  part of [multi-language-audio](./multi-language-audio.md)'s Tier 2
  mid-stream-switching phase.
- **[ll-hls-support](./ll-hls-support.md)** *(candidate)* — extends the
  forward-buffer planner with partial-segment-head tracking past the
  last complete segment. Planner extension shape is an open question
  in that feature's doc.
- **[dvr-event-stream-support](./dvr-event-stream-support.md)**
  *(candidate)* — puts pressure on the back-buffer eviction policy
  (default `keepSegments: 2` evicts history before user can back-
  seek to it). Variant-specific policy vs configurable threshold is
  an open question shared with this doc's "Smarter back-buffer
  eviction" section.
- **5.1-surround-selection** / **hevc-variant-selection**
  *(candidates)* — cross-codec switches need a `changeType()`
  extension beyond today's same-codec planning.

## Use cases that compose this feature

- **[`audio-only-mode-override`](../use-cases/audio-only-mode-override.md)**
  *(partial — Phase 1 landed)* — Phase 1 baseline constituent (used
  as-is via the `hls/audio` engine); Phase 3 surfaces
  alternative-default-config candidates (shorter
  `forwardBuffer.bufferDuration` for audio-only) and a Path-B
  candidate (audio-only-tuned buffer-management behavior).
- **[`video-only-mode-override`](../use-cases/video-only-mode-override.md)**
  *(coarse)* — Phase 1 baseline constituent (used as-is). Loop-
  friendly buffer fetching is the peer `[background-
  video]` use case's concern, not this one's; video-only-mode-
  override's Phase 3 may surface other defaults but not
  loop-around.

## See also

- [presentation-modeling.md](../presentation-modeling.md) — architectural
  deep-dive on the format-neutral data shape and per-track resolution;
  this feature consumes resolved per-track segments surfaced by that
  layer
- [text-track-architecture.md](../text-track-architecture.md) — peer
  architectural deep-dive (text-track-loader internals; same SPF
  shape as v/a)
- [packages/spf/docs/hls-engine.md](../../../../packages/spf/docs/hls-engine.md)
  — engine composition walkthrough (Stage 7: segment loading covers
  this feature's dispatcher + actor surface)
- [conventions/behaviors.md](../conventions/behaviors.md) — per-type
  specialization details (`setupSegmentLoading` is a canonical
  instance)
- [conventions/actors.md](../conventions/actors.md) — actor + tasks
  pattern (`SegmentLoaderActor` shape)
- [conventions/signals.md](../conventions/signals.md) — read-only
  state-slot conventions (this feature consumes the engine's state
  surface without writing to it)
