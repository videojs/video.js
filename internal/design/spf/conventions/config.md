---
status: draft
date: 2026-05-18
---

# Config

> **Where tunables live, how they flow, and when to push them up vs bake them in.** Engine-level config is the single source of truth for tunables; sub-configs are nested under domain headers and reuse the lower-layer `*Config` types; threading reaches every layer that consults the value. The principles here apply across behaviors, helpers, actors, reactors, and lower-layer functions (media/network).

This doc complements [`behaviors.md`](behaviors.md) (which covers per-helper-per-type config bundles + engine-config spread at the variant level) and [`actors.md`](actors.md) (which covers actor-factory config args). The patterns here are the cross-cutting ones — they apply to every layer that consumes a tunable.

## When to make something config

Not every hardcoded value is config-worthy. The diagnostic question:

**Who would override this, and why?**

- **Engine-tunable** — when an engine variant (low-latency live vs. VOD vs. test stub) would meaningfully change the value. Examples: forward-buffer duration, ABR safety/upgrade margins, bandwidth-estimator half-lives.
- **Composition-supplied implementation** — when the value is a strategy / function (`resolveTextTrackSegment`, `parsePresentation`). Engines wire a default; alternative compositions wire their own.
- **Implementation detail** — when the value is internal correctness, not user intent. Examples: `SEGMENT_TIME_EPSILON` (floating-point tolerance for timestamp matching), `setTimeout(..., 0)` for settling ticks, runner choice (Serial vs. Concurrent).

The first two are config. The third is an internal constant — if duplicated across files, extract to a shared module-level constant for DRY, but **don't** thread it through config.

The audit prompt during refactor: "If an engine wanted to swap this value, would the change be *meaningful* (different tuning for different use cases) or *risky* (likely to break correctness)?" Meaningful → config; risky → constant.

## Engine config as the single source of truth

Tunables come from one place: the engine config object passed to `createComposition({ config })`. The composition framework distributes the same config to every behavior; each variant reads its slice.

```ts
const engine = createEngine({ // from '@videojs/spf/hls/video'
  initialBandwidth: 2_000_000,
  forwardBuffer: { bufferDuration: 60 },        // nested sub-config
  quality: { safetyMargin: 0.9, upgradeMargin: 1.2 },
  bandwidth: { minTotalBytes: 64_000 },
});
```

The engine config is the public API surface. Behaviors, helpers, actors, and lower-layer functions don't read module-level defaults at runtime when an engine value could override — they thread through.

### The multi-layer source-of-truth principle

If a tunable affects multiple layers, every layer must thread it from the same engine source. Defaulting independently from a module-level constant in two places is a latent bug:

- Engine override sets `forwardBuffer.bufferDuration: 60`.
- Layer A (dispatcher) reads it from config → uses 60.
- Layer B (actor) doesn't thread it → uses module default of 30.
- Layers disagree at runtime; engine override silently fails to apply consistently.

**Diagnostic during refactor:** for each module-level constant referenced inline (e.g. `DEFAULT_FORWARD_BUFFER_CONFIG.bufferDuration`), ask "is this value also consulted elsewhere?" If yes, both consumers need to thread from the same source.

Worked example: `bufferDuration` is used by the load-segments dispatcher (for `range.end`) AND by the segment-loader actor (for `getSegmentsToLoad` / `calculateForwardFlushPoint`). Both thread from the engine's `forwardBuffer?: Partial<ForwardBufferConfig>`. Engine override applies consistently.

## Nested sub-configs at the engine layer

Engine config groups domain-related tunables under sub-configs that reuse the lower-layer `*Config` types:

```ts
interface EngineConfig {
  // Sub-configs reuse the canonical types from their owning module
  bandwidth?: Partial<BandwidthConfig>;        // network/bandwidth-estimator
  quality?: Partial<QualityConfig>;            // media/abr/quality-selection
  forwardBuffer?: Partial<ForwardBufferConfig>;// media/buffer/forward-buffer
  backBuffer?: Partial<BackBufferConfig>;      // media/buffer/back-buffer

  // Composition-supplied function overrides stay flat (no obvious domain header)
  resolveTextTrackSegment?: TextTrackSegmentResolver<VTTCue>;
  parsePresentation?: ParsePresentation;
  // ...

  // Standalone tunables that aren't in any sub-config
  initialBandwidth?: number;
}
```

