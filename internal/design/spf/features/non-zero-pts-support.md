---
status: implemented
date: 2026-07-16
definition: sketched
---

# Non-zero PTS support

Time-mapping primitive for sources where media-segment PTS
(Presentation Timestamps) don't start at zero. Three motivating
source types — re-mastered VOD, deliberate instant clips, and live
streams — all share the same underlying problem: detect the first
segment's PTS, then make user-visible `currentTime` start at zero.
The cluster B foundation; consumed by every cluster A feature
([live-stream-support](./live-stream-support.md),
[dvr-event-stream-support](./dvr-event-stream-support.md),
[ll-hls-support](./ll-hls-support.md)) for correct `currentTime` /
`seekable` semantics.

**Mechanism: resolved and implemented for VOD** — `SourceBuffer.timestampOffset`
relocation. The offset is applied per `SourceBuffer` (`timestampOffset =
−startMediaTime`) so the buffer, the model's `Track.startTime`, and
`currentTime` all stay 0-based and the adapter is untouched; text cues get the
same shift as arithmetic. The A/V-sync risk from per-buffer offset divergence is
handled by relocating every track by one shared `min` origin across the selected
A/V tracks, which keeps every DTS ≥ 0 *and* preserves real skew. The coordinate
model and the discover→derive→apply architecture are documented in full in
[presentation-timeline-model.md](../presentation-timeline-model.md); the mechanism
decision (native-PTS default, relocation for the 0-based cases) in
[../../../decisions/spf/mse-timestamp-offset.md](../../../decisions/spf/mse-timestamp-offset.md).
(The alternative — simulated translation in the adapter — was the parked approach
on `feat/spf-non-zero-pts`.)

