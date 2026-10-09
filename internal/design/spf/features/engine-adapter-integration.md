---
status: implemented
date: 2026-05-20
definition: sketched
---

# Engine-adapter integration

The engine's external-driving contract: the composition an engine
returns exposes its `state` and `context` signal maps, `defineExternalSignals`
declares the external signals, keys the adapter writes but no behavior declares, and
`HlsVideoMixin` is the canonical adapter that maps a WHATWG
HTMLMediaElement-shaped API onto those signals. The
*audience* for this feature is adapter authors and contributors who
need to drive the engine from outside — not end users, who see the
adapter's API only through whatever wraps it (e.g., the
`HlsVideoAdapter` class, or the custom elements built on it).

The feature ships as a *pair*: the engine's returned signals + the
canonical mixin. New adapter shapes (React hooks, RN bridges, etc.)
would drive those signals independently of the mixin.

**Both halves live in `@videojs/spf`, and the Media is the package's
public playback API.** SPF is unlike hls.js or dash.js in that it
exposes no engine-shaped API for consumers to drive: the
`@videojs/media` facade *is* how a composed engine is consumed, so SPF
owns and ships that facade rather than leaving it to a downstream
package. `@videojs/spf` therefore depends on `@videojs/media` (for the
`ErrorLike` / `MediaStreamType` contracts, the element hosts, and the
track-list infrastructure) — not the other way around — which is why
`HlsVideoMediaError` extends `ErrorLike` and `HlsVideoMediaStreamType`
*is* `MediaStreamType` rather than a structurally-compatible copy.

The Medias ship behind their own entry points, `@videojs/spf/hls-video`
and `@videojs/spf/hls-audio`, kept separate from the engines' own entry
points (`@videojs/spf/hls/video`, `@videojs/spf/hls/audio`,
`@videojs/spf/hls/background-video`) so that wiring an engine directly
pulls in neither a Media nor `@videojs/media`. That separation also keeps
each engine entry measurable as that engine's own size budget. (When the
engines still shared `./hls`, splitting the adapters out took it from
20.40 KB to 19.08 KB gzipped, back under its 20 KB target.)

## Status

- **Composition:** The `hls/video` engine (HLS VoD); external signals
  declared with `defineExternalSignals`, the last entry in the behavior list
- **Definition depth:** sketched — capability surface and the
  adapter-rationale open question both documented

## Phases of complexity

