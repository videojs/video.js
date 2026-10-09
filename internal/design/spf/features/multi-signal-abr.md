---
status: draft
date: 2026-05-20
definition: technical
---

# Multi-signal ABR

Extension to the existing video and audio ABR algorithm to incorporate
non-bandwidth signals: network type / Save-Data preference, thermal /
decode-pressure inference, battery state, viewport visibility, and
customer-facing quality-preference policy. Today's `selectQuality`
takes `(candidates, bandwidth, config) → track`; this feature widens
the input axis so selection responds to more than just throughput.

A **Media-src feature** at the baseline (sensing-driven biases that
make playback more appropriate to device + network conditions) layered
with **Player feature** at the customer-preference tier (additive
config-driven biases). Cluster C member, sibling to
[video-abr](./video-abr.md) and [audio-abr](./audio-abr.md). Distinct
from [rendition-selection-caps](./rendition-selection-caps.md): caps
*narrow the candidate set* before selection; multi-signal-ABR extends
the *selection algorithm itself*.

## Status

- **Composition:** not implemented in the `hls/video` engine. Today
  `switchVideoQuality` (and the upcoming `switchAudioQuality` per
  [audio-abr](./audio-abr.md)) read only `bandwidthState` for the
  algorithm input.
- **Definition depth:** technical — per-signal phases articulable
  from known browser APIs and the existing video-abr precedent;
  signal-fusion algorithm shape is open.
- **Prerequisite chain:** depends on
  [video-abr](./video-abr.md) (and optionally
  [audio-abr](./audio-abr.md)) for the base algorithm being extended.
  Independent of [rendition-selection-caps](./rendition-selection-caps.md)
  — caps and signals are complementary, not blocking.

## Phases of complexity

Content phases by signal type. Each row except the last is a discrete
signal-source unit; the final "Signal fusion" row covers the
algorithm-extension work that consumes them.

