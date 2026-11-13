---
status: draft
date: 2026-05-20
definition: coarse
---

# Container support

Support for media container formats beyond the MSE-native fMP4
(fragmented MP4) — primarily MPEG-TS (Transport Stream, `.ts`
segments) common in legacy HLS sources. MPEG-TS is not directly
appendable to a `SourceBuffer` per the MSE spec; supporting it
requires a **client-side transmuxer** that demuxes MPEG-TS packets
and remuxes them into fMP4 for MSE consumption. Standalone feature
in the engine taxonomy (cluster-less) because the concern is
fundamentally different from cluster D's capability-probing: cluster
D probes what the browser can decode *within MSE-accepted
containers*; this feature addresses *containers MSE doesn't accept
at all*.

## Status

- **Composition:** implemented as an opt-in subset. `mpegTsTransmuxFeature`
  and `mpegTsAudioTransmuxFeature` transmux MPEG-TS (H.264 + AAC) to
  fMP4 between fetch and append, and the `hls-video-mpeg-ts`,
  `hls-audio-mpeg-ts`, and `hls-background-video-mpeg-ts` engines
  compose them. The coverage is what Mux Video packages for on-demand
  playback at its plus tier; its basic and premium tiers are CMAF. The
  container-neutral engines are unchanged: they
  still detect MPEG-TS renditions (`parse-media-playlist.ts`,
  `NON_FMP4_CONTAINER_MIMES` in `media/dom/capabilities.ts`) and
  prune them before selection.
- **Definition depth:** coarse — scope sketched at the strategic-
  posture level. Concrete implementation work would require an RFC
  (per Notion epic #5) given the major code footprint.
- **Strategic posture (as of 2026-05-20):** not in scope, on the
  premise that Mux Video delivers fMP4 throughout. That premise was
  wrong: Mux's plus tier delivers on-demand assets as MPEG-TS, which is
  what the opt-in subset above plays. Mux also delivers standard- and
  reduced-latency live streams as MPEG-TS, which the subset does not
  cover, and an instant clip keeps its source's container. General MPEG-TS (other codecs,
  SAMPLE-AES, discontinuities, PTS rollover) remains out of scope;
  hls.js is the answer for it.
- **Revisit conditions** documented in Open questions.

## Phases of complexity

Brief sketch of what container-support would require if scope
changed. Two phases capture the structural shape; neither is
in-progress.

