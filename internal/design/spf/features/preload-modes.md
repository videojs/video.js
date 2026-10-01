---
status: implemented
date: 2026-05-20
definition: sketched
---

# Preload modes

The engine's loading-semantics implementation: how `preload="none|metadata|auto"`
plus user / programmatic activation determine when the engine fetches the
manifest, sets up MSE, and starts segment loading. Together, the
`syncPreload` and `trackLoadTriggers` behaviors model loading behavior
similar to native `HTMLMediaElement` playback — `state.preload` is the
mode, `state.loadActivated` is the override that fires on
`play` / `seeking` (or programmatic intent), and downstream gates read
both.

This doc captures the **capability surface**: what works, what doesn't,
which behaviors / slots implement it, and how downstream features gate
on it.

## Status

- **Composition:** The `hls/video` engine (HLS VoD)
- **Definition depth:** sketched — capability surface and implementation
  footprint documented; the extended-preload-value mechanism is a
  forward-compatibility hook with no shipped consumer yet

## Phases of complexity

What's implemented today, organized as capability slices around the
engine's loading-semantics contract.

| Phase | What | Notes |
|---|---|---|
| W3C preload mode honoring | Engine respects `preload="none" \| "metadata" \| "auto"` via the `isBlockingPreload` predicate that downstream gates consume (`resolvePresentation`, the per-type segment-loading FSM). `'none'` is the strictest gate — blocks manifest fetch and all segment loading until activation. `'metadata'` resolves manifests + sets up MSE + fetches init segments only. `'auto'` runs the full pipeline | `isBlockingPreload` in `media/utils/preload.ts` is the core predicate |
| Bidirectional DOM ↔ state sync | `state.preload` and `mediaElement.preload` stay synchronized for W3C values. Effects registered read-before-write so a freshly mounted `<video>` element's `preload` attribute wins on attach. All writes are deduped to break echo loops between the two sides | `syncPreload`; load-bearing ordering documented in the behavior |
| Extended preload values | External writes of non-W3C values (e.g. `'canplay'`) are sticky on `state.preload`: the DOM-side read won't overwrite them, the state-side write won't push them to the DOM | Consumer-extension point; no shipped consumer reads extended values today |
| Default backfill | `state.preload` is never `undefined` in steady state. When neither the DOM attribute nor external code supplies a value, backfilled from `config.defaultPreload` (default `'metadata'`, matching the HTMLMediaElement element default) | Resolves the empty-state ambiguity at most one place: `syncPreload`'s read effect |
| DOM-triggered load activation | DOM `play` and `seeking` events on the attached media element flip `state.loadActivated` to true. Immediate-true on entry if `!el.paused \|\| el.seeking` — covers autoplay, native-controls play, and direct-DOM-`play()` paths the engine wasn't the source of | `trackLoadTriggers`; mirrors native HTMLMediaElement preload-override semantics |
| Programmatic load activation | External code writes `state.loadActivated = true` directly — the canonical path in `@videojs/spf/hls` is `HlsVideoMixin.play()`, which signals playback intent before invoking the element's `.play()`. Co-writer with `trackLoadTriggers`; same downstream effect | Multi-writer with intentionally orthogonal decision domains: DOM-event-driven vs programmatic-intent-driven |
| Per-source reset | `state.loadActivated` resets to `false` when source identity changes (URL or `mediaElement` swap, including direct in-place replacement with no `undefined` intermediate). New source starts at its appropriate preload mode regardless of the previous source's activation history | Sticky-per-source-identity; not sticky-per-engine |

## What's not implemented

- **Granular preload between `'metadata'` and `'auto'`** — the extended-
  preload-value mechanism can carry slot values like `'firstSegment'` or
  `'firstFrame'`, but no downstream consumer reads them. Extended-value
  support is a forward-compatibility hook today, not a shipped capability.
- **`loadActivated` re-deactivation within source** — sticky-true within
  a source identity. There's no way to "go back to preload-only" mid-
  source (e.g., to pause-and-evict on backgrounded tabs). A new source
  reset is the only way to clear the slot.