| Phase | Signal source | Mechanism | Notes |
|---|---|---|---|
| Network-type / Save-Data awareness | `navigator.connection.effectiveType` (`'slow-2g'` / `'2g'` / `'3g'` / `'4g'`) and `navigator.connection.saveData` boolean. `connection.change` event for mid-playback transitions | Middle-pattern monitor behavior writes a `networkConditions` state slot; ABR algorithm reads as a downward bias factor (e.g., `'slow-2g'`/`'2g'` aggressively bias down; `saveData=true` similar). Naive: read once at startup; full: react to `connection.change` | Browser support: Chrome / Edge / Firefox have Network Information API; Safari does not expose it. Applies to both video and audio ABR (network conditions affect both equally). Available signal is coarse-grained but covers the high-value cases (cellular detection) |
| Thermal / decode-pressure awareness | Derived from `VideoPlaybackQuality.droppedVideoFrames` delta over a rolling window. Possibly supplemented by `PerformanceObserver` long-task durations as a CPU-pressure proxy. No direct browser thermal API | Middle-pattern monitor behavior samples dropped-frames periodically; computes a rolling drop rate; writes `thermalPressure` (or `decodePressure`) state slot; ABR reads as a downward bias when sustained drops exceed a threshold | Heuristic-only; the hardest signal to detect reliably. Naive: dropped-frames threshold + downgrade. Full: combine dropped-frames + long-task signals. Video-ABR primarily; audio-ABR rarely thermally-pressured (audio decode is cheap). One open question: distinguishing decode-pressure (real thermal/CPU issue) from network-driven gaps (which dropped-frames doesn't directly distinguish from underflow) |
| Battery awareness | `navigator.getBattery()` returning `{ level, charging, chargingTime, dischargingTime }` + `levelchange` / `chargingchange` events | Middle-pattern monitor behavior subscribes to battery events; writes `batteryState` state slot; ABR reads with policy like "when `level < 0.2 && !charging`, bias toward lower bitrate to extend battery" | Browser support: Chrome desktop yes; Firefox removed (security/fingerprinting concerns); Safari no. Treat as best-effort enhancement — when `getBattery` unavailable, slot stays `undefined` and bias is skipped. Applies to both video and audio ABR but video bias is more impactful (higher decode + GPU cost) |
| Visibility awareness | `document.visibilityState` (`'visible'` / `'hidden'`) + `IntersectionObserver` on the video element for in-page off-screen detection. Possibly Picture-in-Picture state via `navigator.mediaSession` or `document.pictureInPictureElement` for distinguishing "hidden tab" from "PiP-visible" | Middle-pattern monitor behavior tracks both signals; writes `playerVisibility` state slot (e.g., `'visible'` / `'hidden'` / `'pip'` / `'off-screen'`); ABR reads: pause aggressive upgrades when not visible; consider downgrade for prolonged hidden state | Mostly video-applicable (audio plays through headphones regardless of visual visibility). PiP is a critical case: tab can be hidden but PiP is visible to user, so don't downgrade. Cross-cutting with the broader engine — segment-loading might also want to pause forward-buffer fetching when hidden, but that's buffer-management's concern, not this feature's |
| Customer-preference policy | Config-driven `qualityPreference: 'auto' \| 'data-saver' \| 'best-quality' \| 'specific-level'` or similar | No sensing; config slot read by ABR as a bias-strength scalar. `'data-saver'` applies a strong downward bias; `'best-quality'` applies an upward bias respecting safety margins; `'auto'` is the default neutral behavior | Pure config / Player-feature-flavored. Customer policy reigns over automatic biases (e.g., explicit `'best-quality'` overrides battery-low downward bias, but never overrides bandwidth-safety floor). Applies to both video and audio ABR. Adapter-level customer-facing UI ("Auto" / "Data saver" toggles) consumes this config |
| Signal fusion / algorithm extension | Integration phase: combine bandwidth + per-signal biases into a single `selectQuality` decision. Today's `selectQuality(candidates, bandwidth, config)` becomes `selectQuality(candidates, bandwidth, signals, config)` — signals is a struct of optional inputs from the five sources above | Algorithm extension. Open question on weighting strategy: bias-factor weighting (each signal produces a multiplier on the effective bandwidth) vs decision-tree (signals narrow / shift candidate set) vs scoring-function (each candidate scored against all inputs, highest score wins) | The hard algorithmic part. Bandwidth supremacy: non-bandwidth biases must not override the bandwidth safety floor (`track.bandwidth ≤ measuredBandwidth × safetyMargin`). Applies uniformly to video and audio ABR — the algorithm extension is signal-shape-agnostic |

## What's in scope vs out of scope

**In scope:**
- All six phases above for HLS multi-bitrate sources (video and audio
  variants where ABR is enabled)
- Per-signal middle-pattern monitor behaviors with graceful no-op when
  the underlying browser API is unavailable
- New state slots for each signal: `networkConditions`,
  `thermalPressure`, `batteryState`, `playerVisibility`,
  `customerQualityPreference`
- Algorithm extension to `selectQuality` and the `switchXQuality`
  behaviors
- Customer-policy config surface (`qualityPreference`)

**Out of scope (separate features):**
- **[rendition-selection-caps](./rendition-selection-caps.md)** —
  constraint+filter, different mechanism. Caps narrow the candidate
  set; this feature biases selection within it. Composable: caps run
  first, then signals bias.
- **`[bandwidth-estimation]`** *(candidate)* — the dual-EWMA primitive
  that produces `bandwidthState`. Not changed by this feature; consumed
  unchanged.
- **`[non-zero-pts-support]`** *(candidate)* and other cluster B
  candidates — time-domain concerns; orthogonal to signal-driven
  selection.

**Out of scope (different architectural layer):**
- Customer-facing UI for quality-preference toggles (adapter-level).
  The SPF feature owns the state slot + algorithm; the adapter renders
  the UI ("Auto" / "Data saver" / "Best quality" menu items) and writes
  to the config.
- Signal-availability detection at the platform level (Chrome on Mac
  vs Chrome on Android vs iOS Safari). The SPF feature handles graceful
  no-op when an API is unavailable; the adapter / consumer doesn't
  need to know about platform-specific availability.
- Manual quality-pinning. That's the `userVideoTrackSelection`
  constraint+filter precedent from video-abr — orthogonal to multi-
  signal-ABR.

## Likely cross-cutting impact

Things this feature probably forces decisions on, not just additions:

- **Signal-fusion algorithm shape.** The current `selectQuality` is a
  pure function over candidates + bandwidth. Extending to multi-input
  requires a fusion strategy. Three shapes worth considering:
  (a) Bias-factor weighting — each signal produces a multiplier
  (e.g., `effectiveBandwidth = measuredBandwidth × networkBias ×
  batteryBias × thermalBias × preferenceBias`); selectQuality runs
  against the effective bandwidth. Simple, composable, easy to disable
  per-signal by setting bias to `1.0`.
  (b) Decision-tree / staged-filter — each signal further narrows
  the candidate set or shifts the bandwidth thresholds. More
  expressive; harder to compose.
  (c) Scoring function — each candidate gets a multi-input score;
  highest score wins. Most flexible; most opaque to tune.
  Lean: (a) for simplicity; revisit if real-world tuning needs more
  expressiveness.
- **Bandwidth safety floor.** Non-bandwidth biases must not override
  the bandwidth-safety floor — even with `'best-quality'` customer
  preference, the engine can't pick a rendition above `measuredBandwidth
  × safetyMargin` (it'll rebuffer). Bandwidth supremacy is structural.
- **Per-signal availability fallback.** Each monitor behavior gracefully
  no-ops when the underlying browser API is unavailable. The state slot
  stays `undefined`; the algorithm tolerates `undefined` by skipping
  that signal's bias (bias factor → `1.0`). This is the well-precedented
  pattern from `userVideoTrackSelection` (default-undefined). No
  composition-variant complexity needed.
- **Audio-vs-video signal applicability.** Some signals apply uniformly
  (battery, network, customer-preference); some are video-specific
  (thermal-pressure, visibility). The algorithm extension is signal-
  shape-agnostic; per-type relevance is in the bias-factor calculation
  per signal. Audio-ABR ignores thermal and visibility because its bias
  factors are always `1.0` for those signals.
- **Monitor-behavior composition shape.** Each signal monitor is a
  middle-pattern behavior. They compose into ABR-enabled engine
  variants alongside the algorithm. Two shapes possible: (a) compose
  *all* signal monitors into ABR variants (always-on with
  slot-undefined fallback for unavailable APIs); (b) compose *opt-in*
  per signal (each is a separate behavior consumers add to their engine
  variant). Lean: (a) for default discoverability; (b) is achievable
  by simply removing the monitor and letting the slot stay undefined.
- **Customer preference vs automatic biases.** Customer preference is
  the final layer in the bias-factor stack: it should be able to bias
  *upward* (`'best-quality'` overrides battery-low downward bias) but
  never override the bandwidth safety floor. This is the "policy reigns
  over automatic biases, physics reigns over policy" layering.
- **Cross-feature with [audio-abr](./audio-abr.md).** When audio-ABR
  lands, it consumes the same signal slots as video-ABR. Signal
  monitors don't duplicate; signal slots are shared. The fusion
  algorithm is per-type because the bias-factor calculations differ
  (audio doesn't bias on thermal/visibility); the *infrastructure* is
  shared.

## Open questions

- **Fusion algorithm strategy.** Bias-factor weighting (lean), decision-
  tree, or scoring function. Choice affects how customer-policy
  expressivity composes; bias-factors are easiest to tune empirically.
- **Default bias strengths.** Per-signal, what's the default scalar?
  Network `'slow-2g'` → 0.3? Battery `level < 0.2` → 0.7? These need
  empirical tuning, but a reasonable default set must ship.
- **Thermal-pressure detection heuristic.** Dropped-frames threshold
  alone vs combined with long-task signals. Distinguishing decode-
  pressure (real thermal/CPU issue) from network-driven gaps (which
  look similar in dropped-frames) is non-trivial. Naive depth:
  threshold-only. Full depth: combine signals + hysteresis.
- **Customer-preference shape.** Single enum (`'auto'` /
  `'data-saver'` / `'best-quality'`) vs scalar bias-strength
  (`qualityBias: -1.0 to 1.0`) vs per-signal customer overrides (more
  granular control). Customer use cases drive this; lean enum for
  discoverability + a Tier 2 scalar tuning slot for advanced consumers.
- **Audio-ABR signal subset finalization.** Some signals (battery,
  network) clearly apply to both; some (thermal, visibility) are video-
  specific. Distinguish at the algorithm-extension level (audio ignores
  some inputs) or at the signal-slot-population level (audio doesn't
  read those slots). Implementation question.
- **Picture-in-Picture distinction.** PiP makes `document.visibilityState`
  unreliable for "is the user watching?" — PiP is visible to user
  even when document is hidden. Visibility signal needs to fold in
  PiP state. Open: which APIs reliably surface PiP state across
  browsers, and what's the fallback when not detectable.
- **Signal-staleness handling.** A monitor that reports `effectiveType:
  '4g'` once at startup and never updates is stale on a long playback
  session. Should the algorithm time-bound signal freshness, or trust
  monitors to keep slots updated? Lean: trust monitors (event-driven
  update is the precedent).
- **Cross-feature ordering with rendition-selection-caps.** When both
  features ship, the pipeline is `capability → caps → bandwidth-and-
  signals → selection`. Filter order is implicit but worth confirming.

## Related features

- **[video-abr](./video-abr.md)** *(prerequisite)* — base algorithm
  being extended. `selectQuality` is the read-side; this feature
  widens its input axis.
- **[audio-abr](./audio-abr.md)** *(parallel sibling)* — extension
  applies to both video and audio ABR. Shared signal-monitor
  infrastructure; per-type bias calculation.
- **[rendition-selection-caps](./rendition-selection-caps.md)** —
  complementary feature on the constraint+filter axis. Caps narrow the
  candidate set; signals bias selection within it. Composable in the
  pipeline: caps → bandwidth+signals → selection.
- **[buffer-management](./buffer-management.md)** — when visibility
  signal lands, buffer-management may also want to pause forward-buffer
  fetching when hidden. Cross-cutting concern; lives in
  buffer-management not here.
- **`[bandwidth-estimation]`** *(candidate)* — the dual-EWMA primitive
  for `bandwidthState`. Not changed by this feature; the existing
  `bandwidthState` slot is the bandwidth-side input to fusion.
- **`[capability-probing]`** — adjacent for advanced cases (e.g.,
  hardware-DRM security-level pressure may interact with multi-signal
  bias if a thermally-pressured device can't sustain hardware decode);
  out of scope for v1.

## See also

- [video-abr.md](./video-abr.md) — base ABR algorithm; this feature
  extends `selectQuality`'s input axis
- [audio-abr.md](./audio-abr.md) — parallel sibling; shared signal
  infrastructure
- [rendition-selection-caps.md](./rendition-selection-caps.md) —
  complementary constraint+filter feature; precedent for middle-pattern
  signal monitors (viewport-driven cap)
- [5.1-surround-selection.md](./5.1-surround-selection.md) — middle-
  pattern precedent for environment-aware signal (downstream channel
  count); same mechanism shape as this feature's signal monitors
- [clusters.md § Track & variant registry](./clusters.md#track--variant-registry)
  — cluster C description
- [clusters.md § Feature classification axes](./clusters.md#feature-classification-axes)
  — Composition vs Policy vs middle pattern; this feature is the
  canonical multi-signal middle-pattern example
- [`@navigator.connection`](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
  — Network Information API
- [`navigator.getBattery()`](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API)
  — Battery Status API
- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
  — `document.visibilityState`
- [`VideoPlaybackQuality`](https://developer.mozilla.org/en-US/docs/Web/API/VideoPlaybackQuality)
  — dropped-frame stats for thermal-pressure inference
