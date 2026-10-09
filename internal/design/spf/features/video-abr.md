---
status: implemented
date: 2026-05-20
definition: sketched
---

# Video ABR

Bandwidth-driven adaptive bitrate selection for video. The engine measures throughput from in-progress segment fetches, maintains a dual-EWMA bandwidth estimate, and dynamically picks the highest-quality video track that fits the current bandwidth — with hysteresis to prevent oscillation. Manual track overrides coexist with ABR via a single constraint slot.

This doc captures the **capability surface**: what works, what doesn't, which behavior implements it, and how it relates to other features.

## Status

- **Composition:** The `hls/video` engine (HLS VoD)
- **Definition depth:** sketched — algorithm, config, state flow documented; deeper algorithm justification (why Shaka's dual-EWMA, why these margins) is not yet written down

## Phases of complexity

| Phase | What | Notes |
|---|---|---|
| Bandwidth-aware initial selection | On presentation resolve, pick the highest track that fits `initialBandwidth` (default 5 Mbps) | Custom `picker` config can override (e.g., "first track regardless of bandwidth, then let ABR adjust") |
| Dynamic bandwidth-driven adjustment | Re-pick whenever `bandwidthState` changes — downgrade immediately, upgrade only past `upgradeMargin` headroom | Hysteresis is structural (margin check), not temporal (no smoothing window beyond EWMA itself) |
| Dual-EWMA bandwidth estimate | Fast (2s half-life) + slow (5s half-life) accumulators; ABR consumes `min(fast, slow)` | Asymmetric by design — adapts down rapidly, upgrades sluggishly. Zero-factor correction applied at read time, not sample time |
| Safety margin on candidate selection | `selectQuality` requires `currentBandwidth >= track.bandwidth / safetyMargin` (default 0.85 = 15% headroom) | Pairs with `upgradeMargin` to prevent thrash; track uses ≤85% of measured bandwidth |
| Manual override via `userVideoTrackSelection` | Consumer sets `userVideoTrackSelection = { id: 'X' }` to narrow candidates; when only one remains, ABR short-circuits | No `abrDisabled` flag — the constraint pattern is the mechanism |
| ABR re-enable | Clear `userVideoTrackSelection` to restore dynamic selection | Symmetric with override |

## What's not implemented

- **Audio ABR** — sampling infrastructure exists (`createTrackedFetch`), but `setupAudioBufferActors` uses plain `fetchStream` instead. Wiring it through is a one-liner; a separate audio-quality-switching behavior would still be needed. See [audio-abr.md](./audio-abr.md) for the design surface — bandwidth-state sharing, multi-writer coordination with multi-language-audio's Tier 2, EWMA accumulator design under mixed-source sampling.
- **Rendition selection caps** — no max-height, max-bitrate, or max-FPS constraints on the candidate set. `selectQuality` operates over all video tracks. See [rendition-selection-caps.md](./rendition-selection-caps.md) for the umbrella feature covering billing-driven, viewport-driven, max-bitrate, and max-FPS caps.
- **Screen-size / viewport adaptation** — initial pick *could* be viewport-aware via custom `picker`, but ABR re-selection ignores device dimensions.
- **Non-bandwidth signals** — CPU/thermal throttling, network-type (WiFi vs. cellular), battery state are not factored. See [multi-signal-abr](./multi-signal-abr.md) for the scope — five per-signal phases (network / thermal / battery / visibility / customer preference) + a signal-fusion algorithm-extension phase. Bias-factor weighting is the leaning fusion strategy.
- **Buffer fullness as ABR input** — forward buffer (default 30s) gates *when segment loading starts*, not which track is selected. Bandwidth is the sole ABR input.
- **Pluggable strategy** — EWMA + hysteresis are fixed. Custom logic is only injectable for *initial* selection via `picker`; ABR re-evaluation always uses `selectQuality`.

## Implementation surface

**Composition:** `packages/spf/src/playback/engines/hls/engine.ts` — composed in place of `selectVideoTrack` (the two are alternatives; only one writes `selectedVideoTrackId` for a given engine).

**Behaviors:**

| Behavior | File | Responsibility |
|---|---|---|
| `switchVideoQuality` | `packages/spf/src/playback/behaviors/quality-switching.ts` | ABR-driven `selectedVideoTrackId` lifecycle: pick default, adjust on bandwidth changes, clear on src unload |

**Algorithm:**

| Module | File | Role |
|---|---|---|
| `selectQuality` | `packages/spf/src/media/abr/quality-selection.ts` | Pure function: given candidate tracks, current bandwidth, and config, return the track to pick (applies safety margin + upgrade margin) |
| `sampleBandwidth` / `getBandwidthEstimate` | `packages/spf/src/network/bandwidth-estimator.ts` | Dual-EWMA accumulator update + read-time estimate computation (with zero-factor correction) |
| `createTrackedFetch` | `packages/spf/src/network/fetch.ts` | Fetch wrapper that emits per-chunk bandwidth samples; consumed by `setupVideoBufferActors` to populate `bandwidthState` |

**State slots:**

- **Reads:** `presentation`, `bandwidthState`, `selectedVideoTrackId` (when constrained), `userVideoTrackSelection`
- **Writes:** `selectedVideoTrackId` (sole writer for ABR-driven cases; `userVideoTrackSelection` is the consumer-facing constraint, not a direct write to selection)
- **Cross-feature dependency:** `bandwidthState` is written by `setupVideoBufferActors` (sampling baked into segment-loader fetch), not by an ABR-specific behavior. Sampling and selection are decoupled — sampling lives with segment loading; selection lives with ABR.

**Alternative composition:** `selectVideoTrack` (in `packages/spf/src/playback/behaviors/select-tracks.ts`) is a simpler "pick first track" default; not composed in the current HLS engine but available for engine variants that don't want ABR (e.g., a fixed-quality engine). The two behaviors are mutually exclusive — both write `selectedVideoTrackId`.

## Config surface

```ts
{
  bandwidth?: {
    fastHalfLife?: number;        // default 2000ms — fast EWMA reactivity
    slowHalfLife?: number;        // default 5000ms — slow EWMA stability
    minTotalBytes?: number;       // sample filtering thresholds
    minBytes?: number;
    minDuration?: number;
  };
  quality?: {
    safetyMargin?: number;        // default 0.85 — track-bandwidth headroom
    upgradeMargin?: number;       // default 1.15 — upgrade hysteresis margin
  };
  initialBandwidth?: number;      // default 5_000_000 — bps, fallback before samples
  picker?: TrackPicker<QualitySwitchingConfig>;  // override initial selection
}
```

`picker` is invoked once when the slot is empty in `'presentation-resolved'` state. If it returns `undefined`, falls back to the bandwidth-aware default pick. ABR re-evaluation (after initial selection) always uses `selectQuality` — `picker` does not participate.

## Verification

- **Unit tests:**
  - `packages/spf/src/playback/behaviors/tests/quality-switching.test.ts` (~450 lines) — lifecycle (clear on unload, re-pick after reset), default-pick with initialBandwidth fallback, downgrade/upgrade hysteresis, user-constraint narrowing + ABR short-circuit, picker override, effect re-firing on bandwidth changes
  - `packages/spf/src/network/tests/bandwidth-estimator.test.ts` — EWMA math, zero-factor correction, sample filtering
  - `packages/spf/src/media/abr/tests/quality-selection.test.ts` — `selectQuality` algorithm in isolation
- **Sandbox:** `apps/sandbox/src/spf-segment-loading/` exposes the ABR surface: current bandwidth estimate (fast/slow), track list with bitrates, selected track + mode label, manual override buttons, ABR re-enable button. Tuning knobs (margins, half-lives) are not surfaced — they use defaults.

## Related features

- **single-video-track-default-selection** *(not yet documented)* — `selectVideoTrack` behavior, alternative to `switchVideoQuality` for non-ABR engine variants.
- **buffer-management** — `bandwidthState` is written by `setupVideoBufferActors` via `createTrackedFetch`; samples land on `buffer-management`'s fetch path (`fetchBytes` inside `SegmentLoaderActor`). Sampling is structurally co-located with segment loading, not ABR.
- **bandwidth-estimation** *(coarse, not yet documented)* — dual-EWMA accumulator is a reusable primitive in `network/`. Could be promoted to its own feature doc when audio ABR or other consumers arrive.
- **[audio-abr](./audio-abr.md)** — parallel-sibling feature on the audio axis. Same sampling-baked-into-loading pattern, same `selectQuality` algorithm reuse, same constraint-slot manual-override. Audio-specific design surface (bandwidth-state sharing, multi-writer coordination with multi-language-audio Tier 2) captured there.
- **[rendition-selection-caps](./rendition-selection-caps.md)** — billing-driven (1080p+), viewport-driven (screen-size), max-bitrate, and max-FPS caps. All filter the candidate set before `selectQuality` runs; `userVideoTrackSelection` is the constraint+filter precedent that feature builds on.
- **[multi-signal-abr](./multi-signal-abr.md)** — algorithm extension on `selectQuality`'s input axis. CPU/thermal throttling, network type, battery state, viewport visibility, customer preference as additional inputs. Distinct from rendition-selection-caps (constraint+filter): multi-signal-abr biases selection within the candidate set rather than narrowing it.
- **[capability-probing](./capability-probing.md)** — narrows the candidate set ABR operates over. `selectQuality` doesn't change shape; just sees a filtered candidate set with browser-unsupported renditions already excluded.
- **[hevc-variant-selection](./hevc-variant-selection.md)** — codec-aware variant filtering (HEVC if supported, AVC fallback). Same constraint+filter pattern as `userVideoTrackSelection`; narrows the candidate set ABR operates over by codec axis. Tier 2 mid-stream `changeType()` phase introduces cross-codec ABR (no algorithm change, just buffer-side switching).

## Use cases that compose this feature

- **[`video-only-mode-override`](../use-cases/video-only-mode-override.md)** *(coarse)* — Phase 1 baseline constituent. The video-only delivery variant composes video-abr as-is for multi-bitrate video selection.

## See also

- [presentation-modeling.md](../presentation-modeling.md) — architectural deep-dive on the format-neutral data shape; ABR consumes resolved video tracks surfaced by the parser interface this layer defines.
- [preload-modes.md](./preload-modes.md) — gates this feature indirectly via `resolvePresentation`; ABR can't fire until the presentation is resolved, and resolution is gated by the preload-modes contract.
- [mse-mms-pipeline.md](./mse-mms-pipeline.md) — where `setupVideoBufferActors` lives and where `createTrackedFetch` is wired into segment-loader construction; bandwidth sampling is structurally co-located with MSE buffer setup, ABR selection is the separate consumer documented here.
- [conventions/behaviors.md](../conventions/behaviors.md) — when to define a behavior; behavior shape
- [conventions/signals.md](../conventions/signals.md) — multi-writer slot conventions (relevant for `selectedVideoTrackId` write coordination if audio ABR follows the same pattern)
- [packages/spf/docs/hls-engine.md](../../../../packages/spf/docs/hls-engine.md) — full HLS engine composition walkthrough