| Phase | What | Notes |
|---|---|---|
| Engine signals on the returned composition | `createComposition` returns the same `state` / `context` signal maps every behavior receives, and the engine returns that composition. `defineExternalSignals<ExternalState>()({ state })` declares the external signals (`user*TrackSelection`, `disableRemotePlayback`) | Read/write intent is expressed at the use site. Previously a `shareSignals` behavior, composed last, handed these same signal objects to an `onSignalsReady` callback |
| Mixin adapter pattern | `HlsVideoMixin` is the canonical consumer: function-of-base-class structure (mix into any base), holds the engine and drives its `state` / `context`, exposes a WHATWG HTMLMediaElement-shaped API mapping each setter/method to engine writes | Downstream use: `class HlsVideoAdapter extends HlsVideoMixin(HTMLVideoAdapter) {}` in `packages/spf/src/playback/adapters/hls-video/` |
| Media element binding | `attach(el)` writes `context.mediaElement`; `detach()` clears it. **Engine persists across attach/detach cycles** — only `src` reassignment or explicit `destroy()` tears it down | Re-attach to a different element is supported. The engine is the durable state holder; `mediaElement` is a context slot |
| Source assignment via in-place recycling | Adapter's `set src` overwrites `state.presentation` on its single recycled engine (`{ url }`, or `undefined` for empty src). Media element + engine-wide preload persist; no engine recreation, no signal re-capture | Drives the engine's in-place source-replacement cascade — see [source-replacement.md](./source-replacement.md). (The adapter previously destroyed + recreated the engine per assignment.) |
| Preload reflection | `set preload(value)` writes W3C values to `state.preload`; clearing (`preload = ''`) doesn't patch the current engine but is re-applied on the next src change. Pre-attach src + preload combinations are supported | Extended preload values flow through state but don't reach the DOM (per [`preload-modes`](./preload-modes.md)'s sticky-extended-values semantics) |
| Programmatic `play()` with retry | `play()` writes `state.loadActivated = true` (co-writer with `trackLoadTriggers`'s DOM listener path) before invoking native play. **Defensive retry:** if native play rejects with "no supported sources" while src is pending, wait for `loadstart` (MSE attaches blob URL) and retry once | The retry handles MSE pipeline timing — adapter doesn't know exactly when MSE setup attaches the blob URL. Listener canceled on src change |

## What's not implemented

- **Reactive change-notification surface** — the engine exposes
  signals, not events. Consumers wanting to react to state changes from
  outside the engine subscribe via SPF primitives (`effect()`, signal
  `subscribe()`). The adapter doesn't expose
  curated `onPlay` / `onSrcChange` / `onError` callbacks.
- **Multiple engine instances per adapter** — one engine per adapter
  instance. No built-in pattern for multi-engine scenarios
  (picture-in-picture with two streams, A/B testing).
- **Non-HTMLMediaElement adapter shapes** — React-friendly hooks,
  React Native bridges, etc. would drive the engine's signals
  independently. Today the canonical adapter is HTMLMediaElement-
  shaped via the mixin. No bracketed candidate features tracked yet;
  add when concrete need surfaces.
- **Curated state / error introspection** — consumers can read
  `engine.state.*.get()` directly, but there's no adapter-level
  "current playback state" / "current error" shape that doesn't
  require knowing the engine's signal map. The error half is owned by
  [errors](./errors.md) (its phase 4 adds the `error` / `MediaError`
  surface, mirroring the `hls-js` and `native-hls` error mixins).

## Implementation surface

**Composition:** `packages/spf/src/playback/engines/hls/engine.ts` (`@videojs/spf/hls/video`) —
the behaviors are listed once at module level, ending with the external
signals, and the engine's state and context types are derived from that
list:

```ts
const externalSignals = defineExternalSignals<UserTrackSelectionState & DisableRemotePlaybackState>()({
  state: ['userVideoTrackSelection', 'userAudioTrackSelection', 'userTextTrackSelection', 'disableRemotePlayback'],
});

const behaviors = [
  // ... all other behaviors ...
  externalSignals,
] as const;

export type EngineState = ResolveBehaviorState<typeof behaviors>;

// ...

export const createEngine = defineCompositionFactory([...behaviors], { defaultConfig, initialState });
```

**Behavior factory:**

| Export | File | Role |
|---|---|---|
| `defineExternalSignals<ExternalState, ExternalContext>()({ state, context })` | `packages/spf/src/core/composition/define-external-signals.ts` | Generic behavior factory. Declares the external state and context keys, checked complete against the two shapes; its setup does nothing |

**Canonical adapter:**

| Export | File | Role |
|---|---|---|
| `HlsVideoMixin<Base>` | `packages/spf/src/playback/adapters/hls-video/mixin.ts` | Function-of-base-class mixin. Holds the engine and drives its `state` / `context`; exposes WHATWG HTMLMediaElement-shaped API |
| `HlsVideoAdapterCore` | same | Standalone subclass: `HlsVideoMixin(class {})`. Bare-bones reference instance |
| `HlsVideoAdapterProps` / `HlsVideoAdapterAPI` | same | The adapter's public-facing shape |

**Adapter ↔ engine state/context map:**

| Adapter call | Engine write |
|---|---|
| `attach(el)` | `context.mediaElement.set(el)` |
| `detach()` | `context.mediaElement.set(undefined)` |
| `destroy()` | `engine.destroy()` |
| `set src(value)` | `state.presentation.set({ url: value })` on the recycled engine (`undefined` for empty src) |
| `set preload(value)` | `state.preload.set(value)` (W3C values only; pre-empties stay engine-local) |
| `play()` | `state.loadActivated.set(true)` → native `play()` with `loadstart` retry on "no supported sources" |

**Downstream consumer:** `packages/spf/src/playback/adapters/hls-video/adapter.ts`:

```ts
export class HlsVideoAdapter extends HlsVideoMixin(HTMLVideoAdapter) {}
```

This is the canonical end consumer — used wherever the HTML player
expects an HTMLMediaElement-shaped object backed by SPF.

## Config surface

The engine config (`EngineConfig`) carries only what its
behaviors read; there is no callback.

`HlsVideoMixin`'s constructor takes optional `config` and threads
it through to every engine instance (including the ones created on
each `set src`).

## Verification

- **Unit tests:**
  - `packages/spf/src/playback/adapters/hls-video/tests/mixin.test.ts` —
    extensive coverage: src assignment / re-assignment / clear,
    engine recreation on src change, mediaElement preservation across
    src changes, play retry on `loadstart`, preload propagation,
    attach/detach lifecycle
  - `packages/spf/src/playback/engines/hls/tests/engine.test.ts`
    → "allows patching state and owners from outside" — direct
    engine-level write surface (bypasses the mixin)
  - `packages/spf/src/core/composition/tests/define-external-signals.test.ts`
    — the `defineExternalSignals` factory itself
- **Downstream usage:**
  - `packages/spf/src/playback/adapters/hls-video/adapter.ts` —
    `HlsVideoAdapter` consumer
- **Walkthrough:**
  - `packages/spf/docs/hls-engine.md` Stage 10 — high-level coverage
    of the pattern

## Open questions

- **Destroy-recreate vs in-place source replacement.** Resolved: the
  canonical adapter now recycles a single engine and overwrites
  `state.presentation` in place on every `src` change, driving the same
  cascade validated by
  [`source-replacement`](./source-replacement.md)'s test. This unifies
  per-source teardown on one path and lets adapter-side projections
  wire once at construction rather than re-wiring on every src change.
  It also makes source-change behavior stable enough to build the
  media-tracks mixin integration on top of.
- **Callback timing semantics.** Resolved by removal: the
  `onSignalsReady` callback handed out the same signal objects
  `createComposition` returns, so adapters read the returned
  composition and no setup-time timing question remains.
- **Mixin base-class genericity.** `HlsVideoMixin<Base extends Constructor<any>>`
  accepts any base; today's only documented consumer is
  `HTMLVideoAdapter`. Other bases are structurally allowed but
  not exercised — if usage broadens, the contract may need
  tightening.

## Related features

- **preload-modes** — adapter `set preload(value)` and `play()` are
  external writers on `state.preload` and `state.loadActivated`
  respectively. The adapter's preload-clearing semantics (clear
  `#preload` but don't patch the current engine) interact with
  `preload-modes`'s sticky-extended-values rule.
- **source-replacement** — adapter `set src` is the canonical
  user-facing entry into source replacement. The adapter's
  destroy-recreate path bypasses the in-place reactor cascade — see
  [`source-replacement.md`](./source-replacement.md) for the in-place
  contract and the same open question.
- **mse-mms-pipeline** — adapter `attach(el)` binds the element MS
  attaches to. The engine handles the rest of the MS lifecycle via
  the resolved/unresolved cascade.
- **audio-playback** / **subtitles** / **video-abr** /
  **buffer-management** — all driven by engine state the adapter
  writes through. The adapter doesn't expose these features' surfaces
  directly; consumers read engine state via the captured signal refs.

## Use cases that compose this feature

- **[`audio-only-mode-override`](../use-cases/audio-only-mode-override.md)**
  *(partial — Phase 1 landed)* — Phase 1 baseline constituent with an
  alternative adapter shape. The variant ships an independent
  `HlsAudioAdapterCore` adapter (via
  `HlsAudioMixin`) parallel to `HlsVideoAdapterCore`;
  the mixin pattern composes unchanged. The
  consumer-facing API matches the WHATWG `HTMLMediaElement` surface.
- **[`video-only-mode-override`](../use-cases/video-only-mode-override.md)**
  *(coarse)* — Phase 1 baseline constituent on the inverse axis.
  Ships an independent `SimpleVideoOnlyHlsMediaElement`-style
  adapter parallel to `HlsVideoAdapterCore`. Same pattern; consumer-facing API differs from both default and
  audio-only-mode-override.

## See also

- [clusters.md § Engine lifecycle](./clusters.md#engine-lifecycle)
- [packages/spf/docs/hls-engine.md § Stage 10](../../../../packages/spf/docs/hls-engine.md)
  — the adapter pattern walkthrough
- [conventions/signals.md](../conventions/signals.md) — per-slot
  `Signal<T>` / `ReadonlySignal<T>` intent (relevant for how consumers
  type captured refs at the use site)
- `packages/spf/src/playback/adapters/hls-video/adapter.ts` — canonical
  downstream consumer