A **Media-src feature** in the framing from
[clusters.md § Feature classification axes](./clusters.md#feature-classification-axes):
without it, live and instant-clip sources play with wrong
`currentTime` (a live stream's playhead jumps to hours/days into the
session because PTS is large; an instant clip's playhead starts at
the original media's PTS rather than 0).

Combines Notion epic #6 ("Non-zero PTS / Instant Clip Support") scope:
non-zero PTS and instant clips share the same time-mapping primitive,
distinct motivations.

## Status

- **Composition:** implemented for **VOD** in the `hls/video` engine and
  the `hls/audio` engine on `feat/spf-non-zero-pts-relocation` (draft
  PR #1847). The `establishStartMediaTime` reactor + the `relocation-pipelines`
  primitive discover each track's decode-time origin (`tfdt`/`mdhd`, matched by
  `track_id`) and relocate via `SourceBuffer.timestampOffset = −startMediaTime`.
  Relocation is **composition-time opt-in** — the always-present loader/buffer
  actors carry no relocation vocabulary, and a zero-PTS composition imports none
  of this code (see [presentation-timeline-model.md § Branch-free always-present
  actors](../presentation-timeline-model.md)).
- **Live is parked** on `feat/spf-non-zero-pts`; the live edge has its own
  wall-clock anchor (`anchorPresentationTimeline`), the media↔wall-clock sibling
  of this feature's media↔presentation relocation. Mid-stream PTS jumps remain
  the sister `[discontinuity-handling]` feature's scope.
- **Definition depth:** sketched — implemented and code-grounded for VOD. Source
  material: [SPF Epics Working Doc — epic #6 Non-zero PTS / Instant Clip
  Support](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4) (cluster B,
  Media-src, eng L, validation M).
- **Foundational** for cluster B — first cluster B doc. Consumed by
  every cluster A feature (live, DVR, LL-HLS) for correct `currentTime`
  semantics.

## Phases of complexity

Content phases by source-type. All three use the same underlying
mechanism (first-segment-PTS detection + `timestampOffset` relocation);
they differ in motivation, customer-data context, and composition with
other cluster A features.

| Phase | Source type | What | Status |
|---|---|---|---|
| Non-zero-PTS VOD | Re-mastered or processed VOD where the manifest retains original PTS rather than zero-rebasing the source. Stable, non-zero PTS throughout — often the output of clipping / transcoding pipelines that preserve PTS | Detect first-segment `baseMediaDecodeTime` (`tfdt`) + `timescale` (`mdhd`) from the init + first media segment, matched by `track_id`. Relocate via `SourceBuffer.timestampOffset = −startMediaTime`; `currentTime` resolves to zero at source start. Offset is one-time setup (established once per source, sticky) | **Implemented.** The baseline case |
| Instant clips (deliberate offset) | Sources where Mux Video creates a clip by serving a manifest starting at a non-zero PTS (the clip's start position in the original media). `currentTime` should still start at zero | Engine treats it **identically** to non-zero-PTS VOD — same detect + relocate. The clip-specific extra (surfacing the original PTS for telemetry / "watch from minute N") is an adapter-layer concern, not engine | **Implemented** (relocation); original-PTS surfacing is out of scope (adapter layer) |
| Live streams with non-zero PTS | Live encoder PTS counts from broadcast / encoder start; the first loaded segment has a large PTS. The sliding window rolls segments off the start; the *seekable range* slides forward but the origin is stable within an encoder run | Live uses the wall-clock `anchorPresentationTimeline` (media↔wall-clock edge) rather than the VOD media↔presentation relocation; composes with [live-stream-support](./live-stream-support.md)'s `setLiveSeekableRange`, [dvr-event-stream-support](./dvr-event-stream-support.md)'s growing-window, and [ll-hls-support](./ll-hls-support.md)'s partial-segment edge tracking | **Parked** on `feat/spf-non-zero-pts` |

## What's not implemented

Extension boundaries — each is a separate candidate feature or a parked phase:

- **Live non-zero-PTS relocation** — parked on `feat/spf-non-zero-pts`. Live has
  its own wall-clock anchor today; converging live and VOD onto one establishment
  unit (both write per-track coordinate base values) is the flagged eventual
  dedup — see [presentation-timeline-model.md § Consume](../presentation-timeline-model.md).
- **`[discontinuity-handling]`** *(sister candidate)* — mid-stream PTS jumps via
  `EXT-X-DISCONTINUITY`, encoder restart on the same source URL, 33-bit PTS
  rollover (~26h of 90 kHz ticks). This feature handles a *single stable PTS
  origin per source*; the sister handles the origin *changing mid-source*. Both
  consume the same time-mapping primitive; the meta-per-append offset shape already
  generalizes to per-period re-base (see [presentation-timeline-model.md § Offset
  applied via append meta](../presentation-timeline-model.md)).
- **`EXT-X-START` / `EXT-X-PROGRAM-DATE-TIME` consumption** — the HLS start-offset
  and per-segment wall-clock attributes. Lean: parse + expose; let the consumer
  decide initial `currentTime` / wall-clock display. PDT is already the live
  anchor's input; VOD consumption of either is unbuilt.
- **Cluster B Borderline content compensation** — `[pseudo-ended-detection]`,
  `[edit-list-compensation]`, `[buffer-stall-recovery]`. All build on this
  feature's primitive but address different content-defect concerns.

**Out of scope (different architectural layer):**
- Customer-facing display of original-media position (e.g. "watching minute 3 of a
  60-minute source via a 10-minute clip"). Engine relocates; adapter/consumer
  renders the UI.
- Mux Data telemetry mapping of clip `currentTime` → original-media position.
  Service-side / adapter-side.

## Implementation surface

**Composition:** `packages/spf/src/playback/engines/hls/engine.ts` (and
`engine-audio-only.ts`) — the relocation wiring is comment-marked as one removable
block (reactor + `deriveStartMediaTime` seam + the `video`/`audio`/`text`
message-pipeline config), so it adds/drops as a unit for bundle / back-compat
testing.

**Behaviors:**

| Behavior | File | Responsibility |
|---|---|---|
| `establishStartMediaTime` | `playback/behaviors/establish-start-media-time.ts` | Per-source reactor (`inactive`/`monitoring`/`established`). Owns the transient `mediaContainerData` slot (cleared per source); runs the injected `deriveStartMediaTime` seam and stamps the settled per-track `startMediaTime` onto the model — sole writer, establish-once sticky. VOD sibling of `anchorPresentationTimeline` |
| `recoverEndStall` | `playback/behaviors/dom/recover-end-stall.ts` | Recovers the Chrome end-of-stream freeze on skewed A/V: on `waiting` with the MediaSource `ended` and the playhead within `endStallNudgeWindow` of the reachable buffered end, nudges `currentTime` to `duration` to force native `ended`. Needed because shared-`min` relocation preserves A/V skew |

**Primitives** (`playback/primitives/`, DOM-free):

| Primitive | File | Role |
|---|---|---|
| `deriveStartMediaTime` seam + defaults | `derive-start-media-time.ts` (type/context), `establish-start-media-time.ts` (`deriveSharedMinStartMediaTime` default, `derivePerTypeStartMediaTime` opt-out) | The one coordination knob: `(mediaContainerData, ctx) => per-type startMediaTime`. Default reduces the `min` across selected A/V origins |
| `relocationPipelinesFor(type, derive)` | `relocation-pipelines.ts` | The loader `messagePipelines` — discover (`track_id` + `mdhd` timescale, then that track's `tfdt` `baseMediaDecodeTime`) → stamp (`timestampOffset = −startMediaTime`, `awaitDefined` holdback, liveness-guarded) |
| `relocatingTextPipelines()` | `relocation-pipelines.ts` | Text-loader pipeline: resolve metadata → shift cues by `mapCorrection − startMediaTime` (`mapCorrection = X-TIMESTAMP-MAP mpegts/90000 − local`) → dispatch. Origin is **awaited** — the primary selected A/V `startMediaTime`, so an early cue load can't resolve to `0` and shift every cue by the full `mapCorrection` (mirrors the A/V stamp step); a genuinely text-only source (no A/V tracks) relocates by `0` |

**Media primitives (DOM-free, no `core/`):**

- `media/mp4/timestamp-origin.ts` — two tree-shakeable box readers:
  `readFirstMediaTimescale`/`readFirstBaseMediaDecodeTime` (presumptive, first box)
  vs `findMediaTrack`/`readBaseMediaDecodeTime` (track-id-matched, for muxed
  containers with an extra `clcp`/caption track). `media/mp4/box.ts` — the minimal
  box parser.
- `media/text/parse-vtt-timestamp-map.ts` — scrapes the WebVTT `X-TIMESTAMP-MAP`
  header (the one line the native `<track>` parser discards); `resolve-vtt-metadata.ts`
  — DOM-free cue metadata resolution.

**State slots:**

- `startMediaTime` — **per-track on the CMAF-HAM `Track`** (a peer of `startTime`
  and `startDate`), not a parallel slot. Sole writer is the reactor's derive
  effect. `timestampOffset` is **derived** (`startTime − startMediaTime`), never
  stored. The write shares `presentation`'s existing multi-writer situation (#1746),
  accepted rather than worked around.
- `mediaContainerData` — transient, keyed by track type (`{ trackId?, timescale?,
  baseMediaDecodeTime?, segmentStartTime? }`). Holds the partial per-append discover
  churn so it never touches `presentation`; cleared per source by the reactor's
  `inactive` entry.

## Config surface

```ts
{
  // Coordination seam (the one tier knob). Default deriveSharedMinStartMediaTime
  // (min across selected A/V origins); derivePerTypeStartMediaTime is the
  // barrier-free per-type opt-out for known-aligned A/V.
  deriveStartMediaTime?: DeriveStartMediaTime;
  // recoverEndStall proximity window (seconds); default 0.2. How close the
  // playhead must sit to the reachable buffered end for a `waiting` to count as
  // the end-of-stream freeze.
  endStallNudgeWindow?: number;
}
```

`NEAR_ZERO_ORIGIN_THRESHOLD` (1s, in `establish-start-media-time.ts`) is a fixed
policy, not config: origins below it (incl. negatives) snap to `0`, leaving the
source on its native ~0-based timeline (no `timestampOffset` set). Relocation
targets intentional large origins (instant clips, bipbop @10s), not the small
encode origin ordinary VOD carries (audio priming, first-frame CTS, edit lists).

## Verification

- **Unit tests:**
  - `playback/behaviors/tests/establish-start-media-time.test.ts` — reactor
    lifecycle, the derive seam (shared-`min` barrier, per-type opt-out, threshold
    snapping).
  - `playback/primitives/tests/relocation-pipelines.test.ts` — discover/stamp
    steps; the track-id match resolves the media track's origin under a
    caption-first muxing (10s, not the leading `clcp` traf's 50s); cue-origin
    resolution (waits for the selected A/V origin instead of shifting cues by the
    full map correction; text-only source relocates by 0).
  - `media/mp4/tests/{timestamp-origin,box}.test.ts` — box parsing + both parser
    variants.
  - `media/text/tests/parse-vtt-timestamp-map.test.ts` — `X-TIMESTAMP-MAP` scrape.
  - `media/dom/mse/tests/duration.test.ts`, `behaviors/dom/tests/recover-end-stall.test.ts`
    — reachable buffered-end + the skewed-A/V EOS nudge.
- **Cross-browser smoke** (chromium/firefox/webkit × Mux clip / Apple bipbop / Mux
  full, incl. `?engine=audio`): 0-based `currentTime`/`seekable`/`buffered`,
  per-SourceBuffer relocation with A/V skew **preserved** (Apple ~44ms, Mux clip
  ~1ms), text-cue alignment, ended+loop. The `~0.043`-origin full-length source is
  left un-relocated (below threshold). Sandbox harness is local/git-ignored, not
  in-repo.

## Open questions

- ~~**Mechanism choice: `timestampOffset` vs simulated translation.**~~
  *Resolved.* `timestampOffset` relocation for VOD; see the opening and
  [../../../decisions/spf/mse-timestamp-offset.md](../../../decisions/spf/mse-timestamp-offset.md).
- ~~**PTS-detection implementation: parser depth.**~~ *Resolved.* A targeted
  extractor (`media/mp4/timestamp-origin.ts`), not a full `mp4box.js`-style
  dependency — split into presumptive vs track-id readers for tree-shaking.
- ~~**Per-type offset (video vs audio).**~~ *Resolved.* `mediaContainerData` is
  keyed by track type; the default derive reduces the `min` across selected A/V
  origins (preserves skew, keeps every DTS ≥ 0).
- ~~**`currentTime` near zero for non-zero-PTS VOD.**~~ *Resolved.*
  `NEAR_ZERO_ORIGIN_THRESHOLD` snaps sub-second and negative origins to `0`
  (native timeline, no offset set); cross-browser smoke confirmed no exact-zero
  `seekable.start(0)` misbehavior on the target browsers.
- **Text-only sources.** No A/V `tfdt` to establish from — but the
  `X-TIMESTAMP-MAP` `MPEGTS` *is* a media-timeline reference, so text could
  self-establish. Deferrable special path.
- **`EXT-X-START` / `EXT-X-PROGRAM-DATE-TIME` consumption for VOD.** Parse +
  expose vs act on. Lean: expose, let the consumer decide.
- **Telemetry / customer-data offset exposure.** Surface the origin (or derived
  offset) to consumers for Mux Data / analytics? Lean: yes, read-only via engine
  state.
- **Discontinuity boundary semantics.** The boundary between this feature (stable
  origin) and `[discontinuity-handling]` (origin changes mid-source) is drawn at
  "single PTS origin per source."
- **Mechanism-level questions** — the barrier-liveness bound (audio absent/errored
  must not block the shared-`min` `awaitDefined` forever) and the first-segment
  hold's interaction with preempt/replan are tracked in
  [presentation-timeline-model.md § Open questions](../presentation-timeline-model.md#open-questions).

## Related features

- **[live-stream-support](./live-stream-support.md)** *(consumer)* — the
  media↔wall-clock sibling; consumes offset-corrected `currentTime`/`seekable`
  during live. Cluster A foundation this feature is the cluster B prerequisite for.
- **[dvr-event-stream-support](./dvr-event-stream-support.md)** *(consumer)* —
  growing-window seekable start is offset-corrected from segment 0.
- **[ll-hls-support](./ll-hls-support.md)** *(consumer)* — partial-segment edge
  tracking uses offset-corrected values.
- **[mse-mms-pipeline](./mse-mms-pipeline.md)** — `SourceBuffer.timestampOffset` is
  the MSE API consumed; the segment-append sequence gains a discover + offset-write
  stage (loader message-pipeline steps, applied by the `SourceBufferActor`).
- **[buffer-management](./buffer-management.md)** — the forward-buffer planner
  operates on `currentTime` and segment ranges; both stay 0-based, so the planner
  is unchanged.
- **[presentation-modeling](../presentation-modeling.md)** — the data model
  `startMediaTime` extends (peer of `startTime`/`startDate`); the parser is where
  `EXT-X-START`/`EXT-X-PROGRAM-DATE-TIME` would surface.
- **`[discontinuity-handling]`** *(sister candidate)* — mid-stream PTS jumps; same
  primitive, different motivation (changes mid-source vs stable).
- **Cluster B Borderline content compensation:**
  [pseudo-ended-detection](./pseudo-ended-detection.md),
  [edit-list-compensation](./edit-list-compensation.md),
  [buffer-stall-recovery](./buffer-stall-recovery.md) — build on this feature's
  primitive. See [clusters.md § Time normalization](./clusters.md#time-normalization).

## See also

- [presentation-timeline-model.md](../presentation-timeline-model.md) —
  **the architectural deep-dive**: the three-timeline coordinate model, the
  discover→derive→apply reactor architecture, the capability axes, and the key
  decisions. This feature doc frames; that doc explains the mechanism.
- [../../../decisions/spf/mse-timestamp-offset.md](../../../decisions/spf/mse-timestamp-offset.md)
  — the mechanism decision (native-PTS default; relocation for the 0-based cases).
- [clusters.md § Time normalization](./clusters.md#time-normalization)
  — cluster B description; this feature is the foundation.
- [mse-mms-pipeline.md](./mse-mms-pipeline.md) — `SourceBuffer.timestampOffset` API surface.
- [SPF Epics Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  — source material; epic #6 (Non-zero PTS / Instant Clip Support).
- [HLS Spec — `EXT-X-START`](https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis#section-4.4.5.2)
  and [`EXT-X-PROGRAM-DATE-TIME`](https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis#section-4.4.4.6).
- [ISO BMFF — `tfdt` box](https://www.iso.org/standard/68960.html) — MP4 media-segment decode-time origin.
