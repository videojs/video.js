---
status: implemented
date: 2026-08-03
---

# Live Presentation Timeline Coordinate Model

The **live** extension of the coordinate model in
[presentation-timeline-model.md](./presentation-timeline-model.md). That doc fixed
the three-timeline model (media / presentation / wall-clock) and shipped it for
**VOD**, explicitly parking the live convergence in its
[Open questions](./presentation-timeline-model.md#open-questions). This doc is that
convergence: how the `startTime` / `startMediaTime` / `startDate` triple behaves for
a **sliding live window**, and the model the live work was re-landed onto.

The sections under [What's settled](#whats-settled) are the shipped contract — live
HLS plays against this model in the `hls/video` engine. The remaining
[Open questions](#open-questions) are the parts still deliberately unresolved.

**Revised 2026-07-28 (PDT-primary placement; timestamps for sample sync).** The first
draft treated PDT alignment as a once-at-establishment input and left live segment
placement to `EXTINF` carry-forward. Checked against the
[Apple HLS authoring spec](https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices)
and [RFC 8216](https://www.rfc-editor.org/rfc/rfc8216) (+ the
[rfc8216bis draft](https://datatracker.ietf.org/doc/draft-pantos-hls-rfc8216bis/)),
the model sharpened into a **role split**: PDT owns the *presentation timeline* —
segment placement on every parse — while media timestamps own *sample sync* in the
buffer. Both clocks are spec-mandated to agree; each is primary in its own frame. (An
interim revision flipped the live derive default to per-type before RFC 8216 §6.2.4's
cross-track timestamp MUST was checked; that flip is reverted — see
[the derive seam](#the-derive-seam-shared-min-stays-the-default-per-type-is-the-escape-hatch).)
Apple authoring rules are cited as `§n.n`; RFC rules as `RFC §n.n` / `bis §n.n`.

---

## The core principle: a frozen anchor, live availability

The triple is a **frozen origin**; the segment list is the **live availability truth**.
Both are derived from segments, but in two different modes:

- The **anchor** is derived from segments **once** and then frozen for the source's
  life (more precisely: per continuity range — see
  [What's settled](#the-anchor-is-frozen-per-continuity-range-not-forever)).
  `startTime = 0`, `startMediaTime` (decode value at the origin), `startDate`
  (wall clock at the origin). Establish-once, sticky-per-source — the same shape the
  original live `anchor-presentation-timeline` reactor had (`unanchored → anchored`,
  short-circuit once published).
- **Availability** — the sliding DVR/live window — is a **live read** over the current
  `segments` array on every reload, never stored on the anchor:
  `windowStart = segments[0].startTime`, `windowEnd = last.startTime + last.duration`.

This is what makes "the numbers shouldn't update over time for live" true and precise:
the *origin* never moves; per-segment `startTime` values are re-derived **from PDT
against that fixed origin** on every reload (see
[PDT is primary](#pdt-is-primary-segments-are-placed-from-pdt-on-every-parse)), extending
forward as the window slides and rolling off as segments age out. It is consistent with
the relocation side already in the codebase — `timestampOffset = −startMediaTime` targets
a **fixed presentation-0**, never a sliding `startTime`.

---

## What's settled

### One instant, three reference frames (recap)

There is a single physical instant — **presentation-0**, the origin of the presentation
timeline — and the three "start" quantities are that one instant expressed in three
frames. (This is the [Three timelines, one instant](./presentation-timeline-model.md#three-timelines-one-instant)
table; repeated here with the live emphasis.)

| Frame | Track-level field (origin projected into this frame) | Unit |
|---|---|---|
| **Presentation** (`currentTime` / `seekable`) | `startTime` — the origin in its own frame, so **≡ 0** | s from presentation-0 |
| **Media / decode** (`tfdt.baseMediaDecodeTime ÷ mdhd.timescale`) | `startMediaTime` — decode-clock value **at presentation-0** | s on decode clock |
| **Wall clock** (PDT) | `startDate` — epoch-seconds value **at presentation-0** | epoch s |

Both foreign-frame projections are the *same operation* — a segment's value in that
frame minus its presentation position:

```text
startMediaTime = (segment bmdt ÷ timescale) − segment.startTime    # the segmentStartTime term
startDate      =  segment.startDate          − segment.startTime
```

Both invariant along the linear timeline, so any measured (resp. PDT-bearing) segment
gives the same answer.

### Per-segment vs per-track: the reused keys mean different things

`startTime` and `startDate` exist on **both** `Segment` and `Track`:

| Field | Meaning |
|---|---|
| `Segment.startTime` | that segment's position **on** the presentation timeline (0-based) |
| `Segment.startDate` | that segment's **own** absolute wall clock (PDT of its first sample) |
| `Track.startDate` | wall clock at the track **origin** = `Segment.startDate − Segment.startTime` |

`Segment.startDate` and `Track.startDate` differ by `−startTime` — same key name, two
different numbers. `Segment.startDate` is the per-segment source of truth; the track
value is the one anchor derived from it.

### Two shared clocks, two roles: PDT for the timeline, timestamps for sample sync

For VOD, the frame that makes video's and audio's origins comparable is a shared
**decode-clock** origin — both come off one encode, so `bmdt/ts` values live in a
common frame and their difference is *real* A/V skew.

For live, the spec mandates **both** clocks be cross-track comparable, and its
client-side sections give each a distinct role:

- **RFC §6.2.4** — "Matching content in Variant Streams **MUST** have matching
  timestamps. This allows clients to synchronize the media," and "The rules for
  Variant Streams also apply to alternative Renditions." So decode timestamps *are*
  cross-track aligned by MUST, live included — the authoring spec's §7.3 is intra-track
  only, but the protocol spec supplies the cross-track constraint. Uncoordinated
  encoders with unrelated clocks are non-conformant content, not a case the model must
  absorb by default.
- **bis §6.2.4** — if any Media Playlist carries PDT, **all** MUST, "with consistent
  mappings of date and time to media timestamps." The two clocks are required to agree.
- **§8.4** — PDT **MUST** be present in every live Media Playlist (and **§15.1**: the
  PDT-derived timeline is the live synchronization timeline; **RFC bis B.1**: PDT on
  all playlists "allows more-precise mapping between Segments across Renditions").
  Conformant live has no missing-PDT path; PDT can be primary, not a bridge.
- The RFC's sync model splits the roles explicitly: playlist-level clocks locate
  *approximately*, then "the timestamps in the Media Segments can be used to
  synchronize the old and new timelines **precisely**" (RFC §6.3.4); the discontinuity
  sequence works "in addition to the timestamps within the media" (RFC §6.2.2).
- **§8.22** — audio/video segment boundary alignment is a **SHOULD** ("for maximum
  interoperability"), relaxed from an earlier video-only MUST. A/V boundary mismatch —
  and therefore differing 0th-segment PDT per track — is legal and expected.

So the model's split: **`startDate` (PDT) is the comparable clock for the presentation
timeline** — segment placement, the sliding window, the wall-clock edge, cross-rendition
segment mapping — while **media timestamps are the comparable clock for buffer
positions** (sample sync). Spec-consistent streams keep them in agreement; where a
stream deviates, each stays authoritative in its own frame.

### PDT is primary: segments are placed from PDT on every parse

For live, per-segment `startTime` is **derived from PDT on every reload**, not aligned
once and then carried forward:

```text
segment.startTime = segment.startDate − Presentation.startDate(anchor)
```

`placeOnAnchor` (`parse-media-playlist.ts`) already implements exactly this shift, and
it is idempotent — the `startDate` recomputed from placed segments reads back as the
anchor — so it is **promoted to the main live path**. Media-sequence / `EXTINF`
carry-forward (`placeOnPreviousTimeline`) is **demoted to fallback**: non-conformant
sources that omit PDT, and interpolating positions *within* a PDT gap.

Re-deriving each parse is safe because **§8.1** requires the sum of `EXTINF` durations
of any contiguous group of segments to be within **one video frame** of the actual
content duration — so PDT placement and `EXTINF` accumulation agree to within ~a frame,
and the per-reload correction is bounded (it cannot jerk the timeline). Unlike
carry-forward, PDT placement is self-correcting (drift cannot accumulate across
reloads) and history-free (a reload after a long stall, or a full window turnover,
re-places correctly with no overlap bridging).

The origin formula is then unchanged: `ownOrigin = bmdt/timescale − segment.startTime`
over PDT-placed segments yields a **PDT-referenced** native origin — *"native PTS at
the wall-clock instant presentation-0."* `startDate` supplies the *frame*;
`startMediaTime` still does the native→presentation *relocation* on top of it
(needed regardless — a live-edge `bmdt` is large and must be relocated to 0-based).

Because establishment is sticky-once, the ordering is a correctness constraint: the
anchor must settle before any parse whose segments feed `startMediaTime`, or the
latched `timestampOffset` is wrong by exactly the alignment shift.

### The anchor source is the reference track

`Presentation.startDate(anchor)` comes from a **designated reference track** — the
selected video track, falling back to audio for audio-only — not "first resolved"
(race-dependent under concurrent resolves) and not `min` over a set that doesn't exist
yet when the first track resolves. Deterministic, and consistent with pinning
presentation-0 at the join point.

Mechanically: the reference track's first parse has no anchor, places locally from 0,
and its computed `startDate` (first PDT-bearing segment's `startDate − startTime`)
*becomes* the anchor. Every other track **gates its first parse** on the anchor being
present, then aligns via `placeOnAnchor` (the anchor pre-stamped as `startDate` on the
unresolved shell). Without the gate, a concurrently-resolving track places locally from
0 and — establishment being sticky-once — is permanently misaligned.

A consequence worth naming: non-reference tracks whose windows legitimately start
earlier than the reference's join point get **negative** early-segment `startTime`.
That is correct (they precede presentation-0) and harmless to MSE — buffer positions
are `d − startMediaTime`, not `startTime` — but seekable/window math must clamp
(intersection-`max` across selected A/V does this naturally; see Phase 2).

### The derive seam: shared-min stays the default; per-type is the escape hatch

**`deriveSharedMinStartMediaTime` is the default for live and VOD alike.** (An interim
revision flipped live to per-type; RFC §6.2.4 reverts it.)

The key observation defusing the choice: **for conformant content the two reducers
compute the same number.** Per-type's input is `ownOrigin = bmdt/ts − pdtPlacedStartTime`;
with matching cross-track timestamps (RFC §6.2.4 MUST) and consistent PDT↔timestamp
mappings (bis §6.2.4 MUST), the per-type origins are equal — and `min` of equals is
that value. The seam only matters when a stream violates one of the MUSTs, so picking
a default is a **robustness policy**: which clock do you trust when they disagree?

| Deviation | Violates | shared-min | per-type |
|---|---|---|---|
| Sloppy PDT (rounded, jittery, declared sparsely) — **common** | bis §6.2.4 mapping consistency | A/V sync exact (a shared offset preserves buffer-relative timestamps); wall-clock mapping off by ≤ the PDT error | injects the per-track PDT error *difference* directly into A/V sync |
| Cross-track timestamp mismatch (uncoordinated encoders) — rarer | RFC §6.2.4 core MUST | faithfully reproduces the bogus offset as "sync" | fixes it via PDT (segment-granular) |

Sloppy PDT is by far the more common real-world deviation; matching timestamps is the
stronger and older guarantee (RFC 8216 MUST since 2017, vs. mapping consistency as a
bis addition); and the RFC's own sync model puts timestamps in the precise-sync role
(RFC §6.3.4). So the default trusts timestamps for sample sync — shared-min — and
`derivePerTypeStartMediaTime` remains the documented **escape hatch** for
timestamp-non-conformant sources (known uncoordinated-encoder content).

Still a **per-composition config choice, not a runtime detection** — nothing in the
bytes says whether a deviating stream broke its timestamps or its PDT.

Honest limits: shared-min's *absolute* wall-clock mapping inherits the PDT error of the
`min` track (bounded, affects window math not sync); `min` across PDT-referenced origins
keeps every relocated DTS ≥ 0 exactly as in VOD; PDT is segment-granular either way
(§8.5 airtime alignment is only a SHOULD); and sub-frame A/V sync remains the encoder's
job (Chrome paces the audio clock from decoded sample counts).

### Track-level for now

`stampTracks` already denormalizes derived values onto every track, so "keep it
track-level" means the anchor lives on tracks rather than a `Presentation`-level field:
the wall-clock anchor is pre-stamped as `startDate` on unresolved shells (the existing
`placeOnAnchor` preset mechanism), and `startMediaTime` is stamped per track. The
presentation-level hoist stays a future cleanup, not a Phase 1 prerequisite. Both
default shapes are single presentation-level scalars (`startDate` = the one anchor;
shared-min `startMediaTime` = one shared value), so a future hoist covers them with two
scalar fields — only the per-type escape hatch would need per-track `startMediaTime`,
the non-default exception.

### Presentation-0 sits at the join point, not the true stream origin

Where presentation-0 lands is a free choice once the anchor is frozen. We pin 0 at the
first-loaded window's origin (the join point) rather than extrapolating back to
media-sequence 0. Availability then slides relative to a fixed 0; DVR fall-off is just
`currentTime < segments[0].startTime`. This avoids trusting `targetDuration`-based
extrapolation across the unseen past.

### The anchor is frozen per continuity range, not forever

"Frozen" means per source / per continuity range. A source change re-establishes
(sticky-per-source). A mid-stream `EXT-X-DISCONTINUITY` where the decode clock jumps is
**not** an anchor re-establishment — it's a per-append `timestampOffset` change on the
segments after it, handled at the segment/loader level. The anchor is the origin of the
reference (first) continuity range. Out of scope for Phase 1, but it bounds the
"`startMediaTime` fixed forever" claim.

---

## Definitional collisions to fix

These are latent on VOD and only bite under the live model (1–4 once
`Track.startTime ≠ 0`; 5 under the per-type escape hatch). Resolving them is part of
Phase 1, before touching the establishment reactor.

1. **Relocation-offset formula.** `Track.startMediaTime`'s docstring
   (`media/types/index.ts`) says the offset is `startTime − startMediaTime`, but
   `relocation-pipelines.ts` applies `timestampOffset = −startMediaTime`. These agree
   only when `startTime = 0`. **The code is correct** — relocation targets
   presentation-0; `Track.startTime` plays no part. Fix the docstring to `−startMediaTime`
   / "at presentation-0."

2. **`Track.startTime` "always 0" vs. the live parser.** The type comment says *"Track
   startTime is always 0,"* and the triple is documented as "the value at `startTime`
   (the origin)." But `parse-media-playlist.ts` returns `startTime: placed.startTime`,
   which for live carry-forward is the *current window's first-segment position* —
   nonzero and growing. **Resolution (settled):** `Track.startTime ≡ 0` (the origin); the
   sliding window edge is `segments[0].startTime`, derived, never the anchor. The parser
   writing a nonzero track `startTime` is the bug to fix.

3. **`Track.startDate` stale old-model prose.** Its docstring still says *"provisional
   from the manifest… later refined from the buffer (`buffered`/`tfdt`)… the offset a
   cross-track aligner removes."* In the 0-based model `startDate` is pure playlist
   arithmetic (no buffer refinement), and the "cross-track aligner" it names
   (`align-track-timelines`) is deleted in Phase 1. Rewrite.

4. **`startMediaTime === undefined` overloads two states** — "not yet established"
   (during `monitoring`) vs. "established but effectively zero, left native" (near-zero
   VOD). `established()` keys off presence, so worth a definitional note; VOD-side, minor.

5. **`thresholdOrigin`'s near-zero snap is per-type-unsafe** (escape hatch only).
   `NEAR_ZERO_ORIGIN_THRESHOLD` (1 s) snaps sub-threshold (and negative) origins to `0`.
   `deriveSharedMinStartMediaTime` — the default — applies it to the single joint `min`,
   which is safe. But `derivePerTypeStartMediaTime` applies it **independently per
   type**: if two types' origins straddle the threshold, one snaps to `0` and the other
   doesn't — injecting up to 1 s of A/V desync. A latent trap in the escape hatch, not
   the default path; note it on the escape hatch's docstring.

---

## What Phase 1 produces (contract summary)

- Anchor triple frozen per source (per continuity range), **track-level** for now:
  `startTime ≡ 0`, `startMediaTime` (decode frame), `startDate` (wall-clock frame).
  Segments remain the live availability truth.
- **PDT-primary placement:** live segment positions derived from PDT against the frozen
  anchor on **every parse** (`placeOnAnchor`, promoted to the main live path; §8.1
  bounds the per-reload correction to ~one video frame). `EXTINF`/media-sequence
  carry-forward (`placeOnPreviousTimeline`) demoted to fallback for PDT-less sources
  and intra-gap interpolation.
- **Timestamps own sample sync:** `deriveSharedMinStartMediaTime` stays the default for
  live and VOD alike (RFC §6.2.4 cross-track timestamp MUST; conformant streams make the
  reducers agree anyway). `derivePerTypeStartMediaTime` is the escape hatch for
  timestamp-non-conformant sources (mind collision 5's threshold trap there).
- **Anchor source = reference track** (selected video, else audio): its first parse
  produces the anchor; every other track's first parse **gates** on the anchor and
  aligns via `placeOnAnchor` (anchor pre-stamped as shell `startDate`).
- Fold the live anchor into the `establishStartMediaTime` establishment reactor as
  **one unit with an internal order** — anchor settles → parses align →
  `startMediaTime` latches (sticky-per-source shape unchanged). Delete the
  buffer-sourced anchor stack (`buffered-anchor`, `resolve-buffered-anchor`,
  `align-track-timelines`, buffer-sourced `positionAllTracksToAnchor`); `placeOnAnchor`
  is **kept** (sign-traced: the anchor segment lands at `startDate − anchor`, and the
  recomputed track `startDate` reads back as the anchor — idempotent). Its remaining
  bug is collision 2: it must return track `startTime: 0`, not the shifted local base.
  **Landed 2026-07-29:** the reactor freezes + stamps the reference-track anchor; the
  gated first parse is `resolve-track`'s injected `gateFirstParse` seam
  (`primitives/gate-first-parse.ts`) with `gateFirstParseOnAnchor` as the policy, and
  the parse re-reads its `previous` after the awaits so the stamp can't be clobbered.
  Reload-parse PDT-primary placement (promoting `placeOnAnchor` over carry-forward)
  rides with the reload loop's re-landing.

---

## Open questions

Resolved by the 2026-07-28 revision (into [What's settled](#whats-settled)): one
establishment unit with internal order (was Q1); anchor = reference-track PDT, gated
first parse, shell-stamped (was Q2); `placeOnAnchor` kept and promoted, sign-traced
(was Q4); window edge derived from `segments[0].startTime` at read time (was Q6 —
follows from PDT-primary re-derivation: a stored edge would just go stale).

### Resolved during implementation

- **What `seekToLiveEdge` gates on post-convergence** — a derived
  "live window derivable" predicate, plus a media element. No `startMediaTime` /
  `startDate` gate: the window is playlist arithmetic and settles independently of the
  byte-level origin. No MediaSource gate either — `seekToLiveEdge` commands
  `state.startPosition` and `applyStartPosition` performs the seek behind
  `loadedmetadata`, which already implies an open MediaSource and a declared seekable
  range. See `playback/behaviors/dom/seek-to-live-edge.ts`.
- **Phase 2 window math** — shipped as specified for the geometry: the
  intersection over the selected A/V windows (`max` of starts, `min` of ends) in
  `liveWindowFromState` (`playback/primitives/live-window.ts`), with the `max` also
  clamping a pre-join non-reference track's negative `startTime`.

  **Partial deviation on holdback.** This doc specified deriving holdback from §14.3
  (`PART-HOLD-BACK` ≥ 3 × part target duration) rather than "the old branch's
  `3 × targetDuration`". What shipped reads the server's `EXT-X-SERVER-CONTROL`
  `HOLD-BACK` when declared and falls back to `3 × targetDuration` otherwise
  (`liveLatencyFor` in `media/hls/reload-policy.ts`), injected through
  `seekToLiveEdge`'s `resolveLiveLatency` seam.

  `PART-HOLD-BACK` is **intentionally** not used, and this doc's original framing was
  wrong to prefer it unconditionally: it is the holdback for clients playing *partial
  segments*. While the engine fetches whole segments only, seating the playhead at
  `PART-HOLD-BACK` would put it ahead of the last complete segment. It becomes correct
  with LL-HLS partial-segment support, not before.

### Still open

1. **How tracks *should* work** more broadly (the user-flagged larger question) — the
   per-track vs presentation-level anchor split is deferred (track-level for now), but
   the final shape is open. The revision sharpens it: both default anchor values are
   presentation-level scalars (`startDate`, shared-min `startMediaTime`); only the
   per-type escape hatch needs per-track `startMediaTime`.
2. **Fallback policy for non-conformant live** (PDT missing or partial, against §8.4):
   when exactly does `placeOnPreviousTimeline` carry-forward engage — per-track or
   per-presentation, detected once or per reload — and does a source that *loses* PDT
   mid-stream keep its anchor?

---

## See also

- [Apple HLS authoring specification](https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices)
  — the `§n.n` rules cited throughout (§7.3, §8.1, §8.4, §8.5, §8.22, §14.3, §15.1).
- [RFC 8216](https://www.rfc-editor.org/rfc/rfc8216) §6.2.4 (matching timestamps MUST,
  extended to alternative renditions) and the
  [rfc8216bis draft](https://datatracker.ietf.org/doc/draft-pantos-hls-rfc8216bis/)
  (§6.2.4 PDT↔timestamp mapping consistency, §6.3.4 timestamps-sync-precisely, B.1
  LL-HLS PDT profile) — cited as `RFC §n.n` / `bis §n.n`.
- [presentation-timeline-model.md](./presentation-timeline-model.md) — the VOD model
  this extends; its Open questions park exactly this convergence.
- [../../decisions/spf/mse-timestamp-offset.md](../../decisions/spf/mse-timestamp-offset.md) —
  native-PTS default; relocation for 0-based cases.
- `internal/decisions/live-presentation-anchor.md`,
  `internal/decisions/live-timeline-anchoring.md` — the original buffer-sourced live
  anchor this replaces. **On the reference branch `feat/spf-hls-live`, not yet re-landed
  here.**
- `internal/design/spf/live-presentation-modeling.md` — the live data model (sliding
  window, media-sequence carry-forward). **On `feat/spf-hls-live`, not yet re-landed
  here** (the carried-over `presentation-timeline-model.md` also links it).
- `packages/spf/src/playback/behaviors/establish-start-media-time.ts`,
  `packages/spf/src/media/hls/parse-media-playlist.ts` — the code the contract lands in.
