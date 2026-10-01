---
status: draft
date: 2026-05-21
definition: coarse
---

# Video-only mode override

Engine variant that delivers video-only playback. Composes regardless of
source shape: handles both truly video-only HLS sources (manifests with
no audio renditions) and mixed-AV sources (audio renditions ignored at
composition time). The variant decision is encoded in the adapter
choice. Inverse-axis sibling of
[`audio-only-mode-override`](./audio-only-mode-override.md).

This is a Player-level composition variant per [`../features/clusters.md` §
Feature classification axes](../features/clusters.md#feature-classification-axes).
It subsumes what Notion originally framed as two separate concerns
(Notion epic NEW-A "Basic Video-only" — source-shape correctness — and
epic NEW-B "Video-only Composition" — delivery-mode choice) into a single
composition with two variant-decision-source paths
(see *Variant-decision signal source* below).

[`background-video`](./README.md#index) *(forward-ref; not yet
documented)* is a related-but-distinct Mux product scenario that may
compose this use case as part of a broader assembly (loop +
autoplay-muted + GPU/thermal-aware caps). See
[GitHub #873 (mux-background-video)](https://github.com/videojs/v10/issues/873)
for product context.

## Status

- **Composition:** not implemented. The use case requires a parallel
  engine-factory + adapter pair, neither of which exists today.
  The `hls/video` engine composes the full video + audio pipeline; this
  variant would compose a subset.
- **Definition depth:** coarse — variant shape sketched, engine-factory and
  adapter shapes named at the level of "parallel siblings to the existing
  pair," implementation specifics tracked as open questions.
- **Source material:** Notion epics
  [NEW-A](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4) (Basic
  Video-only, Eng=S / Validation=S) and
  [NEW-B](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  (Video-only Composition, Eng=M / Validation=M). Originally classified
  as separate Case-1 (Media-src composition case) + Case-2 (Player
  composition case) concerns; consolidated here because both ship the
  same engine factory and adapter, distinguished only by which signal
  sources the variant decision.
- **Mux relevance:** [GitHub #873 (mux-background-video)](https://github.com/videojs/v10/issues/873)
  is product-adjacent — distinct use case (`background-video`) that
  shares constituent features but addresses a different delivery scenario.

## Target delivery context

**Source-shape correctness — truly video-only sources** (where the manifest
declares only video renditions and no audio):

- **Video-only HLS assets** — sources published without audio tracks
  (silent ambient/hero video, ad insertions, certain background-loop
  prerolls). Today's engine tolerance for missing audio is less
  established than for missing video (see *Open questions*); this
  variant composes the video-only pipeline *explicitly* and supplants
  the implicit tolerance.

**Delivery-mode choice — mixed-AV sources delivered as video-only**:

- **Muted-autoplay social feeds** — autoplay-muted video tiles where audio
  decode + transmission is wasted bandwidth and CPU.
- **GIF-replacement ambient video** — short-loop or hero-area video used as a
  visual element; no audio track ever audible.
- **Mux-billing-driven video-only sessions** — Mux billing context may make
  video-only sessions cheaper (audio bandwidth not delivered); consumers opt
  in to reduce billing.
- **Silent-content authoring tools** — preview / editorial surfaces where
  audio is always muted by the surface design.
- **Captioned-only consumption surfaces** — when paired with [`subtitles`](../features/subtitles.md)
  (Phase 2), enables a "muted video + captions" delivery pattern for
  accessibility-first or quiet-environment contexts.

Common to all: the *delivery* is video-only. The variant composes
identically across both source shapes; what differs is the
*variant-decision source* (see below).

## Phases of complexity

| Phase | What |
|---|---|
| **1 — Basic functionality** | Parallel engine-factory + adapter pair. The engine module (an `hls/video-only` entry point or similar — mirroring the audio-axis sibling's `hls/audio`) composes the video-side subset of the `hls/video` engine's behavior list, subtracting audio-side behaviors entirely. The adapter (`HlsVideoOnlyMediaElement` or similar) wraps that engine. Includes empirical verification of Firefox `mozHasAudio` behavior under subtractive-audio composition — both for genuinely-no-audio sources and for mixed-source manifests with audio subtractively-composed-out (the latter behavior is less established and may differ from the former) |
| **2 — Features/functionality relevant to the use case** | Compose constituent feature behaviors as they land: [`subtitles`](../features/subtitles.md) for muted-video + captions a11y delivery pattern (a canonical video-only consumption shape). [`multi-language-audio`](../features/multi-language-audio.md) is *not* relevant here (audio subtracted), and Phase 2's "audio-abr-equivalent" doesn't apply on the video axis (video-abr is already Phase 1 baseline) |
| **3 — Optimizations** | Alternative default configurations for video-only delivery: possibly muted-by-default playback (browser autoplay policies often allow muted-autoplay), GPU/thermal-aware quality caps when the consumer surface is known low-attention (ambient/background video), simpler `endOfStream` paths (single SourceBuffer to coordinate). Per [`README.md` § Implementation note](./README.md#implementation-note-customizing-behaviors-for-use-cases), the Path-A vs Path-B judgment applies for any behavior whose Phase 3 customization significantly diverges from the default |

## Composition specifics

Phase 1 is subtractive-only; Phases 2 and 3 surface the other mechanisms.

### Behaviors subtracted (Phase 1)

From the `hls/video` engine's composition, omit:

- `selectAudioTrack` — no audio rendition selection
- `resolveAudioTrack` — no audio media playlist fetch
- `setupAudioBufferActors` — no audio `SourceBuffer` / actor
- `loadAudioSegments` — no audio segment loading
- Audio-side bandwidth-sampling machinery (when [`audio-abr`](../features/audio-abr.md)
  lands, the audio path's `createTrackedFetch` would not be composed)

### Behaviors added (Phase 1)

**None.** This use case ships as an *independent adapter* paired with its own
engine factory. The variant-decision is encoded in the adapter choice itself —
consumers instantiate `HlsVideoOnlyMediaElement` to opt in. No runtime
variant-decision behavior is needed.

### Alternative implementations (Phase 3 candidates)

- Possibly a muted-default-aware playback behavior. Phase 3 surfaces this
  candidate; the Path-A vs Path-B judgment per
  [`README.md` § Implementation note](./README.md#implementation-note-customizing-behaviors-for-use-cases)
  defers.

### Alternative default configurations (Phase 3 candidates)

- **Muted-by-default playback** — Phase 1 leaves muted/unmuted to the consumer;
  Phase 3 may set muted as the default given browser autoplay policies. May
  be adapter-layer rather than engine-variant — boundary question.
- **GPU/thermal-aware quality caps** — for low-attention consumer surfaces
  (ambient video, background tabs), cap video quality based on GPU/thermal
  signals. Likely shared with `background-video`'s broader scenario.
- **Buffer-target tuning** — depends on consumer surface. Background/ambient
  video may want shorter buffers (lower priority); foreground muted-autoplay
  may want normal buffers. Probably consumer-policy rather than engine
  default.

## Constituent features

Phase 1 baseline:

- **[`video-abr`](../features/video-abr.md)** — used as-is. Multi-bitrate
  video selection (the engine's existing ABR algorithm). The variant always
  plays video.
- **[`engine-adapter-integration`](../features/engine-adapter-integration.md)** —
  used with an alternative adapter shape. The variant ships its own
  `HlsVideoOnlyMediaElement`-style adapter parallel to
  `HlsVideoAdapterCore`. The mixin pattern
  composes unchanged.
- **[`mse-mms-pipeline`](../features/mse-mms-pipeline.md)** — used as-is.
  `MediaSource` + `endOfStream` gate compose unchanged across variants. The
  **Firefox `mozHasAudio` invariant** documented in this feature is more
  pointedly relevant: the variant must produce `mozHasAudio=false` cleanly
  under subtractive-audio composition, and the behavior under mixed-source
  manifests-with-audio-subtracted may differ from genuinely-no-audio sources.
  Phase 1 verification covers this.
- **[`buffer-management`](../features/buffer-management.md)** — used as-is in
  Phase 1; Phase 3 surfaces alternative defaults / candidate Path-B behaviors
  (loop-friendly buffer fetching is `background-video`'s concern,
  not this use case's).

Phase 2 (when relevant):

- **[`subtitles`](../features/subtitles.md)** — already implemented. The
  variant composes this for muted-video + captions a11y delivery. Phase 2
  rather than Phase 1 because not every video-only consumer surface needs
  captions (e.g., ambient/decorative video doesn't), but it's the canonical
  consumption pairing for accessible video-only delivery.

## Customer-policy surface

The variant ships as an **independent adapter** parallel to
`HlsVideoAdapterCore`:

```ts
// Default (mixed AV delivery)
const player = new HlsVideoAdapterCore();
player.src = mixedSourceUrl;

// Video-only mode override
const videoPlayer = new HlsVideoOnlyMediaElement();
videoPlayer.src = sameMixedSourceUrl;
```

The adapter encodes the mode choice; no runtime config flag or
detect-from-parser logic is involved. Consumers select the adapter that
matches their delivery surface.

Specific consumer-facing properties (autoplay-muted defaults, loop flag,
GPU/thermal caps, etc.) are adapter-layer concerns, not engine-variant
concerns. The engine-variant surface is the composition itself; the adapter
wraps it with the API consumers actually call.

## Variant-decision signal source

The variant composes identically regardless of signal source. Two paths
exist; both target the same engine factory:

**1. Adapter-upfront (target Phase 1).** Selecting
`HlsVideoOnlyMediaElement` over `HlsVideoAdapterCore` *is* the
variant choice. No detect-from-parser logic, no runtime config branch.
Used by consumers that know they want video-only delivery (the
delivery-mode-choice scenarios in *Target delivery context*).

**2. Detect-from-parser (future).** A routing-from-default-adapter path
where `HlsVideoAdapterCore` (or a higher-level adapter) detects a
video-only source shape from the parsed presentation
(`presentation.audioTracks` empty) and switches its internal engine
factory to the video-only variant for that source. Targets the
source-shape-correctness scenario without forcing consumers of
video-only sources to opt into a separate adapter type. Not yet built.

Both paths coexist by design — same shape as the audio-axis sibling
[`audio-only-mode-override`](./audio-only-mode-override.md), whose Phase 1
implementation pass landed the shared-factory pattern (see that doc's
*Variant-decision signal source* section).

## Likely cross-cutting impact

- **Firefox `mozHasAudio` empirical verification.** Today's engine
  tolerance for missing-audio sources is less established than for
  missing-video. Phase 1 verifies the variant under both source shapes:
  genuinely-no-audio manifests and mixed-source manifests with audio
  subtractively composed out. Per
  [`mse-mms-pipeline`](../features/mse-mms-pipeline.md), `mozHasAudio` is
  the cross-type invariant motivating the current per-type buffer
  coordination — the video-only variant should produce
  `mozHasAudio=false` cleanly in both cases.
- **Adapter shape proliferation.** Each use-case composition that gets its
  own adapter multiplies the adapter surface. Shared concern with
  `audio-only-mode-override` and forthcoming use cases.
- **Relationship with `background-video`.** Distinct use case (Mux's
  background-video product scenario); shared constituent features but
  different delivery scenario. Background composes loop + autoplay-
  muted + GPU/thermal-aware caps + likely silent-video delivery; this use
  case is the narrower "deliver video-only" piece. Background-video
  may compose this use case's engine factory as one of its building blocks,
  or share constituents at the feature level — cross-link as peer use cases.
- **Test coverage for mixed-source video-only delivery.** New test coverage
  parallel to `engine.test.ts` "handles audio-only stream" but exercising a
  *mixed-source manifest* fed into the video-only variant. Covers: audio
  tracks present in `presentation.audioTracks` but not composed; video-side
  fully exercised; no audio appendBuffer calls; `mozHasAudio=false` under
  Firefox.

## Open questions

- **Empirical verification of video-only tolerance.** Does the current
  `hls/video` engine handle video-only manifests cleanly, or does
  `setupAudioBufferActors` / `loadAudioSegments` fail or no-op
  inconsistently when `presentation.audioTracks` is empty? Test fixture
  work needed before scoping the variant implementation in detail. Phase
  1 of this variant supplants the implicit tolerance entirely by
  composing the audio-side behaviors out, so the answer informs the
  rollout plan more than the variant's correctness.
- **Adapter naming.** Lean: `HlsVideoOnlyMediaElement` to mirror the
  audio-axis sibling's `HlsAudioAdapterCore` (which landed in
  Phase 1 of that use case). Aligns with the existing
  `Simple{Variant}HlsMediaElement` naming pattern in
  `packages/spf/src/playback/engines/hls/`.
- **Subtitle Phase 1 vs Phase 2.** Currently Phase 2 (per the doc-type-spec
  scoping discussion). Open whether muted-video + captions a11y pattern
  should promote to Phase 1 baseline — depends on whether the canonical
  video-only consumer surface is ambient (no captions) or accessible (with
  captions). May resolve by deferring the question to per-consumer adapter
  configuration.
- **Muted-by-default boundary.** Phase 3 alternative-defaults candidate;
  open whether this lives at engine-variant level (engine composes a
  muted-default behavior) or adapter level (adapter sets `muted = true` on
  the underlying media element). Likely adapter.
- **GPU/thermal-aware quality caps boundary.** Likely shared with
  `background-video`; may belong at the use-case level there rather
  than here. Worth scoping in the background-video doc when it
  lands.
- **Mux-billing integration.** Same shape as audio-only-mode-override —
  billing context likely surfaces at adapter / consumer level.
- **Variant-decision source for live + video-only.** Live + video-only
  intersection (silent live feeds, ambient live cameras) — same
  adapter-upfront pattern, or does live add complications? Shared open
  question with `audio-only-mode-override`'s live + audio-only intersection.

## Related features

- **[`video-abr`](../features/video-abr.md)** — constituent baseline.
- **[`engine-adapter-integration`](../features/engine-adapter-integration.md)** —
  constituent; variant adapter parallels `HlsVideoAdapterCore`.
- **[`mse-mms-pipeline`](../features/mse-mms-pipeline.md)** — constituent;
  composes unchanged. Firefox `mozHasAudio` cross-type invariant verification
  is Phase 1 scope.
- **[`buffer-management`](../features/buffer-management.md)** — constituent;
  Phase 3 candidates surface here.
- **[`subtitles`](../features/subtitles.md)** — Phase 2 constituent.
  Muted-video + captions a11y delivery pattern.

## Related use cases

- **[`audio-only-mode-override`](./audio-only-mode-override.md)** —
  inverse-axis sibling. Same shape, audio-side instead of video-side. The
  joint resolution of the "engine variant factory shape" open question
  applies to both.
- **`[background-video]`** *(forward-ref; not yet documented)* —
  peer use case. Mux's background-video product scenario: loop +
  autoplay-muted + GPU/thermal-aware caps + likely silent-video delivery.
  **Distinct from this use case** despite shared Mux consumer context and
  overlapping constituent features. Background-video may compose
  this use case's engine factory as one of its building blocks, or compose
  shared constituents directly — resolution depends on whether
  "use-case-composing-use-case" emerges as a pattern. Cross-link as peer.

## See also

- [`README.md`](./README.md) — use-case-composition doc-type spec
- [`audio-only-mode-override.md`](./audio-only-mode-override.md) — inverse-axis sibling use case
- [`../features/clusters.md` § Composition vs Policy vs middle pattern](../features/clusters.md#composition-vs-policy-vs-middle-pattern) — composition implementation shape
- [`../features/clusters.md` § Feature classification axes](../features/clusters.md#feature-classification-axes) — Notion's Composition cases per mode framing
- [`../conventions/behaviors.md` § Inverse: behaviors that operate uniformly across tracks](../conventions/behaviors.md#inverse-behaviors-that-operate-uniformly-across-tracks) — composition-variant discipline
- [SPF Epics Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4) — Notion epic NEW-B
- [GitHub #873 (mux-background-video)](https://github.com/videojs/v10/issues/873) — peer-use-case source material
- [`mux-background-video` repo](https://github.com/muxinc/mux-background-video) — prior-art reference
- [`packages/spf/docs/hls-engine.md`](../../../../packages/spf/docs/hls-engine.md) — current HLS engine composition walkthrough; the variant subtracts from this baseline