**Naming convention:** the sub-config field name names the domain (`bandwidth`, `quality`, `forwardBuffer`, `backBuffer`). Inside the sub-config, field names are short (no domain prefix — the parent type carries the context). So `bandwidth.fastHalfLife` reads naturally; `bandwidthFastHalfLife` flat would be noisier at the engine surface.

**`Partial<*Config>`** is the right shape for engine sub-configs: engines override individual fields. Internally, the variant or helper spreads the partial over the full `DEFAULT_*_CONFIG` to get a complete config:

```ts
const bandwidthConfig: BandwidthConfig = { ...DEFAULT_BANDWIDTH_CONFIG, ...config.bandwidth };
getBandwidthEstimate(state.bandwidthState.get(), initialBandwidth, bandwidthConfig);
```

The full config (with defaults filled in) is what reaches the lower-layer function. Lower-layer functions still accept a default-typed `*Config` (not a partial) — the spread-over-defaults pattern is the variant's responsibility, not the algorithm's.

### When to nest vs. keep flat

- **Nest** when the tunable already has a canonical `*Config` type in a lower-layer module (network/, media/abr/, media/buffer/). Reuse the type via `Partial<*Config>`.
- **Keep flat** when there's no sub-config and the tunable is standalone — e.g., `initialBandwidth` is a quality-switching-specific pre-measurement default that doesn't fit `BandwidthConfig` (which is the bandwidth estimator's tuning) or `QualityConfig` (which is the selection algorithm's). One field, no domain grouping needed.

If a tunable feels orphaned at the engine surface (no obvious domain), that's a sniff worth pausing on: maybe the right answer is to add it to an existing sub-config, define a new one, or accept that it's variant-specific and keep it flat.

## Threading paths

Engine config flows through three kinds of consumers:

### Behavior variants (via composition's per-behavior config distribution)

The composition framework passes the engine config to every behavior's `setup({ state, context, config })`. Variants spread it onto per-helper-per-type defaults and pass to the helper:

```ts
export const loadVideoSegments = defineBehavior({
  setup: ({ state, context, config = {} }: { /* ... */; config?: object }) =>
    setupSegmentLoading({ state, context, config: { ...VIDEO_SEGMENT_LOADING_CONFIG, ...config } }),
});
```

The variant's `config?: object` typing is intentionally loose (see [`behaviors.md`](behaviors.md) § "Per-helper-per-type config constants + engine spread"). The helper's signature is what enforces shape.

### Helpers (via destructured fields on the helper's typed config)

Helpers add optional fields for each tunable they consume:

```ts
function setupSegmentLoading<...>({ state, context, config }: {
  state: SegmentLoadingStateMap<K>;
  context: { [P in L]: ReadonlySignal<SegmentLoaderLike<Track> | undefined> };
  config: {
    selectedKey: K;
    loaderKey: L;
    findResolvedTrack: ...;
    forwardBuffer?: Partial<ForwardBufferConfig>;   // optional read
  };
}): Reactor<...> {
  const bufferDuration = config.forwardBuffer?.bufferDuration ?? DEFAULT_FORWARD_BUFFER_CONFIG.bufferDuration;
  // ...
}
```

The helper's typed signature is the contract — adding a new tunable is a localized change to that type + the field read.

### Actor factories (via dedicated config arg)

Actor factories accept a config arg at construction:

```ts
export interface SegmentLoaderActorConfig {
  forwardBuffer?: Partial<ForwardBufferConfig>;
  backBuffer?: Partial<BackBufferConfig>;
}

export function createSegmentLoaderActor(
  sourceBufferActor: SourceBufferActor,
  fetchBytes: FetchBytes,
  config: SegmentLoaderActorConfig = {}
): SegmentLoaderActor {
  const forwardBufferConfig: ForwardBufferConfig = { ...DEFAULT_FORWARD_BUFFER_CONFIG, ...config.forwardBuffer };
  // ...uses forwardBufferConfig in planTasks
}
```

The setup-actor behavior (`setupVideoBufferActors`, etc.) constructs the actor with the relevant slice of the engine config:

```ts
const segmentLoader = createSegmentLoaderActor(bufferActor, fetch, { forwardBuffer, backBuffer });
```

See [`actors.md`](actors.md) § "Where actors are created: the per-type setup-actor convention" for the ownership rule that makes this the natural threading point.

