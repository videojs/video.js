---
status: draft
date: 2026-05-29
---

# React Native player — decisions

Debated decisions for the [React Native player design](index.md).

## Media adapter implements the Media contract, not a fake HTMLMediaElement

**Decision:** The RN media adapter wraps the native player ref and satisfies
the DOM-free `Media` contract from [`media.md`](../media.md) — the capability
interfaces plus `EventLike` / `EventTargetLike` — rather than impersonating
`HTMLMediaElement`.

**Context:** The store is generic over its `Target`, so the RN `media` target
can be any shape. The contract is already built and adopted at the store
boundary: [`core/media/types.ts`](../../../packages/core/src/core/media/types.ts)
defines `EventLike` / `EventTargetLike` and the capability interfaces,
[`dom/media/predicate.ts`](../../../packages/core/src/dom/media/predicate.ts)
provides the guards, and `PlayerTarget.media` is typed as `Media` (not
`HTMLMediaElement`), so features already narrow via predicates. The only
remaining pressure toward an HTML-like shape is a few residual DOM-global leaks
in the shared features.

**Alternatives:**

- **Adapt the target to the features** — wrap the native ref so it quacks like
  a full `HTMLMediaElement`. Maximum reuse of *today's* feature code, but pays
  a translation tax on properties with no clean native analog (`readyState`'s
  5-level integer, `play()` Promise semantics) and pretends the features depend
  on all of `HTMLMediaElement` when they touch a small subset.
- **Adapt the features to the target** — RN-flavored feature variants talking
  to a native-shaped target idiomatically. Cleanest RN code, but duplicates
  feature logic across web and RN; every new feature is authored twice.
- **Implement the `Media` contract (chosen)** — the contract already captures
  exactly the subset features use, and [`media.md`](../media.md) explicitly
  names React Native as a motivating case for decoupling it from the DOM. The
  web's `HTMLMediaElement` satisfies the contract natively; RN satisfies it via
  the adapter; features generalize over the contract.

**Rationale:** The contract is the seam the codebase already adopts at the
target boundary, so this is a commitment grounded in shipped code, not a bet on
future refactoring. Building the RN host against it (rather than a fake element)
shrinks the "looks like media" surface from all of `HTMLMediaElement` to the
handful of capabilities features actually consume, and avoids duplicating
feature logic. The remaining work is bounded and enumerated — close the residual
DOM-global leaks in the shared features (export `MediaReadyState` and swap the
`HTMLMediaElement.HAVE_*` references in `playback.ts` / `source.ts`; RN variants
for `volume` / `text-track` / `controls`), not fake an element. Residual risk:
`media.md` is `status: draft`, so the contract surface could still shift — a thin
HTML-shaped adapter remains a fallback for individual adapter-shared features if
a specific one can't yet run on the contract, but the committed direction is the
contract.

## Two providers over a shared core for background playback

**Decision:** Background playback is a **separate provider component**
(`<BackgroundablePlayer.Provider>`), not a `backgroundPlayback` boolean on
`<Player.Provider>`. The two providers are thin wrappers over one shared core
hook. They differ on two axes: (1) *what the store is* — the background store
composes the shared base feature array plus background features
(`backgroundPlaybackFeature`, `nowPlayingFeature`) via `combine`; (2) *how the
component manages the store* — the regular provider creates a component-scoped
store, the background provider binds the singleton persistent session store.
The platform integration (AppState, audio focus, MediaSession/now-playing)
lives in `backgroundPlaybackFeature.attach()`.

