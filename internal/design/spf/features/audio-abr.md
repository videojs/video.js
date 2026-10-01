---
status: draft
date: 2026-05-20
definition: technical
---

# Audio ABR

Bandwidth-driven adaptive bitrate selection for audio. Wires
`createTrackedFetch` into audio segment loading so audio fetches emit
per-chunk bandwidth samples; adds a `switchAudioQuality` behavior
parallel to `switchVideoQuality` that selects audio renditions based
on bandwidth + constraints. The audio sibling of
[video-abr](./video-abr.md) — same sampling-baked-into-loading pattern,
same EWMA + safety-margin algorithm, same constraint-slot manual-
override shape — applied within a single audio rendition group
(typically a set of bitrate-varied AAC stereo renditions in one
language).

A **Media-src feature** in the framing from
[clusters.md § Feature classification axes](./clusters.md#feature-classification-axes):
audio renditions with multiple bitrates won't *adaptively* select
without it (they'll play at the default-picked bitrate regardless of
bandwidth conditions).

## Status

- **Composition:** not implemented in the `hls/video` engine. Today
  [`audio-playback`](./audio-playback.md) is the single-rendition
  baseline; `setupAudioBufferActors`
  (`packages/spf/src/playback/behaviors/dom/setup-buffer-actors.ts`)
  uses plain `fetchStream` (no bandwidth sampling) and there is no
  audio-side equivalent of `switchVideoQuality`. The in-code JSDoc
  on `setupAudioBufferActors` (lines 249-255) explicitly documents
  the audio-ABR wiring change as "a localized change to this setup
  body (swap `fetchStream` for a `createTrackedFetch` call + declare
  `bandwidthState` writable here)."
- **Definition depth:** technical — scope and constraints articulated
  against [video-abr](./video-abr.md)'s sketched precedent; algorithm
  reuses existing primitives (`createTrackedFetch`, `selectQuality`,
  `BandwidthState` EWMA accumulator); audio-specific design decisions
  open. Source material: [SPF Epics Working Doc — epic #8 Audio ABR /
  Multi-bitrate](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  (cluster C, Media-src, eng M-L, validation M; "Depends on #7" —
  the multi-language-audio rendition-group machinery).
- **Prerequisite chain:** Notion #8 lists this as depending on #7
  (multi-language-audio) for the rendition-group machinery. In
  practice, single-rendition audio-playback is the only hard
  prerequisite for the *mechanism*; multi-language-audio enables the
  *interesting case* (multiple audio renditions to switch between
  within a language).

## Phases of complexity

Scope slices mirroring [video-abr.md](./video-abr.md)'s structure.
Phases here are aspirational (technical-depth doc); they describe
what would land, not what exists.

| Phase | What | Notes |
|---|---|---|
| Bandwidth sampling on audio loading | Swap plain `fetchStream` for `createTrackedFetch` in `setupAudioBufferActors`. Audio segment fetches emit per-chunk bandwidth samples via EWMA accumulator, same as video does today | One-line swap per the in-code JSDoc instruction. Affects state-key writability for the setup behavior (declares `bandwidthState` writable). Reuses `createTrackedFetch` + `sampleBandwidth` primitives unchanged |
| Bandwidth state — shared or separate | Decide whether audio samples feed the existing single `state.bandwidthState` slot (multi-writer, shared estimate) or a new `state.audioBandwidthState` slot (per-type independent estimate). Affects EWMA accumulator design and the slot-multi-writer characterization | Open question; the choice constrains the sampling-phase wiring above and the switching-phase reads below. See Open questions |
| `switchAudioQuality` behavior | New behavior parallel to `switchVideoQuality` (`packages/spf/src/playback/behaviors/quality-switching.ts`). Reads `presentation`, `selectedAudioTrackId`, the relevant bandwidth slot; writes `selectedAudioTrackId`. Reuses the pure `selectQuality` algorithm from `media/abr/quality-selection.ts` unchanged | Same EWMA + safety-margin + upgrade-margin algorithm as video. Mirror of video-abr's "Dynamic bandwidth-driven adjustment" phase |
| Manual override via `userAudioTrackSelection` | New constraint slot analog of `userVideoTrackSelection`. Consumer-driven narrowing of the audio candidate set; when only one survives, `switchAudioQuality` short-circuits — same pattern as video-abr's manual override | Open: whether this is a *separate* slot from multi-language-audio's Tier 2 programmatic write or *shares* it. video-abr uses a single slot (`userVideoTrackSelection`) for both pin-to-quality and manual-track-override; the analogous decision for audio is whether one slot handles both bitrate-pinning and language-pinning |
| Multi-writer coordination on `selectedAudioTrackId` | Slot becomes triple-writer: `selectAudioTrack` default + `switchAudioQuality` ABR + (future) `multi-language-audio` Tier 2 programmatic. Same shape as video's `selectedVideoTrackId` triple-writer (default + ABR + external manual override) | Per the multi-writer characterization in [clusters.md § Multi-writer state slots](./clusters.md#multi-writer-state-slots): three writers from different decision domains (config vs derived vs intent) but all writing the same value type (track id). Coordination shape is well-precedented by video |
| Cross-language / cross-channel boundary handling | Audio-ABR operates within a single rendition group (same language, same channel count, same codec). Cross-language switching consumes `multi-language-audio`'s primitive; cross-channel-count switching consumes `5.1-surround-selection`'s `changeType()` primitive | Defines the boundary of "within ABR scope" vs "consumes a sister feature's primitive." Bandwidth-driven switching across codec/channel/language boundaries is more aggressive and exits this feature's surface |

## What's in scope vs out of scope

**In scope:**
- All six phases above for HLS multi-bitrate audio rendition groups
- Audio-side bandwidth sampling via `createTrackedFetch`
- `switchAudioQuality` behavior + interaction with the (existing)
  `selectQuality` algorithm
- `userAudioTrackSelection` constraint slot (or shared-slot
  alternative — see Open questions)
- Same-codec, same-channel-count, same-language ABR switching

**Out of scope (separate Media-src candidate features):**
- **[multi-language-audio](./multi-language-audio.md)** *(coarse)* —
  cross-language switching is its concern. Audio-ABR consumes
  multi-language-audio's rendition-group surfacing (Tier 1) when
  multiple renditions exist within a language; ABR switches *within*
  a language, not across.
- **[5.1-surround-selection](./5.1-surround-selection.md)** — cross-
  channel-count switching consumes its `changeType()` primitive
  (mid-stream codec change phase). Audio-ABR switches *within* a
  channel-count tier; if ABR wants to cross a channel-count boundary
  (e.g., downgrade from AC-3 5.1 to AAC stereo under bandwidth
  pressure), that's 5.1-surround-selection's `changeType()` phase.
- **`[multi-signal-abr]`** *(candidate)* — non-bandwidth signals
  (CPU / thermal / battery) feeding ABR. Same shape as the candidate
  for video; would apply to audio too if it lands.
- **Audio rendition caps** — max-bitrate, max-channels on the audio
  side. Open whether these fold into
  [rendition-selection-caps.md](./rendition-selection-caps.md)
  (which is currently video-only) or carry separately. Cross-ref to
  that doc's "Audio caps" open question.

**Out of scope (different architectural layer):**
- Adapter-level audio-quality picker UI / "audio quality menu"
  customer surfaces.
- Above-engine "current audio bitrate" / "currently switching"
  surfaces. Consumers read `selectedAudioTrackId` + the resolved
  presentation's audio track bandwidth directly.

## Likely cross-cutting impact

Things this feature probably forces decisions on, not just additions:

- **`bandwidthState` multi-writer (if shared).** Today
  `setupVideoBufferActors` is sole writer per the JSDoc at
  `setup-buffer-actors.ts:210`. If audio shares the slot,
  `setupAudioBufferActors` becomes a second writer to the same slot —
  same decision domain (network bandwidth from per-chunk EWMA), same
  trigger (segment fetch sample), same cost (cheap write). The
  easiest multi-writer shape per
  [clusters.md § Multi-writer state slots](./clusters.md#multi-writer-state-slots);
  the only real design question is how the EWMA accumulator handles
  samples from two sources. Two sub-questions: (a) does one shared
  accumulator absorb both video and audio samples (mixes them at
  sample time), or (b) does the slot hold separate per-source
  accumulators that compose at read time? The current `BandwidthState`
  shape would need a small extension either way.
- **`selectedAudioTrackId` writer characterization.** As of multi-
  language-audio Tier 2 landing, the slot stays **single-writer** —
  `switchAudioTrack` (in `playback/behaviors/track-switching.ts`)
  is the sole writer. Consumer intent flows through the
  `userAudioTrackSelection` constraint+filter slot. Mid-stream flush is
  dispatched from `switchAudioTrack` itself (slot owner = flush dispatcher
  — keeps slot writes and consequences co-located, sitting architecturally
  between `SegmentLoaderActor` and `SourceBufferActor`). When audio-abr
  ships, `switchAudioQuality` extends `switchAudioTrack` with bandwidth +
  ABR algorithm — either by rename + extension or as a sibling variant
  that supplants it in the engine composition. Either way, the slot stays
  single-writer and the filter shape carries over.
- **Constraint+filter vs multi-writer for the manual-override slot.**
  video-abr's `userVideoTrackSelection` slot is a *constraint+filter*
  (the selection writer reads it as a filter; doesn't write the
  selection directly). Audio's manual-override slot could be the
  same shape (`userAudioTrackSelection` filters the candidate set
  for `switchAudioQuality`), OR multi-language-audio Tier 2 could
  introduce a *separate* programmatic-write path that directly
  writes `selectedAudioTrackId` for language switches. Whether
  bitrate-pinning and language-pinning share a slot or split affects
  the multi-writer count on `selectedAudioTrackId`.
- **EWMA accumulator under sample-source mixing.** If video and audio
  samples both feed the same accumulator, the EWMA estimate is biased
  by the sample-size distribution: a small audio segment (~50KB) and
  a large video segment (~2MB) both produce one sample, but their
  bandwidth measurements may differ (audio fetches may not warm the
  network path as effectively). Two mitigation shapes: (a) weight
  samples by byte count at accumulator-update time, (b) keep per-
  source accumulators and read `min(video, audio)` similar to today's
  `min(fast, slow)` read pattern. The dual-EWMA pattern already
  precedents the latter approach.
- **`selectQuality` algorithm reuse.** `selectQuality` in
  `media/abr/quality-selection.ts` is a pure function over `Track[]`
  + `BandwidthState` + config. It should reuse verbatim for audio;
  the algorithm doesn't depend on track type. However, the safety/
  upgrade-margin defaults are tuned for video bitrate scales (Mbps);
  audio scales are ~10× smaller (kbps). Whether the same defaults
  work for audio or whether audio wants its own tuning is an open
  question.
- **Engine composition order.** `switchVideoQuality` is composed
  after `setupSourceBuffers` + `trackCurrentTime` per
  [hls-engine.md](../../../../packages/spf/docs/hls-engine.md)
  (Stage 6). `switchAudioQuality` would compose at the same point or
  immediately after. Engine variants without audio-ABR continue to
  use `selectAudioTrack` (the single-pick behavior); engine variants
  with audio-ABR substitute `switchAudioQuality` — same
  mutually-exclusive pattern as video-abr's
  `switchVideoQuality`/`selectVideoTrack` alternatives.
- **Audio caps integration with
  [rendition-selection-caps.md](./rendition-selection-caps.md).**
  That doc explicitly flags audio caps as an open question ("Audio
  renditions don't have height analogs but could have max-bitrate or
  max-channels caps. Extend this feature to cover audio or carry
  audio caps separately?"). When audio-ABR lands, audio caps become
  load-bearing; the open question needs resolution.

## Open questions

- **Shared `bandwidthState` slot vs separate `audioBandwidthState`.**
  Per the cross-cutting note above. Trade-off: shared = one network
  estimate, samples from two sources biased toward one if sizes
  differ greatly; separate = independent per-type estimates, but
  redundant data structure with similar semantics. Decision likely
  depends on whether the EWMA pattern wants extension to handle
  mixed-source sampling, or whether two slots is genuinely cleaner.
- **Manual-override slot sharing.** `userAudioTrackSelection` slot
  exists now (added by multi-language-audio Tier 2) and serves
  language-pinning. Open: does audio-abr reuse the same slot for
  bitrate-pinning too (one slot, dual role, mirrors video) — likely,
  since the partial-track shape supports both. Side-effect concerns
  (mid-stream flush) live in `switchAudioTrack`'s flush effect and key
  off `initTrackId` vs `selectedAudioTrackId` mismatch — they fire on
  language-switch and would naturally also fire on cross-codec
  bitrate-switch (whose handling routes to 5.1-surround-selection's
  `changeType()` path via a different `flushStrategy`).
- **EWMA accumulator design under shared bandwidth state.** Single
  unified accumulator absorbing both video and audio samples, vs
  per-source accumulators read with a combining function (e.g.,
  `min(videoEwma, audioEwma)` similar to today's `min(fast, slow)`
  pattern). The dual-accumulator pattern is precedented; the audio-
  inclusive variant is a small extension.
- **Audio-side safety / upgrade margin tuning.** Video defaults
  (`safetyMargin: 0.85`, `upgradeMargin: 1.15`) are tuned for video
  scales. Audio bitrate ratios are different (a "next quality" audio
  rendition is often 2× the bitrate of the previous, vs video's more
  granular tiers); margin tuning may differ. Likely defer until
  empirical data.
- **Cross-codec-tier ABR scope.** When AAC stereo bitrate variants
  coexist with AC-3 5.1 in the same audio rendition group (or
  selection set), can ABR cross the codec boundary, or stays within
  one codec? Closes back into 5.1-surround-selection's `changeType()`
  territory; this feature's scope is "within a codec" by default.
- **Audio caps inclusion in rendition-selection-caps.md.** Per the
  cross-cutting note. Resolution likely punts to when audio-ABR + the
  first audio cap motivation both land.
- **`picker` config for audio-ABR initial selection.** video-abr's
  config includes a `picker` for overriding initial selection.
  Whether audio-ABR exposes the same `picker` config (parallel
  `audio.picker`?) or relies on `audio-playback`'s existing
  `SelectAudioTrackConfig.picker` for initial pick before ABR
  re-evaluation kicks in.

## Related features

- **[video-abr](./video-abr.md)** *(structural template)* — the
  direct parallel-sibling on the video axis. Same sampling-baked-
  into-loading pattern, same algorithm, same constraint-slot manual-
  override. The audio doc mirrors the video doc's shape with audio-
  specific design decisions (bandwidth-state sharing, multi-writer
  with multi-language-audio Tier 2) layered on top.
- **[audio-playback](./audio-playback.md)** — the single-rendition
  baseline this feature extends. The "What's not implemented" Audio
  ABR bullet there is resolved by this doc.
- **[multi-language-audio](./multi-language-audio.md)** *(partial, sketched)* —
  prerequisite per Notion #8 for the rendition-group machinery, now mostly
  implemented. Audio-ABR operates within a language; multi-language-audio
  handles across-language switching. Shared infrastructure landed:
  `userAudioTrackSelection` filter slot, `switchAudioTrack` behavior
  (slot owner; precursor to `switchAudioQuality`), and pluggable
  `flushStrategy` config with `nextSegmentBoundaryFlushStrategy` as the
  default. Audio-abr Phase 3's `switchAudioQuality` either renames
  `switchAudioTrack` + adds bandwidth logic, or coexists with it as a
  sibling variant in the engine composition.
- **[5.1-surround-selection](./5.1-surround-selection.md)** —
  consumes its `changeType()` primitive for cross-channel-count
  switching when audio-ABR wants to cross those boundaries.
- **[buffer-management](./buffer-management.md)** — sampling lands in
  this feature's audio fetch path (`setupAudioBufferActors`); same
  shape as video's `bandwidthState` sample-producer relationship to
  buffer-management.
- **[mse-mms-pipeline](./mse-mms-pipeline.md)** — owns
  `setupAudioBufferActors` where the `createTrackedFetch` swap
  happens. Same-codec, same-channel-count switching doesn't touch
  the SourceBuffer lifecycle.
- **[rendition-selection-caps](./rendition-selection-caps.md)** —
  the "Audio caps" open question becomes load-bearing when audio-ABR
  ships. Cross-link.
- **[multi-signal-abr](./multi-signal-abr.md)** — non-bandwidth
  signals feeding ABR; extends both video and audio via shared signal-
  monitor infrastructure with per-type bias calculation.
- **`[bandwidth-estimation]`** *(coarse, not yet documented,
  candidate)* — the dual-EWMA accumulator is a reusable primitive.
  Audio-ABR is the second consumer; promoting `BandwidthState` to
  its own feature doc may become worthwhile.

## Use cases that compose this feature

- **[`audio-only-mode-override`](../use-cases/audio-only-mode-override.md)**
  *(coarse)* — Phase 2 constituent. When audio-abr is
  implemented, the audio-only delivery variant composes it for
  multi-bitrate audio support. Used as-is.

## See also

- [video-abr.md](./video-abr.md) — structural template; the
  parallel-sibling doc this one mirrors on the audio axis
- [clusters.md § Track & variant registry](./clusters.md#track--variant-registry)
  — cluster C description
- [clusters.md § Sampling-baked-into-loading](./clusters.md#sampling-baked-into-loading)
  — cross-cluster pattern this feature instantiates; audio is the
  second consumer of the pattern
- [clusters.md § Multi-writer state slots](./clusters.md#multi-writer-state-slots)
  — `bandwidthState` (if shared) and `selectedAudioTrackId` both
  become multi-writer; characterized in cross-cutting-impact bullets
- [conventions/signals.md](../conventions/signals.md) — multi-writer
  slot conventions
- [packages/spf/docs/hls-engine.md](../../../../packages/spf/docs/hls-engine.md)
  — Stage 6 documents the video-ABR composition point; audio-ABR
  composes at the same Stage 6 location
- [SPF Epics Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  — source material; epic #8 (Audio ABR / Multi-bitrate), depends on
  #7 (Multi-language Audio Tracks)
- [Mux Video Permutations Matrix](https://www.notion.so/32c97a7f89d08191b84dd30f06685490)
  — Stream Type / Audio bitrate section
