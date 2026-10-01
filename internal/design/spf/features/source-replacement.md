---
status: implemented
date: 2026-05-20
definition: sketched
---

# Source replacement

The engine's source-change capability: load a new source on an
already-attached engine without recreating it. Driven by overwriting
`state.presentation` with a new unresolved `{url}`; `resolvePresentation`
routes the FSM back through `'resolving'` and downstream behaviors tear
down their per-source state via reactor state-exit. The cascade is
load-bearing — every behavior that gates on `isResolvedPresentation`
must honor the state-exit cleanup contract, or in-place replacement
breaks silently.

This doc captures the **capability surface**, the **cleanup contract**
new behaviors must honor, and the verification that pins the
in-place path against regression.

## Status

- **Composition:** The `hls/video` engine (HLS VoD)
- **Definition depth:** sketched — capability surface, cleanup contract,
  and validation test all in place
- **Cleanup contract** (load-bearing): every behavior that gates on
  `isResolvedPresentation` MUST tear down cleanly via reactor state-exit
  when presentation un-resolves. Setup behaviors detach DOM resources /
  destroy actors / clear context slots; async-fetch behaviors bind
  `AbortController` to state-exit. New behaviors that join the engine
  must follow this pattern or the in-place source-replacement validation
  test (`engine.test.ts` → "cleanly replaces source in place via
  state.presentation overwrite") will fail.

## Phases of complexity

Capability slices around the source-change contract. Each phase is a
distinct engine behavior observable from outside.

| Phase | What | Notes |
|---|---|---|
| Initial source load | First source on a fresh engine: external write of `state.presentation = { url }` triggers resolve + full pipeline setup | The unresolved → resolved transition that bootstraps everything |
| In-place source replacement | Overwrite `state.presentation` with a new `{ url }` while a previous source is resolved / playing. `resolvePresentation` routes back through `'resolving'`; downstream behaviors tear down via reactor state-exit; new source resolves and plays — *same engine instance* | Validated end-to-end. MediaSource + buffer actors are fresh instances; in-flight fetches aborted via state-bound `AbortController`s |
| Source unset | Set `state.presentation` to `undefined`. All presentation-gated behaviors transition to `'preconditions-unmet'` and tear down. Engine is fresh-but-attached, ready for the next source | The "no source" steady state; reachable from any resolved state |
| Adapter-driven in-place replacement (canonical consumer path) | `HlsVideoMixin.src` overwrites `state.presentation` on its recycled engine (empty `src` → `undefined`, unsetting the source). Media element + engine-wide preload persist across the change | Canonical *consumer-side* mechanism. Rides the same in-place cascade as engine-internal replacement — no engine recreation. Tested via the recycling assertions in `adapter.test.ts` |
| Per-source-identity slot lifecycle | `loadActivated` resets to `false` when source identity changes (URL or `mediaElement`); selected*TrackIds clear naturally on un-resolve (their pickers re-run against the new presentation); **`bandwidthState` is intentionally preserved** across source resets — sampling accumulates via the once-per-behavior `createTrackedFetch` | ABR resume: bandwidth estimate carries over so the first segment of a new source picks an appropriate quality based on observed throughput |

## What's not implemented

- **Cross-codec source replacement** — same-codec sources work (the
  segment-loader's time-aligned dedup handles it); cross-codec
  replacement would need `changeType()` handling. Folds into the
  `[buffer-flushing]` and `[5.1-surround-selection]` /
  `[hevc-variant-selection]` candidates.
- **Source-error recovery state** — `resolvePresentation` currently
  surfaces fetch / parse failures via `console.error` (with a TODO in
  the code: "route to a state-error slot once one exists"). Consumers
  have no observable signal for "source failed to load." Owned by
  [errors](./errors.md) (its phase 6).
- **Per-source `bandwidthState` reset opt-in** — preservation is the
  baked-in policy (ABR resume). No opt-out exists for testing or
  fresh-session scenarios that want a clean estimator.
- **Concurrent pre-fetch / hand-off** — replacement is teardown-then-
  rebuild; the engine doesn't support pre-warming the next source while
  the current one plays. Playlist / queue semantics are out of scope.

## Implementation surface

**Composition:** `packages/spf/src/playback/engines/hls/engine.ts` — the
source-replacement capability isn't owned by any single behavior; it
emerges from `resolvePresentation`'s 4-state FSM + the cleanup contract
every presentation-gated behavior honors.

**Orchestrator:** `resolvePresentation`
(`packages/spf/src/playback/behaviors/resolve-presentation.ts`)

| State | What |
|---|---|
| `'preconditions-unmet'` | No presentation, or presentation has no URL |
| `'idle'` | URL present, unresolved, preload gate unmet — waits for `loadActivated` or non-blocking preload |
| `'resolving'` | URL present, unresolved, gate met. Entry starts fetch + binds `AbortController` to state-exit |
| `'resolved'` | `state.presentation` holds a resolved `Presentation` |

State transitions on `state.presentation` writes are the source-
replacement mechanism: overwriting a resolved presentation with a new
unresolved `{ url }` routes the FSM `'resolved' → 'resolving'` (assuming
gate open), aborting any prior in-flight fetch and starting fresh.

**Cleanup contract — behaviors that ride the resolved/unresolved cascade:**

| Behavior | What it tears down on state-exit |
|---|---|
| `setupMediaSource` | Aborts in-flight `waitForMediaSourceOpen`; detaches MediaSource from element; clears `context.mediaSource` |
| `setupVideoBufferActors` / `setupAudioBufferActors` | Destroys `SegmentLoaderActor` then `SourceBufferActor` (reverse order); clears `context.{video,audio}{BufferActor,SegmentLoaderActor}` |
| `setupTextTrackActors` | Destroys text-track actors; clears context slots |
| `updateMediaSourceDuration` | Aborts in-flight `waitForMediaSourceOpen` + `waitForSourceBuffersReady` |
| `endOfStream` | Aborts in-flight wait |
| `resolveVideoTrack` / `resolveAudioTrack` / `resolveTextTrack` | Aborts in-flight playlist fetch |
| `resolvePresentation` | Aborts in-flight manifest fetch via state-exit on the `'resolving'` entry's `AbortController` return |

**Per-source-identity-aware behaviors** (transition independently on
source change, not via the resolved/unresolved cascade):

| Behavior | Per-source reset |
|---|---|
| `trackLoadTriggers` | `loadActivated` reset to `false` on `(mediaElement, presentation.url)` identity change |
| `selectAudioTrack` / `switchTextTrack` / `switchVideoQuality` | Re-pick when presentation transitions to resolved with new content |

**Cross-source preservation:**

| Slot | Why preserved |
|---|---|
| `state.bandwidthState` | ABR resume — `createTrackedFetch` in `setupVideoBufferActors` is constructed once at behavior setup and accumulates EWMA across source resets |
| `state.preload` | Engine-wide preference, not source-specific |
| `state.currentTime` | DOM-side mirror via `trackCurrentTime`; resets on new presentation naturally (element `currentTime` resets on `src` change) |

**Multi-writer `state.presentation` pipeline.** Three writer domains,
non-overlapping aspects:
- **Adapter / external** — writes initial unresolved `{ url }` (and
  overwrites with new `{ url }` for in-place replacement)
- **`resolvePresentation`** — writes resolved `Presentation` with
  `id`, `selectionSets`, etc.
- **Per-track resolvers + `calculatePresentationDuration`** —
  `resolveVideoTrack` / `resolveAudioTrack` / `resolveTextTrack` patch
  resolved segment lists into their respective tracks;
  `calculatePresentationDuration` patches in `duration`. Each reads
  current value and writes a new one with their field added; none
  overwrites a field another owns.

## Config surface

No engine-level config for source replacement itself. The
`config.parsePresentation` required by `resolvePresentation` is the
format-neutral parser hook (e.g., the HLS engine supplies
`parseMultivariantPlaylist`); it doesn't affect source-replacement
semantics — every replaced source runs through the same parser.

## Verification

- **Unit tests:**
  - `packages/spf/src/playback/engines/hls/tests/engine.test.ts` →
    `"cleanly replaces source in place via state.presentation overwrite"`
    — end-to-end validation: mock fetch with two sources A and B,
    resolve source A through the full pipeline, capture identities of
    `mediaSource` / `videoBufferActor` / `audioBufferActor`, overwrite
    `state.presentation` with source B, verify B resolves and the
    captured identities differ from the new ones (proving teardown
    cascade ran)
  - `packages/spf/src/playback/adapters/hls-video/tests/mixin.test.ts` →
    `"reuses the same engine instance when src changes"` /
    `"does not destroy the engine when src changes"` /
    `"keeps the attached media element across src changes"`
    — validates the canonical adapter's in-place recycling path
  - `packages/spf/src/playback/behaviors/dom/tests/track-load-triggers.test.ts`
    — `loadActivated` per-source-identity reset coverage
- **Sandbox:**
  - `apps/sandbox/src/spf-segment-loading/` — exercises initial source
    load + manual rendition switching (in-track, not source change)
  - `apps/sandbox/src/hls-video-html/` / `hls-video-react/` — adapter
    integration; src reassignment recycles the engine via the in-place path

## Open questions

- **Error recovery surface.** `resolvePresentation` currently uses
  `console.error` for fetch / parse failures and has a `TODO(error-
  management)` for a state-error slot. The shape of this slot — single
  error vs per-source — affects how consumers respond to "source failed
  to load." Now tracked in [errors](./errors.md); this feature's
  resolved/unresolved cascade is that doc's per-source reset mechanism.
- **Adapter rationale.** Resolved: the canonical adapter
  now recycles a single engine and drives source changes through in-place
  `state.presentation` replacement — the same load-bearing cascade the
  engine uses internally. Recycling was adopted so per-source teardown
  routes through one path, and so adapter-side projections wire once at
  construction instead of re-wiring on every src change.
- **Per-source `bandwidthState` reset opt-in.** Preserving across
  sources is the right default for ABR resume, but a test / fresh-
  session escape hatch may earn its place when consumers start needing
  it.

## Related features

- **preload-modes** — gates `resolvePresentation`'s `'idle'` →
  `'resolving'` transition; per-source `loadActivated` reset (in
  `trackLoadTriggers`) is part of the source-identity-aware behavior
  surface this feature relies on.
- **mse-mms-pipeline** — `setupMediaSource` is the canonical example
  of riding the resolver's resolved/unresolved lifecycle for cleanup;
  the feature doc calls this "structural" routing out explicitly.
- **buffer-management** — segment-loader actors tear down via the same
  cascade; in-flight fetches aborted; bandwidth sampling preserved
  across sources via `createTrackedFetch` constructed once.
- **video-abr** — `bandwidthState` preservation policy lives here.
  Observable behavior: ABR resumes across source changes rather than
  re-bootstrapping from `initialBandwidth`.
- **subtitles** — text-track actors and selection clear on source
  un-resolve via the cleanup cascade.
- **engine-adapter-integration** — `HlsVideoMixin`'s source-
  assignment path lives here. The adapter recycles a single engine and
  drives source changes through this feature's in-place cascade.

## See also

- [presentation-modeling.md](../presentation-modeling.md) —
  architectural deep-dive on the format-neutral data shape, parser
  interface, and per-track resolution layer. The multi-writer
  `state.presentation` pipeline this feature characterizes is anchored
  in that doc's data model
- [clusters.md § Engine lifecycle](./clusters.md#engine-lifecycle) —
  cross-cutting concerns around engine instantiation, source loading,
  and per-source identity resets (this feature + `preload-modes`)
- [packages/spf/docs/hls-engine.md](../../../../packages/spf/docs/hls-engine.md)
  — engine composition walkthrough (Stage 1 covers
  `resolvePresentation`)
- [conventions/behaviors.md](../conventions/behaviors.md) — reactor
  state-exit cleanup conventions
- [conventions/signals.md](../conventions/signals.md) — multi-writer
  slot conventions (`state.presentation` is the canonical pipeline-
  pattern example)
