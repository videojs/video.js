---
status: partial
date: 2026-08-14
definition: sketched
---

# Rendition selection caps

Policy-driven narrowing of the candidate set of video renditions before
the pick is taken. Each cap is a **selection rule** — a soft filter in
the chain described by
[track-switching-model.md](../track-switching-model.md) — so the
selection slot (`selectedVideoTrackId`) stays single-writer and caps
bias the candidates rather than competing to write it.

A **Player feature** in the framing from
[clusters.md § Feature classification axes](./clusters.md#feature-classification-axes):
additive functionality not tied to making any source play, used by
the player to bias delivery for billing, device, viewport, or
other consumer-side reasons.

## Status

- **Composition:** the **screen-size cap** is implemented and composed
  by the `hls/background-video` engine, whose default rule chain is
  `[screenResolutionCap, preferHighestResolution]` — narrow to the
  renditions that fit the screen, then take the largest. Not composed
  by the `hls/video` engine, where `selectQuality` still operates over
  all video tracks with no narrowing beyond `userVideoTrackSelection`.
  The config-driven caps (max-height, max-bitrate, max-FPS), the
  player-element cap, and the cap floor are all unimplemented.
- **Definition depth:** sketched for the screen-size cap
  (implementation surface below); the remaining phases stay technical —
  scope articulated, no implementation. Source material: [SPF Epics
  Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  Cluster E entries #13 (1080p+ Resolution Cap, eng S, validation S)
  and NEW-C (Screen-Size / Player-Size Resolution Cap, eng S–M,
  validation S), unified per that doc's "Resolution-cap
  unification" open question.

  Note NEW-C bundles *screen*-size and *player*-size into one entry.
  Only the screen-size half shipped; they are separate phase rows below
  because they differ in both signal source and layer.

## Phases of complexity

The first five are motivation slices — different signal sources
(config / `screen` / `ResizeObserver`) feeding the same mechanism, a
soft-filter rule in the selection chain. The sixth is meta-policy on
top: it modifies how the combination of caps resolves, not a cap of its
own.

| Phase | What | Status / mechanism |
|---|---|---|
| Screen-size cap | Narrow the candidates to renditions whose pixel area fits the screen. Avoids delivering more pixels than the display has | **Implemented** — `screenResolutionCap`, a soft-filter rule reading `state.screenResolution`. See *Implementation surface* |
| Billing-driven max-height cap | Config-driven `maxHeight` (e.g., 1080) excludes higher-resolution variants from the candidate set. Drives the Mux billing use case (cap delivery at 1080p+ for tier-pricing alignment) | **Not implemented.** Policy — a config-reading rule, no new behavior. Matching axis is configurable: height (simpler) or total pixels (for exact alignment with resolution-based pricing tiers — `1080p = 2,073,600 pixels` matches anamorphic / non-standard-aspect variants correctly). The screen cap chose pixel area for the same reason |
| Player-element cap | Narrow to renditions that fit the *player element's* rendered dimensions rather than the screen's. Strictly tighter than the screen cap, and the one that matters for a small embed on a large display | **Not implemented.** Middle pattern — a `ResizeObserver` monitor writes element dimensions; a rule reads them. New behavior. The half of Epics NEW-C that did not ship. Pairs with the cap floor below, which counters its tendency to over-aggressively downgrade on small players |
| Max-bitrate cap | Config-driven `maxBitrate` excludes variants above the threshold. Useful for bandwidth-constrained delivery contexts (mobile, billing) | **Not implemented.** Policy — same shape as max-height cap |
| Max-FPS cap | Config-driven `maxFps` excludes high-frame-rate variants. Less common motivation but mentioned in [video-abr.md](./video-abr.md)'s "What's not implemented" | **Not implemented.** Policy — same shape |
| Cap floor (minimum effective cap) | Counter-pressure to other caps: when the combination of upper-bound caps would narrow the effective candidate set below a configured floor (e.g., 720p), the floor wins — the effective cap is `max(otherCaps, floor)`. Motivation: element- and screen-driven caps downgrade too aggressively on small surfaces | **Not implemented.** Meta-policy — not a cap of its own; it modifies how the caps combine. Mux Player's [`MinCapLevelController.minMaxResolution = 720`](https://github.com/muxinc/elements/blob/main/packages/playback-core/src/min-cap-level-controller.ts) is the reference implementation. Also the answer to the screen cap's no-fit behavior (see below) if that ever needs changing |

The upper-bound caps share one mechanism: a soft-filter rule in the
chain, ahead of the ranker. They differ in signal source (one-shot
config vs reactive `screen` / `ResizeObserver`) and constraint axis
(area / height / bitrate / FPS). Because soft filters compose by
narrowing one after another, adding a cap is additive — no combination
logic is needed for the upper bounds, and *intersection* falls out of
applying them in sequence. Only the floor needs real combination
semantics, which is what makes it meta-policy. Per-phase implementation
is small (S / S-M per the Epics doc).

### How the shipped cap behaves

Three properties of `screenResolutionCap` worth stating, because each
was a decision rather than a detail:

- **Pixel area, not height.** A `"1080p"`-style tier only describes a
  rendition once you assume its aspect ratio, which mis-measures an
  anamorphic ladder. `state.screenResolution` is therefore a width and
  a height, and the comparison is on area.
- **It declines to cap rather than guessing.** No `screenResolution`
  signal at all (the composition omitted `trackScreenResolution`) or a
  reading of `undefined` (no screen) both leave the candidates
  unnarrowed. "Unknown" has to mean "don't cap": treating it as an area
  of zero would pin every source to its smallest rendition on exactly
  the environments we know least about.
- **When no rendition fits, it falls through.** The cap is a plain soft
  filter, and `applyRules` skips a rule that matches nothing, so the
  chain proceeds unnarrowed and the ranker behind the cap decides —
  which for `preferHighestResolution` means the largest rendition. This
  is unreachable at the default `useDevicePixelRatio: true`, since any
  real screen measured in device pixels exceeds a 640x360 rung, but it
  is reachable with `useDevicePixelRatio: false` on a small phone. The
  fix, if it ever matters, is the cap floor — not a special case inside
  the cap.

## Implementation surface

| Piece | Path | Role |
|---|---|---|
| `getScreenResolution` / `watchScreenResolution` | `packages/spf/src/media/dom/screen.ts` | Read the screen's pixel dimensions, and re-read on every signal that implies a change (`resize`, `screen`'s own `change`, orientation, a `dppx` media query). Returns `undefined` where there is no screen |
| `trackScreenResolution` | `packages/spf/src/playback/behaviors/dom/track-screen-resolution.ts` | Behavior that owns `state.screenResolution`, subscribing the watcher for the composition's lifetime |
| `screenResolutionCap` | `packages/spf/src/playback/behaviors/select-tracks.ts` | The cap itself: a soft-filter `SelectionRule` reading `state.screenResolution` |
| `preferHighestResolution` | `packages/spf/src/playback/behaviors/select-tracks.ts` | The ranker composed behind it — a sort, so the chain's head is the largest surviving rendition |
| `tracksUnderPixelArea` / `byDescendingResolution` | `packages/spf/src/media/primitives/select-tracks.ts` | The geometry the two rules are built from: one filter, one comparator |
| `applyRules` / `applyConstraints` | `packages/spf/src/playback/primitives/selection-rules.ts` | The composers. `applyRules` supplies the fall-through and the head-is-the-pick semantics the cap relies on |
| `createEngine` | `packages/spf/src/playback/engines/hls/engine-background-video.ts` (`@videojs/spf/hls/background-video`) | Composes `trackScreenResolution` and the default chain |

`screenResolutionCap`, `preferHighestResolution`, and `SelectTrackRule`
are exported from `@videojs/spf/hls`, so a consumer can pass
`videoRules: [preferHighestResolution]` to drop the cap, or compose its own
rule alongside it, rather than only replacing the chain wholesale.

## Config surface

| Option | Where | Effect |
|---|---|---|
| `videoRules` | `EngineConfig` (`hls/background-video`) | Replaces the default chain. Omit for `[screenResolutionCap, preferHighestResolution]` |
| `useDevicePixelRatio` | `EngineConfig` (`hls/background-video`), read by `trackScreenResolution` | Whether the screen is measured in device pixels (default `true`) or CSS pixels. ⚠️ Chromium and Gecko fold page zoom into `devicePixelRatio`, so with this on, zooming moves the cap; WebKit does not |

There is no cap-value config option. The cap is derived from a measured
screen rather than configured, which is what distinguishes this phase
from the config-driven ones above.

## Verification

- `packages/spf/src/media/primitives/tests/select-tracks.test.ts` —
  the filter and the comparator, including the anamorphic case and
  order preservation.
- `packages/spf/src/playback/behaviors/tests/select-tracks.test.ts` —
  the rule: narrowing, both decline-to-cap paths, the no-fit
  fall-through, and that the chain reaches the same pick with the cap
  on either side of the ranker.
- `packages/spf/src/playback/engines/hls/tests/engine-background-video.test.ts`
  and the `hls-background-video` adapter tests — the composed default.
  Note these write `screenResolution` explicitly; a test that leaves it
  ambient makes its expected pick depend on the runner's display.
- `apps/e2e/tests/spf-background-video.spec.ts` → *screen-size cap* —
  the same 4K ladder through a real browser on both projects: an
  800x600 screen pins a rendition inside that area, and 1920x1080 at
  `deviceScaleFactor: 2` pins one above 1080 lines, which also covers
  `useDevicePixelRatio` (in CSS pixels alone that viewport could never
  justify a 2160-line rendition). Bounded rather than pinned to an exact
  rung, so a ladder change at the source doesn't break it. **Driven
  through the viewport, not the `screen` context option:** measured in
  both projects, `window.screen` follows the emulated viewport and the
  `screen` option has no effect, so an e2e test cannot distinguish
  "reads the screen" from "reads the window" — that stays unit-level.
- Manual, Chromium on a 3456x2234 display against a 3840x2160 ladder:
  the pick moves from 3838x2160 (8.29 Mpx, over the 7.72 Mpx screen) to
  2558x1440. The sandbox page is `html-hls-background-video`, whose
  source is a deliberately 4K asset for this reason.

## What's in scope vs out of scope

**In scope:**
- All six phases above for video renditions
- Each cap as a soft-filter rule in the selection chain, ahead of the
  ranker. Observed inputs (screen, player element) get a state slot
  holding the measurement; configured inputs need none, since a rule
  reads `config` directly
- Empty candidate set after cap filtering — resolved: fall through,
  see *How the shipped cap behaves*

**Out of scope (separate candidate features):**
- **[multi-signal-abr](./multi-signal-abr.md)** — incorporates non-
  bandwidth signals (CPU / thermal / network type / battery / viewport
  / customer preference) into the ABR algorithm itself. Different
  concern: caps narrow the candidate set; multi-signal-abr biases
  selection within it. Caps could feed multi-signal-abr as one input,
  but the algorithm-modification work is its own feature.
- **[audio-abr](./audio-abr.md)** — audio quality switching now
  documented; its "Audio caps inclusion" open question explicitly
  references this doc as the resolution candidate. When audio-ABR
  ships, the audio-caps integration question becomes load-bearing.
- **[`audio-only-mode-override`](../use-cases/audio-only-mode-override.md) / [`video-only-mode-override`](../use-cases/video-only-mode-override.md)** —
  use-case compositions that subtract behaviors for mode-only delivery.
  Different mechanism (composition, not constraint).

**Out of scope (different architectural layer):**
- Above-engine consumers that write cap state from React / HTML
  observers (e.g., a React hook that observes the player container
  and writes a cap value). This feature owns the SPF-side state slots
  and the rules; *where* the writer lives is settled for the screen cap
  (engine-side, `trackScreenResolution`) and still open for the
  player-element cap.
- The Mux Video element's customer-facing attributes
  (`max-resolution`, `cap-rendition-to-player-size`) — those are
  adapter-layer API surfaces that *consume* this feature's config /
  state.

## Likely cross-cutting impact

Things this feature probably forces decisions on, not just additions:

- **~~`selectQuality` filter-then-select shape.~~ Resolved by the rule
  model, as neither option originally posed.** The question assumed caps
  would either pre-filter outside `selectQuality` or be baked into its
  signature. Instead the picker was replaced wholesale by an ordered
  rule chain, so a cap is simply a rule in it — no filter step, and
  `selectQuality` keeps its shape. See
  [track-switching-model.md](../track-switching-model.md).
- **State-slot granularity, for the *config-driven* caps.** Per-cap
  slots (`videoMaxHeight`, `videoMaxBitrate`, `videoMaxFps`) vs a
  unified slot. Still open, but the screen cap sets a precedent that
  reframes it: its slot holds a **measurement** (`screenResolution`),
  not a cap value, and the rule derives the bound. A config-driven cap
  needs no state slot at all — a rule can read `config` directly, as
  the audio language policy already does. So the question may only be
  live for caps whose input is observed rather than configured.
- **Player-element cap signal-source location.** The screen cap answered
  this for itself — an engine-side behavior reading `screen`, no adapter
  involvement — but the element cap is the harder case, since the
  element is DOM-side and the engine only holds `mediaSource.media`.
  Still open, and still decides which layer owns the DOM dependency.
- **Cap-combination semantics.** Upper-bound caps combine by
  *intersection*, which now falls out for free: soft filters narrow one
  after another, so applying two caps in sequence is their
  intersection, and no combination logic exists to write. The cap floor
  still inverts this (`max()` over the other caps' bounds) and is the
  one phase that needs real combination semantics — which is why it is
  meta-policy rather than a cap.

## Open questions

- **max-FPS cap inclusion.** Listed in video-abr.md's "What's not
  implemented" but lower priority than max-height / max-bitrate.
  Document as a phase or defer?
- **Audio caps.** Audio renditions don't have height analogs but
  could have max-bitrate or max-channels caps. Extend this feature
  to cover audio or carry audio caps separately?
- **~~Interaction with [capability-probing](./capability-probing.md).~~
  Resolved structurally by the rule model.** Capability exclusions are
  **constraints** (hard: never attempt an unplayable track) and caps are
  **rules** (soft), and `applyConstraints` runs before `applyRules` by
  construction. So capability filtering precedes policy caps with no
  coordination between the two features. Retained here because the
  ordering was an open question and the answer is now load-bearing for
  both docs.
- **Cap-floor scope: policy caps only, or all candidate-narrowing
  signals?** The floor counters the element- and screen-driven caps (and
  potentially max-bitrate / max-FPS caps), but should not override
  capability-filter physics. The constraints-before-rules split above
  makes this mostly self-enforcing — a floor written as a rule cannot
  re-add what a constraint removed, because the constraint pass has
  already run. Confirm the boundary when the floor lands.
- **Cap-floor default value.** Mux Player hardcodes 720p as
  `MinCapLevelController.minMaxResolution`. For SPF, should the
  floor default to a value, or require explicit opt-in? Defaulting
  risks unexpected high-bitrate delivery on tiny embeds; not
  defaulting means most consumers won't get the perceptual benefit
  unless they configure it.

## Related features

- **[video-abr](./video-abr.md)** — the consumer for the caps that have
  yet to land in the `hls/video` engine. Its ranker is what a cap
  narrows *for*: the cap decides which renditions are admissible and the
  ranker picks within them. `userVideoTrackSelection` is the existing
  constraint+filter precedent.
- **[multi-signal-abr](./multi-signal-abr.md)** — different concern
  (ABR algorithm extension) but caps could feed it as inputs.
- **[audio-abr](./audio-abr.md)** — audio quality switching that
  may extend this feature with audio-side caps; see that doc's
  "Audio caps inclusion in rendition-selection-caps.md" open
  question.
- **[capability-probing](./capability-probing.md)** — adjacent. Both
  narrow the candidate set, but along different axes (capability =
  physics, caps = policy). The cluster framing places caps in
  cluster E (selection policy) and capability filtering in cluster
  D (capability probing primitive); the line matters for
  composition order.
- **[hevc-variant-selection](./hevc-variant-selection.md)** — sibling
  constraint+filter feature on the codec axis. Same filter-then-select
  shape; the open question about per-cap slots vs unified slot is
  shared.
- **[`audio-only-mode-override`](../use-cases/audio-only-mode-override.md) / [`video-only-mode-override`](../use-cases/video-only-mode-override.md)** —
  use-case compositions for mode-only delivery. Different mechanism
  than caps (subtract behaviors vs filter candidates).

## See also

- [clusters.md § Selection policy](./clusters.md#selection-policy)
  — cluster E description; this feature is the first concrete cluster
  E member, and the cluster's documented foundation
- [clusters.md § Feature classification axes](./clusters.md#feature-classification-axes)
  — the Player-feature framing this doc instantiates; mixes
  Policy mechanism (config-driven caps) and Middle-pattern
  mechanism (the screen and player-element caps)
- [clusters.md § Constraint + filter](./clusters.md#constraint--filter)
  — cross-cluster pattern this feature instantiates; `video-abr`'s
  `userVideoTrackSelection` is the precedent
- [track-switching-model.md](../track-switching-model.md) — the rule
  model the shipped cap is built on: a hard constraints pre-pass, then
  an ordered chain of soft filters and one ranker, with the pick as the
  head. Its "scope" kind is what a cap is, and its `applyRules`
  fall-through is what the cap relies on when nothing fits
- [video-abr.md](./video-abr.md) — primary consumer; `selectQuality`
  is the read-side, `userVideoTrackSelection` the constraint
  precedent
- [SPF Epics Working Doc](https://www.notion.so/35f97a7f89d08123a13fecab1ca1cac4)
  — source material; Epic #13 (1080p+ Resolution Cap) and NEW-C
  (Screen-Size / Player-Size Resolution Cap), unified per that
  doc's "Resolution-cap unification" open question
- [Mux Video Permutations Matrix](https://www.notion.so/32c97a7f89d08191b84dd30f06685490)
  — Stream Type / Selection Policy section; consumer-facing API
  surfaces (`max-resolution`, `cap-rendition-to-player-size`)
  documented in the Mux Video element README
