---
status: partial
date: 2026-08-03
definition: sketched
---

# Live stream support

The engine's foundation for playing **live** HLS sources: periodic
media-playlist refetch, sliding-window segment tracking, target-duration
pacing, `Infinity` duration semantics, and termination detection
(transitioning out of live mode when the stream ends). Distinct from
sibling capabilities for low-latency live (LL-HLS) and DVR / event
streams — those are extensions on top of this foundation, tracked as
separate candidate features.

A **Media-src feature** in the framing from
[clusters.md § Feature classification axes](./clusters.md#feature-classification-axes):
without it, live HLS sources don't play correctly.

## Status

- **Composition:** implemented in the `hls/video` engine. Live HLS
  plays end-to-end: media playlists reload on a runner-driven schedule,
  the sliding window is declared to the browser via
  `setLiveSeekableRange`, duration is `Infinity`, playback starts near
  the live edge, and the playhead is kept in-window. Termination via
  `#EXT-X-ENDLIST` flips the source complete and makes the existing
  `endOfStream` gate reachable.
- **Definition depth:** sketched — *Implementation surface* and
  *Verification* below are populated. Source material: [SPF Epics
  Working Doc — Live Stream Support (epic #2)](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  (cluster A foundation, eng size L, validation M).
- **Partial, not complete.** Two phases did not land: *reload jitter /
  backoff* (pacing is target-duration driven with an unchanged-window
  half-interval, no jitter and no consecutive-failure backoff) and the
  *unchanged-playlist miss-counter* fallback for servers that stop
  updating without emitting `ENDLIST`. Termination is ENDLIST-only.
- **Validated against** Mux LL-HLS live sources and an ffmpeg-generated
  local CMAF live source. **Not** validated for DVR / `EVENT` — see
  [dvr-event-stream-support](./dvr-event-stream-support.md), which has
  known failures on that source shape.
- **Foundational** for the manifest-reload-loop cluster —
  [ll-hls-support](./ll-hls-support.md) and
  [dvr-event-stream-support](./dvr-event-stream-support.md) build on
  this feature.

## Phases of complexity

Capability slices for the foundational live-stream-support feature.
Each phase below is part of "live works (and terminates) at all";
richer live variants (LL-HLS, DVR) sit in sibling features.

| Phase | What | Status |
|---|---|---|
| Manifest reload loop | Periodic media-playlist refetch keyed off `#EXT-X-TARGETDURATION` pacing per HLS spec. Each selected track's media playlist reloads independently as long as the source is live | **Implemented** — runner-driven inside the existing `resolveXTrack` family via an injected `reschedule` seam (`delayedReschedule` + pure `mediaPlaylistReloadDelay`), not a sibling `reloadXTrack` behavior |
| Sliding-window segment tracking | Engine handles segments dropping off the start of the playlist as the window slides forward. Already-buffered segments past the window are still playable; un-fetched segments past the window are no longer fetchable | **Implemented** — segment `startTime` is re-derived against the frozen anchor on every reload, so the window slides while the origin stays fixed |
| Live duration semantics | `presentation.duration = Infinity` flows through `config.resolveDuration` (already pluggable). Downstream `updateMediaSourceDuration` propagates to `mediaSource.duration = Infinity` per MSE spec for live | **Implemented** — `updateMediaSourceDuration` is the sole owner of `mediaSource.duration`, writing `Infinity` for live once buffers go idle |
| Live edge tracking | Engine tracks the latest segment available in the current playlist snapshot. Distinct from `currentTime` (the playhead); the gap between them is the buffer + the user's distance from live edge. DOM exposure via `mediaSource.setLiveSeekableRange(start, end)` so the browser's `HTMLMediaElement.seekable` reflects the live window (without it, `seekable` is empty under `duration === Infinity`) | **Implemented** — a read-time derivation (`liveWindowFor` → `liveWindowFromState` → `getLiveEdge`), never stored; `syncLiveSeekableRange` is the DOM writer. Exposed above the engine as `liveEdgeStart` / `targetLiveWindow` on the media adapter |
| Reload jitter / backoff | Pacing variations under server delays or slow networks. Naive: poll on target-duration; full: jitter to avoid thundering herd, backoff on consecutive identical-playlist responses | **Not implemented** — pacing is full target duration, halved when the window is unchanged (per HLS §6.3.4), with a 6s fallback. No jitter, no consecutive-failure backoff |
| Per-type reload coordination | Audio / video / text media playlists each reload independently. Today the per-type `resolveXTrack` family is one-shot; live requires extending or replacing it with a reloading variant | **Implemented** — independent per type, each paced by its own playlist. Resolves the open question in favor of extending `resolve-track.ts` in place |
| Termination detection (manifest signal) | Recognize when the reload loop should stop. **Naive**: `#EXT-X-ENDLIST` recognition only (assumes spec-compliant servers). Today's parser matches the literal `#EXT-X-ENDLIST` line but doesn't surface the value to the track output — the parser-side fix is part of this phase. **Full**: ENDLIST + unchanged-playlist miss-counter as a fallback for servers that stop updating without emitting `ENDLIST` | **Naive depth implemented** — the parser surfaces completeness as a finite `Track.duration` (`Infinity` = still growing), which stops the reload loop. The miss-counter fallback is **not implemented** |
| Terminated state transition | Engine flips out of live mode for the affected track. Reload loop stops scheduling that track's playlist. The track's segment list stops mutating, which makes the existing `endOfStream` gate naturally reachable (last segment now exists permanently). Per-type independence: audio / video can terminate at different times | **Implemented** — `mediaPlaylistReloadDelay` returns `null` on completion, and `endOfStream` gates on playlist completeness so the transition needs no separate state slot. `clearLiveSeekableRange()` proved unnecessary: MSE ignores the live range once duration is finite |

## What's in scope vs out of scope

**In scope:**
- All phases above for HLS live VOD content with `#EXT-X-TARGETDURATION` pacing
- Standard sliding-window behavior (segments roll off the start)
- `Infinity` duration semantics through MSE
- Naive reload pacing (target-duration interval; no jitter)
- `#EXT-X-ENDLIST` recognition + unchanged-playlist miss-counter fallback for termination detection

**Out of scope (separate Media-src candidate features):**
- **[ll-hls-support](./ll-hls-support.md)** — blocking reload, partial
  segments, delta playlists, preload hints. Largest single live-related
  gap per the permutation matrix; builds directly on this feature's
  reload loop.
- **[dvr-event-stream-support](./dvr-event-stream-support.md)** —
  DVR / event streams: growing playlist (non-sliding); user can seek
  backwards through history. Extension of this feature with different
  windowing semantics.

**Out of scope (related but separate concerns):**
- **[non-zero-pts-support](./non-zero-pts-support.md)** — live streams' PTS advances continuously
  from stream start, typically far from zero. Live needs this for
  correct `currentTime` / `seekable` semantics, but the time-mapping
  primitive itself is a separate cluster B feature.
- **`[buffer-stall-recovery]`** — affects live more than VoD due to
  ingest variability, but is a separate borderline feature.
- **`[viewer-rate-limiting-audit]`** — reload-loop pacing must respect
  server-side rate limiting; the audit itself is a separate borderline
  feature.

## Likely cross-cutting impact

The decisions this feature forced, not just the additions. Where a
question below was settled by implementation, the resolution is recorded
under [Open questions § Resolved during implementation](#resolved-during-implementation).

- **`resolvePresentation` reload variant** — the pre-live behavior was
  one-shot: parse manifest → write resolved presentation. Live re-fetches
  the *media playlists* (not the multivariant), so the reload loop sits
  below `resolvePresentation` rather than replacing it. **Landed as an
  extension to `resolve-track.ts`** rather than a sibling `reloadXTrack`
  family. Touches the `parseMediaPlaylist` direct import (see
  [presentation-modeling.md](../presentation-modeling.md)) — same parser,
  called repeatedly per track.
- **Segment-loader sliding-window awareness** — today's planner
  iterates over all segments in `track.segments`. Live needs the
  planner to handle the segment list mutating mid-flight (segments
  appended at the live edge, segments removed from the start). The
  existing back-buffer eviction policy may need extension to honor
  "no longer in the playlist" as an eviction signal independent of
  `keepSegments` count.
- **`bandwidthState` resume semantics** — already preserved across
  source resets (see [video-abr.md](./video-abr.md)). For live,
  bandwidth-aware ABR continues to function, but bandwidth measurement
  during live is more variable (network conditions matter more without
  the full-buffer-ahead cushion).
- **Time mapping for live edge** — `state.currentTime` is the playhead;
  the live edge is a derived value computed from the playlist's last
  segment. Tools like "seek to live edge" or "is at live edge" would
  consume this derived signal. Doesn't necessarily need its own state
  slot.
- **End-of-stream handling** — `endOfStream` today gates on
  `isLastSegmentAppended` + `currentTime >= lastSegStart`, *not* on
  `presentation.duration` finiteness. For live, the gate naturally
  doesn't fire because the playlist keeps growing — no segment is
  permanently "the last." Once termination commits via this feature's
  termination-detection phases, the last segment stabilizes and the
  gate becomes reachable for normal reasons. **Subtlety:** there's a
  possible race if reload pacing lags playhead consumption — the
  current last segment could meet the gate before the next reload
  appends a new one, firing `endOfStream` spuriously. Whether this
  happens in practice depends on reload pacing relative to
  forward-buffer depth.
- **Parser-side ENDLIST surfacing** — `parseMediaPlaylist` currently
  recognizes `#EXT-X-ENDLIST` (skips the line) but doesn't extract the
  value. The `MediaPlaylistInfo.endList: boolean` type field exists
  but is orphaned (the parser returns a `Track`, not
  `MediaPlaylistInfo`). The termination-detection phases need the
  parser to surface the value to the track output.
- **`mediaSource.*` third-writer pattern — `setLiveSeekableRange`** —
  `mediaSource.duration` already has two non-overlapping writers
  (`updateMediaSourceDuration` for the initial `Infinity` write;
  `endOfStream` for the deterministic final value — see
  [mse-mms-pipeline.md](./mse-mms-pipeline.md) on DOM-property
  multi-writer). Live introduces a structurally *different* third
  writer on the same `mediaSource` resource: ongoing reactive
  `setLiveSeekableRange(start, end)` calls keyed off live-edge updates,
  plus `clearLiveSeekableRange()` paired with the terminated-state
  transition. Distinct from the existing two writers along all three
  characterization axes — decision domain (derived from playlist
  snapshot vs. presentation / buffered), trigger (ongoing reactive vs.
  one-shot transitions), and method (range setter rather than
  `.duration` assignment). `start` = earliest still-fetchable segment
  (sliding-window-aware); `end` = live edge. **Landed as
  `syncLiveSeekableRange`** — option (b), a single-purpose behavior
  reading presentation / segment state and writing to DOM, gated on the
  published (hence open) MediaSource. It composes into the *same* engine
  rather than a separate live variant: live vs VoD turned out to be a
  distinction in the data (a growing playlist), so the behavior no-ops
  for complete playlists and `updateMediaSourceDuration` stays
  uniform-across-variants (see
  [conventions/behaviors.md](../conventions/behaviors.md) → *Inverse:
  behaviors that operate uniformly across tracks* and the
  `updateMediaSourceDuration` worked example). The single-purpose split
  paid off as predicted: `seekToLiveEdge` consumes the same derived
  window via `liveWindowFromState` without coupling to the DOM writer.

## Implementation surface

**Composition:** `liveFeature` (`packages/spf/src/playback/engines/hls/features/live.ts`),
composed by the `hls/video` engine — the live behaviors compose alongside the VOD ones; live vs
VOD is a runtime distinction in the *data* (a growing playlist), not a separate engine variant, and
the feature is inert for on-demand content. It carries the `reschedule` reload seam that
`resolve*Track` runs on, and `establishStartMediaTime` with the `gateFirstParse` anchor gate.

**Behaviors:**

| Behavior | File | Responsibility |
|---|---|---|
| `resolveVideoTrack` / `resolveAudioTrack` / `resolveTextTrack` | `packages/spf/src/playback/behaviors/resolve-track.ts` | Media-playlist fetch + parse, re-run on the injected `reschedule` seam while the playlist is incomplete. The reload loop lives here |
| `establishStartMediaTime` | `packages/spf/src/playback/behaviors/establish-start-media-time.ts` | Freezes the reference track's PDT as the presentation anchor and latches `startMediaTime`. **Owned architecturally by [`non-zero-pts-support`](./non-zero-pts-support.md)**; live contributes the wall-clock anchor half |
| `syncLiveSeekableRange` | `packages/spf/src/playback/behaviors/dom/sync-live-seekable-range.ts` | Sole writer of `mediaSource.setLiveSeekableRange()`. The third `mediaSource.*` writer anticipated below, landed as its own behavior (option (b)) |
| `seekToLiveEdge` | `packages/spf/src/playback/behaviors/dom/seek-to-live-edge.ts` | Commands the once-per-source live-edge start position, and runs the continuous window-exit guard (reposition when the playhead falls behind the window start while playing) |
| `applyStartPosition` | `packages/spf/src/playback/behaviors/dom/apply-start-position.ts` | Consumes `state.startPosition` and performs the seek. **Owned architecturally by `mse-mms-pipeline` / AirPlay restore**; live is a third writer of the same one-shot command |
| `updateMediaSourceDuration` | `packages/spf/src/playback/behaviors/dom/update-mediasource-duration.ts` | Writes `Infinity` for live. **Owned architecturally by `mse-mms-pipeline`** |
| `endOfStream` | `packages/spf/src/playback/behaviors/dom/end-of-stream.ts` | Gates on playlist completeness, so it stays inert for live and becomes reachable on `ENDLIST`. **Owned architecturally by `mse-mms-pipeline`** |

**Helpers:**

| Helper | File | Role |
|---|---|---|
| `mediaPlaylistReloadDelay(current, previous)` | `packages/spf/src/media/hls/reload-policy.ts` | Pure pacing policy: target duration, halved when the window is unchanged, `null` once complete (stops the loop) |
| `liveLatencyFor(track)` / `resolveLiveLatency(presentation, trackId)` | `packages/spf/src/media/hls/reload-policy.ts` | The server's `EXT-X-SERVER-CONTROL` `HOLD-BACK` when declared, else the spec default 3 × target duration. Never `PART-HOLD-BACK` — that assumes partial-segment playback. Injected into `seekToLiveEdge` so the behavior stays format-neutral |
| `liveWindowFor(presentation, trackId)` | `packages/spf/src/media/live-window.ts` | One track's window as a live read over `segments`; `null` for a complete playlist |
| `liveWindowFromState(state)` / `getLiveEdge({state, config})` / `liveTrackId(state)` | `packages/spf/src/playback/primitives/live-window.ts` | The A/V window intersection, the edge target, and the timeline-bearing track pick — the single call site `seekToLiveEdge` and `syncLiveSeekableRange` share |
| `gateFirstParseOnAnchor` | `packages/spf/src/playback/primitives/gate-first-parse.ts` | Holds a non-reference track's first parse until the anchor is stamped |
| `delayedReschedule` | `packages/spf/src/core/tasks/delayed-reschedule.ts` | Cancellable delay wrapper turning the pure pacing policy into a runner schedule |
| `sleep(ms, signal)` | `@videojs/utils/time` | Cancellable timer the reschedule builds on |

**State slots:**

- `startPosition` — one-shot start-position command. Live is one of
  three writers (consumers, `setupAirPlay`'s session-end snapshot,
  `seekToLiveEdge`); `applyStartPosition` is the sole consumer and
  clears it. Temporally separated in practice, so last-write-wins is
  the policy, with the window-exit guard rescuing a stale restore.
- `mediaContainerData` — transient per-type container data owned by
  `establishStartMediaTime`.
- No new live-only slot. The live window is derived at read time and
  completeness rides on `Track.duration` finiteness, so "is live" needs
  no state of its own.

**Above-engine surface:** `packages/spf/src/playback/adapters/hls-video/mixin.ts`
exposes `streamType`, `targetLiveWindow`, and `liveEdgeStart` with
`streamtypechange` / `targetlivewindowchange` events — the
`MediaStreamTypeCapability` + `MediaLiveCapability` contract that
`@videojs/core`'s `liveFeature` and `media-live-button` consume.

## Verification

- **Unit tests:**
  - `packages/spf/src/media/hls/tests/reload-policy.test.ts` →
    "polls at full target duration on the first reload of a live window",
    "polls at half target duration when the window is unchanged",
    "stops (null) once the playlist is complete (finite duration)" —
    the pacing policy, including loop termination
  - `packages/spf/src/media/hls/tests/reload-policy.test.ts` →
    "is 3× the target duration (default HOLD-BACK)", "prefers a declared
    HOLD-BACK over the target-duration default" — holdback derivation
  - `packages/spf/src/media/hls/tests/parse-media-playlist.test.ts` →
    "surfaces EXT-X-SERVER-CONTROL HOLD-BACK, ignoring PART-HOLD-BACK",
    "leaves holdBack undefined when SERVER-CONTROL declares only
    PART-HOLD-BACK" — the LL-HLS-server shape this must not misread
  - `packages/spf/src/playback/behaviors/tests/resolve-track.test.ts` →
    "re-resolves while the window is incomplete (reschedule resolves)",
    "resolves once and never reloads when no reschedule is configured
    (VoD/non-live)", "stops reloading once the playlist completes" — the
    reload loop and its VOD inertness
  - `packages/spf/src/playback/behaviors/tests/resolve-track.test.ts` →
    "honors a startDate stamped onto the shell mid-fetch", "holds the
    parse (not the fetch) until the gate opens" — anchor stamping across
    an in-flight reload (the startup-offset race this fixed)
  - `packages/spf/src/media/tests/live-window.test.ts` →
    "returns the window bounds for a live track — a live read over
    segments, not the frozen origin", "returns null for a complete
    (finite-duration) playlist" — window derivation and its VOD null
  - `packages/spf/src/playback/primitives/tests/live-window.test.ts` →
    "intersects the selected A/V windows — max of starts, min of ends",
    "the intersection max-clamps a non-reference track whose window
    precedes presentation-0", "returns null on a degenerate intersection",
    "falls back to a resolved track when the selected track is not yet
    resolved (mid-switch)" — the Phase 2 window math
  - `packages/spf/src/playback/behaviors/dom/tests/sync-live-seekable-range.test.ts` →
    "declares the full live window as seekable", "declares only once the
    MediaSource is published (open)", "leaves duration alone — owned by
    updateMediaSourceDuration" — the DOM writer and its ownership boundary
  - `packages/spf/src/playback/behaviors/dom/tests/seek-to-live-edge.test.ts` →
    "commands a start position near the live edge on entry", "commands
    once per source — a playlist reload does not re-command",
    "re-commands on a genuine source change (new url)", plus the
    `live-window playhead guard` block (in-window pause, fell-behind
    resume, stranded-seek rescue, DVR scrub-back left alone)
  - `packages/spf/src/playback/behaviors/dom/tests/update-mediasource-duration.test.ts` →
    "writes Infinity to MediaSource.duration for live", "writes Infinity
    after sourceopen when the MediaSource starts closed (live)"
  - `packages/spf/src/playback/behaviors/dom/tests/end-of-stream.test.ts` →
    "does not call endOfStream() for a live (incomplete) playlist even
    with the last segment appended", "calls endOfStream() once a live
    playlist appends #EXT-X-ENDLIST (graceful end)"
  - `packages/spf/src/media/hls/tests/parse-media-playlist.test.ts` —
    PDT / `startDate` extraction and media-playlist metadata surfacing,
    against live CMAF + TS fixtures in `media/hls/tests/fixtures/`
  - `packages/spf/src/core/tasks/tests/delayed-reschedule.test.ts`,
    `core/tasks/tests/task.test.ts` — the reschedule seam and the
    memoized `Task` `run()` / `clone()` / `previous` it depends on
- **Sandbox:**
  - `apps/sandbox/templates/spf-segment-loading/` — live status strip
    (stream type, window, behind-edge, hold-back) and a seek-to-live-edge
    control
  - `apps/sandbox/scripts/live/local-live.sh` + `README.md` — ffmpeg
    CMAF live source (no Mux account needed) and the Mux live / DVR recipe
- **Manual / smoke:** live playback verified against Mux LL-HLS and the
  local ffmpeg source — startup lands at `seekableEnd − 3 × targetDuration`,
  the window advances, back-seek holds without spurious repositioning, and
  the box-parsed origin segment is the live-edge segment (not the window
  start).
- **Out of scope / deferred:**
  - No E2E coverage — `apps/e2e` has no live fixture; a live source needs
    either a long-running external stream or an ffmpeg-backed harness.
  - Not verified on WebKit or Firefox; all measurement is Chromium.
  - DVR / `EVENT` sources are **not** covered — see
    [dvr-event-stream-support](./dvr-event-stream-support.md).

## Open questions

### Resolved during implementation

- **Per-type reload coordination** → **independent.** Each type paces
  off its own playlist's target duration. No symmetric stall coupling;
  the A/V window intersection in `liveWindowFromState` absorbs
  publication skew instead, shrinking `seekable` to what both types can
  serve.
- **Reload behavior extension vs new behavior** → **extended in place.**
  `resolve-track.ts` keeps ownership; live-ness enters through an
  injected `reschedule` seam rather than a sibling `reloadXTrack`
  family, so the existing source-identity cleanup cascade is inherited
  unchanged.
- **Default `resolveDuration` for live** → **the default engine variant
  covers live.** `getResolvedSelectedTrackDuration` returns `Infinity`
  for an incomplete playlist; no opt-in wiring needed.
- **`endOfStream` race under live reload pacing** → **not reachable.**
  The gate was moved onto playlist completeness rather than
  "last segment appended + currentTime", so a growing playlist can't
  satisfy it regardless of reload pacing.
- **`setLiveSeekableRange` behavior shape** → **option (b).**
  `syncLiveSeekableRange` is its own behavior reading presentation /
  track state, as the lean predicted. It later split further: pure
  window derivation moved to `liveWindowFor` / `liveWindowFromState`,
  shared with `seekToLiveEdge` so the two can't drift.
- **`clearLiveSeekableRange` pairing** → **unnecessary.** MSE ignores the
  live seekable range once duration is finite, so the terminated
  transition needs no explicit clear.
- **Seeked-latch source reset** → **moot.** The latch it referred to
  (`seekedForSource` in `seekToLiveEdge`) was removed once `mediaSource`
  left the derived state; nothing can flip the reactor mid-source, so
  `entry` fires once per source without bookkeeping to reset.
- **Deriving the window from accumulated segments while paused** →
  **rejected.** The concern was that a paused playhead falls behind the
  sliding window, since `parseMediaPlaylist` returns the current snapshot
  rather than an accumulation. But under `duration === Infinity` the UA
  derives `seekable` as the **union of the live seekable range and
  `buffered`**, so a paused viewer's buffered position stays seekable
  regardless. Accumulating dropped segments into the model would be
  actively worse: segments no longer in the playlist and not buffered are
  unfetchable, so advertising them would turn today's graceful
  window-exit reposition into a stall.

### Still open

- **Miss-counter threshold.** Heuristic feature — how many identical-
  manifest reloads constitute termination? hls.js uses some count;
  SPF needs its own choice. Threshold affects false-positive vs
  false-negative rate. Unblocked but unimplemented: termination is
  ENDLIST-only today.
- **Per-type termination semantics.** When audio terminates before
  video, what's the engine's consumer-facing surface? "Live until all
  tracks terminate" or "terminated when any track terminates"? Likely
  the former, but worth confirming the precedent. Untested — no fixture
  where the two types terminate at different times.
- **HLS-specific assumptions baked into format-neutral behaviors.**
  `liveWindowFor` reads `getMediaPlaylistMetadata` / `targetDuration` —
  HLS vocabulary sitting *below* the `resolveLiveLatency` seam that exists
  to keep the behaviors format-neutral. Needs unwinding before DASH. (The
  latency policy itself is no longer part of this: it reads the server's
  declared `HOLD-BACK` and only falls back to `3 × targetDuration`, and it
  lives above the seam where format-specific vocabulary belongs.)
- **`PART-HOLD-BACK` is deliberately unread.** It only applies to clients
  playing partial segments; using it while fetching whole segments would
  seat the playhead ahead of the last complete segment. Belongs with
  [ll-hls-support](./ll-hls-support.md), not here — which is also why
  `MediaPlaylistMetadata` doesn't carry it (no write-only state).
- **`syncLiveSeekableRange` writes an unguarded range.** Its docstring
  justifies having no try/catch on the invariant that
  `liveWindowFromState` guarantees `0 ≤ start < end`. It doesn't: the A/V
  intersection's `max` clamps a negative *non-reference* window, but a
  negative *reference* window passes straight through (covered by
  `playback/primitives/tests/live-window.test.ts` → "yields a negative
  start when every selected window is negative", "…for a single
  mis-anchored track"). A mis-anchored source therefore calls
  `setLiveSeekableRange(negative, end)`, which throws — and because the
  writer is an `effect`, it re-throws on every window update. Latent for
  sliding-window live (the anchor establishes correctly there); **active
  for `EVENT`** — see
  [dvr-event-stream-support](./dvr-event-stream-support.md). Fix is a
  choice between clamping in the writer, guarding the call, or treating a
  negative window as "not derivable" upstream.

## Related features

- **[ll-hls-support](./ll-hls-support.md)** — builds on this feature's
  reload loop. Adds blocking reload, partial segments, delta playlists,
  preload hints. Largest live-related gap.
- **[dvr-event-stream-support](./dvr-event-stream-support.md)** —
  different windowing semantics on top of the same reload loop.
  Growing playlist + back-seek through history; resolves this doc's
  prior "DVR / event boundary" decomposition question (DVR is its
  own feature, not a phase here).
- **[non-zero-pts-support](./non-zero-pts-support.md)** — live PTS
  starts far from zero. Live without non-zero PTS handling means
  `currentTime` is wrong. Cluster B foundation that live consumes.
- **mse-mms-pipeline** — `Infinity` duration via `config.resolveDuration`
  is already supported there; live writes the value, MSE pipeline
  propagates it. The `endOfStream` gate uses segment + currentTime,
  not duration finiteness; it naturally doesn't fire for live (growing
  playlist) and becomes reachable once termination commits.
- **buffer-management** — sliding-window segment tracking interacts
  with back-buffer eviction. The planner's currentTime-driven plan
  shape applies; the playlist itself mutating mid-flight is new.
- **video-abr** / **audio-playback** / **subtitles** — all per-type
  consumers continue to work in live, but each reads the resolved
  track which now changes over time (segments append / roll off).
  Quality-aware buffer planning preserves buffered higher-quality
  content; for live this still applies but the windowing changes the
  buffered-set turnover rate.
- **source-replacement** — orthogonal; live and VoD source changes
  use the same in-place cascade. Live → live source change tears
  down and rebuilds the reload loop along with everything else.

## See also

- [clusters.md § Manifest reload loop](./clusters.md#manifest-reload-loop)
  — cluster A description; this feature is the foundation
- [clusters.md § Feature classification axes](./clusters.md#feature-classification-axes)
  — the Media-src feature framing this doc instantiates
- [presentation-modeling.md](../presentation-modeling.md) —
  architectural deep-dive; the reload loop sits below
  `resolvePresentation` and re-uses `parseMediaPlaylist` per cycle.
  When `parseMediaPlaylist` pluggability arrives (see that doc's
  Open questions), live + format support intersect
- [SPF Epics Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  — source material; cluster A epic candidates and decompositions
- [Mux Video Permutations Matrix](https://www.notion.so/32c97a7f89d08191b84dd30f06685490)
  — Stream Type section; SPF column shows ⚠️ for live + DVR (manifest
  re-polling unverified), 🔲 for LL-HLS