- **Activation triggers beyond `play` / `seeking`** — `loadedmetadata`,
  `canplay`, time-threshold crossings, viewport intersection, and similar
  hooks aren't wired in. Adding one is local to `trackLoadTriggers`.
- **External-state-write race during attach** — `syncPreload`'s read
  effect runs before the write on `mediaElement` swap, so a freshly
  attached element with a W3C `preload` attribute wins on attach. The
  read uses `peek` on `state.preload` to avoid re-triggering on external
  writes; external writes still go through but are queued behind the
  attach-time DOM read.

## Implementation surface

**Composition:** `packages/spf/src/playback/engines/hls/engine.ts` — both
behaviors are composed at the top of the pipeline, before
`resolvePresentation`. `syncPreload` is in the runtime-agnostic
`playback/behaviors/` (operates against `MediaElementLike`);
`trackLoadTriggers` is in `playback/behaviors/dom/` (consumes
`HTMLMediaElement` events directly).

**Behaviors:**

| Behavior | File | Responsibility |
|---|---|---|
| `syncPreload` | `packages/spf/src/playback/behaviors/sync-preload.ts` | Bidirectional `state.preload` ↔ `mediaElement.preload` sync; sticky extended values; W3C-only DOM writes; deduped to break echo loops |
| `trackLoadTriggers` | `packages/spf/src/playback/behaviors/dom/track-load-triggers.ts` | 3-state slot-driven FSM (`'preconditions-unmet' ⟷ 'monitoring' ⟷ 'load-active'`) writing `state.loadActivated = true` on `play` / `seeking` |

**Helpers:** `packages/spf/src/media/utils/preload.ts`

| Export | Role |
|---|---|
| `StandardPreload` | `'auto' \| 'metadata' \| 'none'` — the W3C `<video>`/`<audio>` `preload` value type |
| `isStandardPreload(value)` | Discriminator separating W3C values from extended values |
| `DEFAULT_PRELOAD` | `'metadata'` — matches the HTMLMediaElement element default |
| `isBlockingPreload(preload, defaultPreload?)` | Returns `true` iff `(preload \|\| defaultPreload) === 'none'`. Consumed by `resolvePresentation` and segment-loading gates |

**State slots:**

- `state.preload` — multi-writer:
  - **External / extended-value writer** (sticky) — external code may write
    extended values (e.g. `'canplay'`); `syncPreload`'s read effect leaves
    them alone, and its write effect doesn't push them to the DOM.
  - **`syncPreload` read effect (DOM-driven, W3C-only)** — copies
    `mediaElement.preload` into `state.preload` on `mediaElement` swap or
    `presentation.url` change, gated on `isStandardPreload` and on
    `state.preload` not already holding an extended value.
  - **`syncPreload` default-backfill** — when neither DOM nor external
    code has supplied a value, backfills from `config.defaultPreload`.
- `state.loadActivated` — multi-writer:
  - **`trackLoadTriggers`** writes `true` from DOM `play` / `seeking`
    listeners, plus immediate-true on entry if `!el.paused || el.seeking`.
    Writes `false` on source-identity reset.
  - **Adapter / external code** writes `true` directly to signal
    programmatic intent (canonical path: `HlsVideoMixin.play()`).
- `state.presentation` — read-only by these behaviors; the URL field is
  used by both to detect source identity changes (`syncPreload` for
  attach-time DOM-read re-firing; `trackLoadTriggers` for the per-source
  reset).

**Context slots:** `context.mediaElement` (read-only). Both behaviors
re-fire on element swap.

## Config surface

```ts
{
  defaultPreload?: StandardPreload;  // default 'metadata' — backfill for
                                     // state.preload AND fallback for
                                     // isBlockingPreload's gate predicate
}
```

`defaultPreload` is consumed by both `syncPreload` (state backfill) and
`resolvePresentation` (gate fallback) — keeping them in agreement is the
point of having a single config knob.

## Verification

