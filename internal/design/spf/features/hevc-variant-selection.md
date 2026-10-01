---
status: draft
date: 2026-05-20
definition: technical
---

# HEVC variant selection

Capability-aware variant selection for HEVC/H.265: filter
`presentation.videoTracks` to the codec(s) the browser supports
(with implicit AVC fallback), plus customer-driven codec preference,
plus optional mid-stream codec switching via `SourceBuffer.changeType()`
between AVC and HEVC variants.

A **Media-src feature** in the framing from
[clusters.md § Feature classification axes](./clusters.md#feature-classification-axes)
at Tier 1; a **Player feature** at Tier 2 (customer-driven overrides
layered on top of Tier 1). The feature is a *consumer* of
[capability-probing](./capability-probing.md) — that doc owns "can the
browser play this codec?" + the `changeType()` probe; this doc owns
the HEVC-specific application + the actual `changeType()` call site
when mid-stream switching is in scope. The same boundary applies for
the parallel sibling `[5.1-surround-selection]`.

## Status

- **Composition:** not implemented in the `hls/video` engine. Today
  `selectQuality` operates over all `presentation.videoTracks` with
  no codec-aware filtering. The parser already extracts the `CODECS`
  attribute onto `Track.codecs[]` (`parse-multivariant.ts`), and
  `isCodecSupported` exists (`mediasource-setup.ts`) — both are inputs
  this feature consumes, but the filter step and the call site don't
  exist yet.
- **Definition depth:** technical — scope and constraints articulated;
  no implementation. Source material: [SPF Epics Working Doc — epic
  #22 HEVC / H.265 Support](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  (cluster C+D, Media-src, eng M, validation M; "Capability-aware
  variant selection. May fold under merged capability-filter epic.").
- **Hard prerequisite:** [capability-probing](./capability-probing.md).
  Tier 1 filter applies that feature's "Multivariant CODECS-attribute
  filtering" mechanism to HEVC variants; Tier 2 mid-stream
  `changeType()` consumes that feature's "Cross-codec transition
  (`changeType()`) probing" phase.

## Phases of complexity

[Tier 1 / Tier 2 framing](./clusters.md#tier-1-spec-compliant-baseline-vs-tier-2-custom-behavior)
per the Notion epics doc (HEVC row, sibling `multi-language-audio`
precedent).

| Phase | Tier | What | Notes |
|---|---|---|---|
| Capability-aware initial selection | Tier 1 | Filter `presentation.videoTracks` to codecs the browser supports per capability-probing's verdict. If HEVC variants pass, retain them; if not, exclude them. AVC fallback emerges from the filter: HEVC variants removed → AVC variants remain in the candidate set → ABR (or default-pick) selects among the remainder | Mechanism lives in [capability-probing.md](./capability-probing.md)'s "Multivariant CODECS-attribute filtering" phase. This feature is the applied use case for HEVC specifically. Same codec for the session — no `changeType()`, no setup re-entry |
| Customer codec preference / override | Tier 2 | Config-driven biases on top of the Tier 1 filter: `videoCodecPreference: 'avc'` excludes HEVC even when supported (the force-AVC override called out in the Notion epic); `videoCodecPreference: 'hevc'` biases toward HEVC when available (e.g., for bandwidth-conscious delivery on devices that handle HEVC efficiently) | Constraint slot read by selection's filter step. Same shape as `userVideoTrackSelection` (video-abr) and the per-cap slots in `rendition-selection-caps`. Customer-policy-driven; same codec for session |
| Mid-stream codec change via `changeType()` | Tier 2 | Allow ABR (or other selection logic) to switch between AVC and HEVC variants mid-stream when bandwidth or capability conditions warrant. Buffer-side `SourceBuffer.changeType(newMimeCodec)` call before appending segments of the new codec | Depends on [capability-probing.md](./capability-probing.md)'s "Cross-codec transition probing" phase landing — capability-probing answers "can the browser changeType from X to Y?"; this feature owns the actual call site. Significantly more complex than the prior phases: codec re-init, buffer-state coordination, MSE quirks (browser support is fragile + pair-specific) |

## What's in scope vs out of scope

**In scope:**
- All three phases above for HEVC ↔ AVC video variant selection
- Codec-preference state slot + filter step on `presentation.videoTracks`
- `changeType()` call site for HEVC ↔ AVC transitions in the buffer-
  setup neighborhood
- Customer-facing config surface (`videoCodecPreference`) consumed by
  the filter step
- HEVC-specific fallback semantics (which emerge inherently from the
  capability filter — HEVC excluded ⇒ AVC remains)

**Out of scope (separate Media-src candidate features):**
- **`[5.1-surround-selection]`** — parallel sibling. Same structural
  shape ("codec-change variant selection consumer of capability-probing")
  but on the audio codec/channel axis. Carried as a separate candidate.
- **`[hdr-variant-selection]`** *(possible future candidate)* — would
  follow the same shape (capability-gated variant selection) but on
  the HDR / dynamic-range axis.

**Out of scope (different architectural layer):**
- Adapter-layer customer-facing API surfaces (e.g., a hypothetical Mux
  Video element `force-avc` attribute). The SPF feature owns the state
  slot + filter logic; consumer-facing config attribute names live
  above-engine.
- Above-engine "is HEVC playing" UI affordances. Consume the resolved-
  track-codec data via existing track surfaces; not SPF concerns.

## Likely cross-cutting impact

Things this feature probably forces decisions on, not just additions:

- **Filter-then-select shape.** Same open question as
  [rendition-selection-caps.md](./rendition-selection-caps.md): does
  `selectQuality` take the pre-filtered candidate set (option a — keeps
  `selectQuality` pure, matches `userVideoTrackSelection` precedent),
  or extend its signature to take codec-preference and filter
  internally (option b)? Option (a) is cleaner; option (b) bakes more
  logic into the ABR module. Cross-cuts with rendition-selection-caps;
  whichever lands first sets the shape for both.
- **Codec-preference slot granularity.** Single slot like
  `videoCodecPreference: 'avc' | 'hevc' | undefined`, or pair of
  intent-specific slots (`forceCodec: 'avc' | undefined` +
  `preferCodec: 'hevc' | undefined`)? Customer use cases differ: a
  "force-AVC" customer use case has different semantics from a
  "prefer-HEVC-when-available" use case (the former rejects HEVC
  outright; the latter accepts AVC fallback gracefully).
- **Ordering with capability-filter and policy-caps.** When all three
  land (capability-probing's CODECS filter + this feature's codec-
  preference + rendition-selection-caps' resolution/bitrate caps), the
  filter pipeline becomes: capability filter (physics) → codec
  preference (customer codec policy) → policy caps (resolution /
  bitrate / FPS). Each narrows the candidate set independently before
  `selectQuality` consumes the final set. Confirm with the first
  feature to land both downstream of capability-probing.
- **MSE codec-change boundary.** Tier 1 and Tier 2 customer-override
  do not require `changeType()` — the codec is fixed for the session
  once selected. Tier 2 mid-stream `changeType()` is the exception;
  it crosses into [mse-mms-pipeline.md](./mse-mms-pipeline.md)'s
  buffer-setup neighborhood. The MSE codec-change check from the
  feature-doc skill fires only for the mid-stream phase, not the
  filter phases.
- **ABR codec-priority comparator (Tier 2 mid-stream only).** When
  both AVC and HEVC variants pass capability and customer filters and
  both have variants above the bandwidth floor, which codec does
  `selectQuality` prefer at upgrade time? Equal-bandwidth-different-
  codec tie-breaking. Today's `selectQuality` only compares
  `track.bandwidth`; an HEVC-aware comparator might weight by
  "equivalent visual quality at lower bandwidth."
- **Buffer-state coordination during `changeType()` (mid-stream
  only).** The spec allows in-place `changeType()` followed by append;
  browser support is fragile and pair-specific. Whether the consumer-
  side `changeType()` call requires a buffer flush, a continue-append,
  or other coordination depends on browser pair behavior. Coordination
  policy lives here, but exercises buffer-management's planner and
  back-buffer-eviction surfaces.

## Open questions

- **Codec-preference slot shape — single vs paired.** Per the cross-
  cutting note: `videoCodecPreference: 'avc' | 'hevc' | undefined` vs
  paired `forceCodec` + `preferCodec` slots. Customer use cases drive
  the call.
- **Mid-stream `changeType()` trigger policy.** Only when capability
  requires (e.g., a mid-stream variant change forced by upstream
  manifest reload), or also bandwidth-driven (ABR switches across
  codec boundaries when network conditions warrant)? Bandwidth-driven
  cross-codec switching is the more aggressive policy and exercises
  the `changeType()` path more often.
- **Buffer-state coordination during `changeType()`.** Flush vs
  continue-append vs other coordination, dependent on browser pair
  behavior. Likely lives in this feature but interacts with
  buffer-management's planner and back-buffer policy.
- **Fallback-when-empty.** If capability-filter narrows to zero and
  customer codec preference further excludes the residue, what
  happens? Capability-probing.md flags fallback-when-empty as a doc-
  level open question for the broader pipeline; this feature's
  customer-override participates in the same chain.
- **ABR codec-priority comparator.** Equal-bandwidth-different-codec
  tie-breaking at ABR upgrade time. May be Tier 3 work (algorithm
  extension) rather than Tier 2 (the filter mechanism). Possibly
  defers to a `[multi-signal-abr]` follow-on or stays as an open
  question here.
- **Multivariant `CODECS` parsing for HEVC variants.** `parseCodecs`
  in `parse-multivariant.ts` may or may not robustly recognize
  HEVC codec strings (e.g., `hvc1.*`, `hev1.*` and their profile/
  level/tier variants). Worth verifying once an HEVC test fixture is
  in hand.

## Related features

- **[capability-probing](./capability-probing.md)** *(hard
  prerequisite)* — provides the multivariant-CODECS filter (Tier 1)
  + the `changeType()` probe (Tier 2 mid-stream). This feature is
  scoped explicitly as a consumer in capability-probing.md's Out of
  scope and Related features sections.
- **[5.1-surround-selection](./5.1-surround-selection.md)** —
  parallel sibling on the audio channel-count axis. Same structural
  shape (capability filter + customer override + mid-stream
  `changeType()`); adds a 5.1-specific runtime-detection phase
  (downstream-environment-aware channel preference) with no HEVC
  analog. The codec-preference slot pattern's generalization
  (`audioChannelPreference` / `videoCodecPreference`) is worth
  harmonizing as the audio-side `changeType()` call site shape
  develops.
- **[video-abr](./video-abr.md)** — selection consumer. `selectQuality`
  operates over the filtered candidate set transparently — no change
  to the ABR algorithm itself, just narrower input. The Tier 2 mid-
  stream phase introduces cross-codec switching, which is a new ABR
  consideration but not an algorithm change.
- **[rendition-selection-caps](./rendition-selection-caps.md)** —
  sibling constraint+filter feature on the resolution / bitrate / FPS
  axes. Same filter-then-select pattern; the filter-shape open
  question is shared.
- **[mse-mms-pipeline](./mse-mms-pipeline.md)** — `changeType()` call
  site lives in the buffer-setup neighborhood (Tier 2 mid-stream
  phase only). Same-codec phases don't touch MSE setup at all.
- **[errors](./errors.md)** — when the filter pipeline narrows the
  candidate set to zero (e.g., no AVC variants available +
  `videoCodecPreference: 'avc'` set), the resulting error surfaces
  through that feature's phase 2, then through its consumer-facing
  mapping.

## See also

- [capability-probing.md](./capability-probing.md) — hard
  prerequisite; provides the filter mechanism and the changeType
  probe
- [clusters.md § Track & variant registry](./clusters.md#track--variant-registry)
  — cluster C description; this feature exercises the constraint+
  filter pattern that cluster's docs build on
- [clusters.md § Capability probing](./clusters.md#capability-probing)
  — cluster D description; this feature is a consumer
- [clusters.md § Feature classification axes](./clusters.md#feature-classification-axes)
  — Tier 1 / Tier 2 framing the phases map to; Constraint + filter
  pattern this feature instantiates
- [conventions/signals.md](../conventions/signals.md) — multi-writer
  slot conventions (relevant for confirming this feature uses the
  constraint+filter pattern, not multi-writer-on-selection)
- [SPF Epics Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  — source material; epic #22 (HEVC / H.265 Support), Tier 1 / Tier 2
  table for HEVC row, "Capability-filter merging" open question
- [Mux Video Permutations Matrix](https://www.notion.so/32c97a7f89d08191b84dd30f06685490)
  — Stream Type / Codec section