### Lower-layer functions (parameter, not embedded)

Functions in `media/` and `network/` accept config as a parameter with a `DEFAULT_*_CONFIG` fallback:

```ts
export function calculateForwardFlushPoint(
  bufferedSegments: readonly Segment[],
  currentTime: number,
  config: ForwardBufferConfig = DEFAULT_FORWARD_BUFFER_CONFIG
): number { /* ... */ }
```

The parameter default is for non-threaded callers (tests, ad-hoc uses). The threaded callers (actors, behaviors) pass explicit config built from engine values. Both work; the parameter default is the safety net.

## DRY for shared defaults

When the same default value flows through multiple layers, define it once in the lowest-layer module's `DEFAULT_*_CONFIG`. Higher layers reference it.

Worked example: `safetyMargin` is consumed by `selectQuality` (the algorithm in `media/abr/quality-selection.ts`) and by the quality-switching dispatcher. The single source is `DEFAULT_QUALITY_CONFIG.safetyMargin = 0.85`. Anywhere a "default safety margin" is needed, the reference is to that constant — no duplicated literal `0.85`.

The smell to watch for: a `DEFAULT_*_CONFIG` in a higher-layer module that duplicates a literal value also in a lower-layer module's `DEFAULT_*_CONFIG`. That's two sources of truth; consolidate.

## Decision logic with the algorithm, not the caller

Adjacent principle to config threading: when a decision depends on inputs the algorithm could know about, push it INTO the algorithm. Callers that previously post-processed the algorithm's output collapse.

**Worked example:** the ABR dispatcher used to post-process `selectQuality`'s output:

```ts
// Before — caller branches on the algorithm's output
const optimal = selectQuality(candidates, bandwidth, { safetyMargin });
if (!currentTrack) {
  // apply optimal directly
} else if (optimal.bandwidth < currentTrack.bandwidth) {
  // downgrade — apply
} else if (optimal.bandwidth >= currentTrack.bandwidth * upgradeMargin) {
  // upgrade clears margin — apply
} else {
  // upgrade doesn't clear — stay
}
```

`upgradeMargin` was *config*, but the *decision* using it lived in the caller. Moving the decision INTO `selectQuality` (by giving it `currentTrack` + `upgradeMargin` in its config) collapses the caller:

```ts
// After — algorithm owns the decision
const optimal = selectQuality(candidates, bandwidth, { safetyMargin, upgradeMargin, currentTrack });
if (optimal.id !== selectedId) state[selectionKey].set(optimal.id);
```

**Diagnostic question:** "Is the caller branching on the algorithm's output using values the algorithm could read from its config?" If yes, push the decision down. The caller's job becomes "ask the algorithm what to do; apply the answer."

This is structurally separate from config threading (it's API-design), but it surfaces during config audits — when you thread a tunable, ask whether the algorithm should also own the decision that consumes it.

## Anti-patterns

- **Inline module-level constant where engine should override.** `DEFAULT_FORWARD_BUFFER_CONFIG.bufferDuration` referenced directly inside a behavior body or actor planTasks when engine config could thread an override. Replace with `config.forwardBuffer?.bufferDuration ?? DEFAULT_FORWARD_BUFFER_CONFIG.bufferDuration` (or thread the full config).
- **Same value defaulted in two layers from a module constant.** If the engine override only reaches one layer, the layers disagree at runtime. Audit every module-level constant reference and verify single-source-of-truth across consumers.
- **Engine config with deeply-nested optional chaining at every read.** If a helper reads `config.x?.y?.z` repeatedly, extract once at the top of the helper body: `const z = config.x?.y?.z ?? DEFAULT.z`. Body code uses the unwrapped value.
- **Threading config purely for future extension.** Don't add `config?: Partial<X>` to a helper that doesn't actually read any field of X. Add the field + thread when a real engine-override need surfaces.
- **Tunable mistaken for implementation detail (or vice versa).** Re-run the "who would override this, and why?" diagnostic when in doubt. If you can't name a plausible engine variant that would change it, it's implementation detail.
- **Decision logic in the caller that the algorithm could own.** If the caller branches on the algorithm's output using values that are config of the algorithm, push the decision into the algorithm.
- **Engine-config field that doesn't correspond to a real engine variant's needs.** Engine config is API surface; every field implies an engine somewhere wants to override it. Don't add fields speculatively — they accrete and rot.