**Context:** Background playback should be opt-in, and the player must not be
forced into system integration it doesn't need. The earlier model put a boolean
on the one provider, with a feature toggled by the prop. But background
playback is also the [single persistent session](index.md#persistent-background-session),
which already requires different store ownership (external/persistent),
cardinality (one), and lifetime (survives unmount). So the "boolean" was
flipping the whole contract, not just behavior.

**Alternatives:**

- **`backgroundPlayback` boolean on `<Player.Provider>`** (earlier decision) —
  one component, most familiar at the call site. Rejected: the flag changes the
  contract on four axes at once (lifetime, cardinality, store ownership, system
  integration) — a "flag that changes the type." BG-only props would ride a
  provider where they're mostly meaningless, and N providers with the flag
  invite "what if two are `true`?" ambiguity against a singleton session.
- **Flag on `<Video>`** — background playback is a property of the player, not
  the media element; breaks the layer partition.
- **Distinguish by a `store` prop on one provider** (`<Player.Provider store={backgroundSession.store}>`)
  — keeps a single component (max web parity) and makes the real differentiator
  (external vs. created store) explicit, but BG-only props still ride the
  generic provider, so no honest typing. A reasonable lighter fallback.
- **Two providers over a shared core (chosen).**

**Rationale:** The four-axis contract difference makes two types more honest
than a boolean, and the [feature API already builds the shared base](index.md#two-providers-over-a-shared-core)
(base feature array + `combine`, exactly as `presets.ts` derives
`liveVideoFeatures` from `videoFeatures`), so the cost is contained: the shared
core owns lifecycle/context/store-ownership, the feature arrays own state +
behavior + platform integration. It *protects* web parity of the common
`<Player.Provider>` (kept 1:1 with `@videojs/react`) by quarantining the
platform-only background surface in a separate, clearly-RN component. Because the
background store is `combine(base + bg)`, base selectors type-check against both
providers (shared UI works on both) while BG-only state is reachable only where
BG features are composed — honest typing, enforced structurally. Background
features stay additive (`combine` is last-wins) so the base remains a true shared
subset. `backgroundPlaybackFeature` emits the `{ enabled, hasAudioFocus }` slot
reflecting the platform's single-owner grant. Build both providers over one core
so they don't drift and the `PlayerContext` shape stays uniform for UI
components.

## Multiple player instances; platform-native background, no custom coordinator

**Decision:** Support N independent native player instances (one per
`<Player.Provider>`). Foreground players carry no system integration. Background
playback integrates with each platform's own mechanism — Android Media3
`MediaSessionService` / `MediaSession`; iOS `AVAudioSession` +
`MPNowPlayingInfoCenter` / `MPRemoteCommandCenter` — used for background-enabled
players only. The single-owner constraint on the one-per-app system surfaces is
a policy each platform enforces natively, not a custom cross-platform
coordinator.

**Context:** The OS exposes the media-controls / "now playing" surface as
effectively one slot per app (iOS `MPNowPlayingInfoCenter` /
`MPRemoteCommandCenter` are process singletons; Android background playback is
built on `MediaSessionService`). The product requires multiple simultaneous
players (feeds, grids, ambient + foreground), but only background-enabled
players ever touch those one-per-app surfaces — foreground players need no
coordination.

**Alternatives:**

- **Single global native player, RN components bind one at a time** — simplest
  at the system layer, but: (1) can't render two surfaces at once, ruling out
  feeds/grids/preload; (2) every bind-switch reloads source and re-points
  layer + observers — the same reattach cascade the
  [AVQueuePlayer decision](#ios-looping-uses-an-always-present-avqueueplayer)
  avoids, now paid on every scroll; (3) breaks web parity — a developer who
  mounts two providers expects two players, matching `@videojs/react`.
- **N players + a custom app-global coordinator** — a singleton that grants
  now-playing / audio-focus / background ownership to one player. Rejected:
  unnecessary complexity, and it duplicates or fights Android's
  `MediaSessionService`, which already *is* the session/notification/foreground-
  service owner. It also forces coordination onto foreground players that never
  need it.
- **N independent players; platform-native background, single-owner policy
  (chosen).**

**Rationale:** The one-per-app constraint is real but applies *only* to
background-enabled players, and each platform already provides the mechanism
that owns it (Android `MediaSessionService`; iOS audio-session + now-playing
singletons). A custom coordinator would re-implement what the platform gives
for free and clash with the intended Android architecture. So foreground
players stay independent and free (web parity, feeds, preload), background is
platform-idiomatic and entered only on opt-in, and "at most one background
owner" is enforced by the platform (a second player displaces the first) rather
than by a bespoke component. The only shared surface is the JS contract: the
`backgroundPlayback` feature requests background ownership and its
`{ enabled, hasAudioFocus }` slot reflects whether this player holds it.

## Single persistent background session via an externally-owned store

**Decision:** The background-enabled player is a single persistent session —
one app-owned engine + store that outlives any screen, with many clients
(now-playing screen, mini-bar, an imperative `backgroundSession` JS API) all
reading/writing the *same* store. Surfaces attach to the engine and detach
without stopping playback. Exactly one such session is supported.

**Context:** A YouTube-style pattern needs playback controllable from outside
the screen where it normally renders — a now-playing screen plus a feed mini-bar
plus arbitrary JS — with audio continuing in background. That requires a player
lifetime not tied to any one component, accessible from both Fabric views and a
TurboModule.

**Alternatives:**

- **Per-component player only** (the default model) — playback dies on the
  owning screen's unmount, so it can't persist across navigation or be shown in
  a mini-bar. Insufficient for the now-playing pattern.
- **Imperative API as a separate path to native** — a TurboModule façade that
  commands the engine directly, parallel to the store. Rejected: two sources of
  truth, so imperative callers and reactive components can desync.
- **N persistent sessions** — arbitrary background sessions. Rejected for v1:
  large jump in surface and lifetime management, and it conflicts with the
  single-background-owner reality (one now-playing). One is expected to remain
  adequate.
- **Single persistent session, externally-owned store, imperative API over the
  store (chosen).**

**Rationale:** The store already separates `attach`/`detach` from
create/destroy and the provider already separates *disconnect* (keep state)
from *destroy* (release), so "a provider binds to an externally-owned store"
is a small, existing-grain capability — not a second architecture. Modeling the
session as one shared store gives free cross-surface sync and one source of
truth (the imperative API is a thin façade over the store, not a bridge path).
Splitting engine from surface (native on both platforms) lets the surface move
between screens while the engine runs in the service; the glitch-prone surface
re-point is then bounded to navigation and handled by the provider's existing
media-registration (`setMedia` / `setContainer`) flow. It's also the RN
expression of bring-your-own/hoisted store, which the web shares — preserving
parity. Single session keeps the imperative singleton unambiguous and matches
the platform's one-owner reality.

## iOS looping uses an always-present AVQueuePlayer

**Decision:** The iOS native module always allocates `AVQueuePlayer` (an
`AVPlayer` subclass), regardless of whether `loop` is enabled. Looping toggles
by attaching/detaching an `AVPlayerLooper` at runtime — never by reallocating
the player.

**Context:** HTML looping is a `<video loop>` attribute; Android has a simple
repeat flag. iOS has no loop flag — clean looping requires `AVPlayerLooper`,
which requires an `AVQueuePlayer`. The choice was "always allocate the
queue-capable subclass" vs. "allocate it only when looping is enabled."

**Alternatives:**

- **Allocate `AVQueuePlayer` only when looping** — minimal for the non-looping
  case, but toggling loop mid-session changes player identity. The cost isn't
  the allocation (cheap) — it's re-pointing everything attached to the player:
  `AVPlayerLayer.player`, all KVO observers (mismatched add/remove is a crash
  source), periodic/boundary time observers, the current `AVPlayerItem` plus a
  re-seek to preserve position, and audio-session/now-playing wiring. Two code
  paths plus a hard-to-test transition that only fires on a runtime toggle.
- **Always `AVQueuePlayer` (chosen)** — `AVQueuePlayer` subclasses `AVPlayer`,
  so this is one type choice at allocation, not a parallel object. A single-item
  queue behaves like `AVPlayer`; memory/perf cost is noise.

**Rationale:** The real trade is "near-zero overhead always" vs. "a
reattach-everything cascade at an unpredictable moment on an
under-tested path." The asymmetry is decisive. It also preserves the v10
contract that `loop` is a cheap runtime-togglable property (matching HTML)
without leaking a "reconstruct the player to enable looping" wart up into the
feature or component API.

**To verify during implementation:** attaching/detaching `AVPlayerLooper` to a
live `AVQueuePlayer` mid-playback re-templates the queue from the current item.
Confirm this causes no audible/visible hitch; if it does, debounce or document
that toggling `loop` mid-play may cause a brief discontinuity.