- **Unit tests:**
  - `packages/spf/src/playback/behaviors/tests/sync-preload.test.ts` —
    bidirectional sync, sticky extended values, DOM-attribute-wins-on-
    attach ordering, dedupe behavior
  - `packages/spf/src/playback/behaviors/dom/tests/track-load-triggers.test.ts`
    — FSM transitions, `play` / `seeking` triggering, immediate-true on
    entry, per-source reset, multi-writer coexistence with external writes
- **Sandbox:**
  - `apps/sandbox/src/spf-segment-loading/` — main SPF demo; exercises
    preload-aware loading end-to-end
  - `apps/sandbox/src/hls-video-html/` / `hls-video-react/` — adapter
    integration paths showing how `HlsVideoMixin.play()` writes
    `loadActivated` programmatically alongside the DOM path

## Open questions

- **Triggers beyond `play` / `seeking`.** Should `loadedmetadata`,
  `canplay`, or viewport-intersection hooks contribute to
  `loadActivated`? `trackLoadTriggers` is the natural home, but each
  trigger has different consumer semantics worth working through.
- **Extended preload value adoption.** No shipped consumer reads
  extended values today. The sticky-write mechanism is a
  forward-compatibility hook; the first consumer (e.g., a
  `'firstSegment'` mode that fetches one segment then stops) would
  also need a corresponding gate in `resolvePresentation` / the
  segment-load FSM.
- **Multi-writer factoring on `loadActivated`.** Today: DOM listener
  (`trackLoadTriggers`) + programmatic adapter (`HlsVideoMixin.play()`).
  Two writers, one slot, intentionally orthogonal. As the multi-writer
  pattern accumulates data points (`selectedTextTrackId` is the other
  current concordant slot; `selectedAudioTrackId` is the proposed
  third for `multi-language-audio`), a shared coordination primitive
  may emerge.
- **Re-deactivation policy.** Sticky-true today; no
  in-source-identity reset. A future "pause + evict" policy on
  backgrounded tabs would push on this — likely a separate writer to
  `loadActivated = false` from a yet-to-be-named lifecycle behavior.

## Related features

- **mse-mms-pipeline** — gated indirectly through `resolvePresentation`.
  `setupMediaSource` only fires once the presentation is fully resolved,
  which only happens once the preload gate opens.
- **video-abr** — same: gated indirectly via presentation resolution.
- **subtitles** — `loadTextTrackSegments` uses the same preload-aware
  load-mode FSM as audio/video (`'dormant' / 'metadata-only' / 'full-range'`).
- **multi-language-audio** *(coarse)* — would inherit the same gating
  shape for any new audio behaviors.
- **buffer-management** — the canonical *consumer* of this feature's
  gate state. The 4-state load-mode FSM (`'preconditions-unmet'` /
  `'dormant'` / `'metadata-only'` / `'full-range'`) lives in
  `loadVideoSegments` / `loadAudioSegments` / `loadTextTrackSegments`
  and maps directly to `(preload, loadActivated)`. Forward-buffer +
  back-buffer plans also build on top of the gates this feature
  produces.
- **source-replacement** — the per-source `loadActivated` reset is one
  piece of the broader source-replacement cleanup cascade. New
  behaviors that join the engine and gate on resolved presentation must
  honor that cascade or in-place source replacement breaks silently.

## See also

- [conventions/behaviors.md](../conventions/behaviors.md) — behavior
  shape; slot-driven FSM pattern (`trackLoadTriggers` is a canonical
  instance)
- [conventions/signals.md](../conventions/signals.md) — multi-writer
  slot conventions (`loadActivated` is the second concordant data point
  alongside `selectedTextTrackId`)
- [clusters.md § Gating / prerequisite chains](./clusters.md#gating--prerequisite-chains)
  — cross-cluster pattern this feature exemplifies
- [packages/spf/docs/hls-engine.md](../../../../packages/spf/docs/hls-engine.md)
  — engine composition walkthrough (Stage 1 covers `syncPreload` and
  `trackLoadTriggers`)
