# React Native — persistent background session

**Status:** STUB — not started

Implementation plan for the persistent background session described in
[`internal/design/react-native/index.md` § Persistent background session](../../../internal/design/react-native/index.md).
This file is the **how**; the design doc owns the **what/why** and the decisions
(see [`decisions.md`](../../../internal/design/react-native/decisions.md)).

Prerequisite: the `packages/react-native/` package, `Media` adapter, and RN
provider don't exist yet. This plan assumes those are in place (or scoped
alongside).

## Scope

One persistent playback session: one app-owned engine + store, many clients
(now-playing screen, mini-bar, imperative `backgroundSession` JS API), surface
detachable without stopping playback. Exactly one session.

## Open implementation tasks

### 1. Persistent store ownership

- [ ] Session module that creates the store once and holds it (outside the
      component tree). Lifecycle: created on first use / explicit init,
      destroyed explicitly — never on component unmount.
- [ ] Provider accepts an externally-owned store (bind) vs. creating its own
      (default). Confirm the web provider's `#store` / `get store()` / factory
      shape (`packages/html/src/store/provider-mixin.ts`) generalizes; mirror in
      the RN provider.

### 2. Engine vs. surface split

- [ ] Engine lives in the platform background host (Android Media3
      `MediaSessionService` / `MediaSession`; iOS `AVAudioSession` +
      `MPNowPlayingInfoCenter` / `MPRemoteCommandCenter`), independent of any view.
- [ ] Fabric video view is an attachable surface keyed to the session engine;
      supports N views and zero views (audio-only background).
- [ ] Surface attach/detach: iOS `AVPlayerLayer` re-point; Android
      `ExoPlayer.setVideoSurface(...)`. Must be glitch-free across navigation.

### 3. Surface hand-off — LIFO registry

- [ ] Session owns a **surface registry (LIFO stack)**: surfaces register on
      mount (via the existing `setMedia` / `setContainer` flow), pop on unmount.
- [ ] Engine renders into the **top** surface only (single-holder: Android
      `setVideoSurface`; iOS `AVPlayerLayer` re-point). Lower surfaces show
      poster/blank.
- [ ] Pop falls back to the next still-registered surface (now-playing pops →
      mini-bar resumes output, no re-registration). Popping must NOT stop
      playback — verify the disconnect-vs-destroy distinction holds for an
      external store.
- [ ] Push/pop swap must be glitch-free (no black frame / audio hitch).
- [ ] **Tentative LIFO** — fallback alternative is a flat latest-pointer
      (blanks on top unmount until re-register). Revisit if the stack is awkward.

### 4. Imperative API + control binding over the store

- [ ] `backgroundSession` JS facade: `play()`, `pause()`, `seek(t)`, `state`,
      `subscribe(cb)` — all delegating to the persistent store's actions /
      selectors / `subscribe`. NOT a separate path to native.
- [ ] `useBackgroundSession()` hook resolves the session store from **anywhere**
      (non-descendant controls, e.g. a sidebar); descendants use React context.
      Both resolve the same store — all controls bind and dispatch; no contention.
- [ ] Importable from non-React JS; stays in lockstep with mounted components
      because it shares the store.

### 5. TurboModule + Fabric wiring

- [ ] TurboModule: engine command transport (down) + event transport (up) that
      the `Media` adapter uses. Keep high-frequency state (timeupdate) on the JS
      side via the store; don't thrash the bridge.
- [ ] Fabric component: the video surface view; binds to the session engine.

## Verification

- [ ] Audio continues when the app is backgrounded (both platforms).
- [ ] Now-playing screen → mini-bar navigation: playback uninterrupted, surface
      moves cleanly.
- [ ] Imperative `backgroundSession.play()` reflects in a mounted `<MiniBar/>`
      with no manual sync.
- [ ] Lock-screen / Control Center / media-notification controls drive the
      session.

## Notes

- Single-owner background is enforced by the platform (service hosting one
  session; iOS now-playing singletons), not a custom coordinator — see the
  design decision.
- Surface re-point is the one delicate native step; it's bounded to navigation,
  not per-scroll.