| Phase | What | Notes |
|---|---|---|
| Container-format detection | Detect non-fMP4 segments before MSE handoff. Two signals: (a) HLS multivariant `CODECS` attribute (e.g., `mp2t` indicates MPEG-TS) and segment URL extension (`.ts` vs `.m4s` / `.mp4`); (b) segment magic-byte sniffing (MPEG-TS sync byte `0x47` at packet boundaries). Engine routes to transmuxer when MPEG-TS detected; bypasses for fMP4 | Detection is small. Parser-side change to surface container-format on each rendition. Cross-cluster with [presentation-modeling](../presentation-modeling.md) (parser gains a `container: 'fMP4' \| 'mpegts'` field on resolved tracks). Could integrate with [capability-probing](./capability-probing.md)'s filter (filter out MPEG-TS variants if transmuxer is unavailable / disabled) |
| Transmuxer integration | Demux MPEG-TS packets (split PES streams by stream ID; extract elementary streams for video / audio); re-mux into fMP4 (build moof + mdat boxes per segment). Stream-by-stream operation through the existing fetch pipeline. Configuration includes PMT parsing (which streams are in the source), PSI table tracking | The major code footprint. Reference implementations: [mux.js transmuxer](https://github.com/videojs/mux.js) (Video.js v8 prior art), [hls.js's transmuxer](https://github.com/video-dev/hls.js) (per-format demuxers). Either embed an existing library (dependency cost + maintenance) or write a focused subset (substantial work). Output feeds the existing `SourceBuffer.appendBuffer` pipeline unchanged — once transmuxed, downstream MSE handling is identical |

## What's in scope vs out of scope

**In scope (if built):**
- Container-format detection (parser + segment-magic-byte sniffing)
- MPEG-TS → fMP4 transmuxing for engine-side consumption
- PMT/PSI parsing for stream identification
- Codec extraction from MPEG-TS PES streams (codec data lives in
  PMT, not in segment URLs; affects capability-probing's CODECS
  filter)
- Integration with the existing fetch / SourceBuffer-append pipeline
  (transmuxer is a transformation step between fetch and append)

**Out of scope (separate concerns):**
- **Other rare containers** — WebM, MKV, etc. in HLS context are
  vanishingly rare. Container-support's first (and likely only)
  customer is MPEG-TS.
- **Codec-level transmuxing** — converting H.264 to HEVC or AAC to
  AC-3 is not transmuxing; it's transcoding. Out of scope for any
  engine-side feature.
- **DASH-style segments** — DASH uses fMP4 (or its older variant);
  not a container-support concern.
- **[capability-probing](./capability-probing.md)** — adjacent but
  distinct. Capability-probing answers "what codecs can MSE decode
  in fMP4?"; this feature answers "what containers can the engine
  hand to MSE at all?" Could feed: container-format detection
  could surface in capability-probing's multivariant-CODECS-filter
  phase (filter out MPEG-TS variants when transmuxer disabled).

**Out of scope (different architectural layer):**
- Server-side transmuxing infrastructure. Mux's strategic posture
  is service-side fMP4 conversion (no client-side transmuxer
  required). This feature is the alternative if service-side
  conversion isn't available.
- Customer-facing "container format" telemetry. Engine surfaces
  container metadata; adapter renders if needed.

## Likely cross-cutting impact

If/when scope changes, this feature would force decisions on:

- **Transmuxer as a dependency or inline code.** Embed mux.js or
  equivalent (heavy dep, well-tested) vs write a focused subset
  (smaller code; potentially less robust). Mux.js is the most
  mature reference; size-vs-control trade-off applies. The
  decision affects bundle size for consumers who don't need
  MPEG-TS support (worth opt-in vs always-bundled).
- **Detection vs probing.** Container-format detection is signal-
  driven (parser sees the codec / URL hint, or segment-byte sniff
  confirms). Container-format *probing* (can the engine handle
  this format?) is more like cluster D — but with this feature
  carved out as standalone, the probing question lives here:
  "is the transmuxer composed in the engine variant?"
- **Composition-variant placement.** Transmuxer composes into engine
  variants that opt into MPEG-TS support. Most engines would not
  carry it (fMP4-only sources); MPEG-TS-supporting variants
  compose it as an extra stage between segment-fetch and
  SourceBuffer-append. Per the composition-variant catalog entry:
  variant-specific behavior, not runtime branch in a uniform
  segment-loader.
- **Codec data routing.** In fMP4, codec info is in the init
  segment's `stsd` box (and surfaces via HLS `CODECS` attribute);
  in MPEG-TS, codec info is in the PMT (Program Map Table). The
  parser/probing path differs; capability-probing's filter
  signature may need a per-container variant.
- **Bandwidth-sampling adjustment.** Transmuxer output (fMP4) is
  generally larger than MPEG-TS input by a small overhead. Per-
  chunk bandwidth samples should sample the *fetched* MPEG-TS
  bytes (network bandwidth) rather than the *transmuxed* fMP4
  bytes (post-processing). Worth confirming
  `createTrackedFetch`'s sampling captures the raw fetch
  payload regardless.
- **Performance considerations.** Transmuxer runs per-segment
  synchronously between fetch and append. CPU cost adds latency
  to time-to-first-frame. Live + MPEG-TS combination may stress
  this further (low-latency live can't afford transmux latency
  spikes).
- **MPEG-TS-specific edge cases.** Discontinuities mid-stream,
  variable packet sizes, PES packet boundaries spanning segments,
  scrambling (encrypted MPEG-TS variant). Real complexity.

## Open questions

- **Revisit conditions.** Under what circumstances does Mux's
  fMP4-only posture change such that this feature becomes worth
  building? Plausible triggers: (a) significant customer demand for
  legacy MPEG-TS sources that can't be re-encoded; (b) acquisition
  of a customer base with MPEG-TS-only delivery; (c) interop with
  third-party CDNs that serve MPEG-TS only. Document explicitly so
  future product / engineering can revisit.
- **Container-detection extension to capability-probing.** Even
  without building the transmuxer, capability-probing's multivariant
  filter could surface MPEG-TS variants in the rendition list and
  *filter them out* (since the engine can't handle them). This is
  the lower-cost intermediate option: detect + reject cleanly
  rather than failing late at append. Worth doing without
  committing to the transmuxer.
- **Transmuxer dependency choice.** If built: embed mux.js (well-
  tested, large) vs write minimal subset (smaller, less robust).
  Premature to resolve; the strategic posture is "not built."
- **Standalone vs cluster D recategorization.** Currently
  cluster-less per Notion epic #5's framing. Could fold into
  cluster D if container-format probing (not transmuxing) is the
  in-scope subset. Depends on how scope evolves.
- **HLS spec extension support.** Modern HLS allows mixed-container
  presentations (some renditions fMP4, others MPEG-TS) — rare in
  Mux content but possible. Detection per-rendition would handle
  this naturally.
- **Notion-flagged: RFC route.** Per Notion epic #5: "Possibly an
  RFC, not an epic." If revisited, this should go through `rfc/`
  for cross-team alignment rather than directly to implementation.
  Worth flagging in repo conventions.

## Related features

- **[capability-probing](./capability-probing.md)** — adjacent but
  distinct. The "container-detection extension" open question is
  where these features intersect. Container-detection-without-
  transmuxer is the low-cost overlap; full transmuxer support is
  this feature's separate scope.
- **[presentation-modeling](../presentation-modeling.md)** — parser
  extension to surface `container` field on resolved tracks.
- **[mse-mms-pipeline](./mse-mms-pipeline.md)** — consumer of
  transmuxed output (unchanged from fMP4 perspective).
- **[buffer-management](./buffer-management.md)** — segment fetch
  feeds the transmuxer (when composed); otherwise unchanged.
- **[video-abr](./video-abr.md)** / **[audio-abr](./audio-abr.md)**
  — bandwidth sampling samples the fetched bytes (raw segment
  size), not the post-transmux output.
- **[live-stream-support](./live-stream-support.md)** *(not
  implemented)* — live + MPEG-TS combination would stress
  transmuxer performance; latency spikes from transmux would
  affect live-edge tracking.

## See also

- [SPF Epics Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  — source material; epic #5 (MPEG-TS Container Support; classified
  as "Strategic decision / Media-src; Possibly an RFC, not an epic")
- [capability-probing.md](./capability-probing.md) — adjacent
  feature; "container-detection scope" open question intersects
- [Mux Video Permutations Matrix](https://www.notion.so/32c97a7f89d08191b84dd30f06685490)
  — Container Format row; SPF column shows fMP4-only support
- [mux.js (Video.js v8 transmuxer)](https://github.com/videojs/mux.js)
  — prior-art reference for the transmuxer scope
- [hls.js transmuxer](https://github.com/video-dev/hls.js/tree/master/src/demux)
  — alternate prior-art reference
- [MSE Spec — byte stream formats](https://w3c.github.io/media-source/byte-stream-format-registry.html)
  — spec reference for what MSE accepts (fMP4 + WebM; MPEG-TS not
  listed)
- [HLS Spec — `EXT-X-MAP` (segment containers)](https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis)
  — HLS spec reference for how containers are declared per segment
