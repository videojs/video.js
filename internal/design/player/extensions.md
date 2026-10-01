---
status: draft
date: 2026-09-21
---

# Player extensions

Google Cast and Mux Data are player-level concerns: a cast session outlives any one media, and a Mux Data view session spans every video one player plays. Before #2880 both were written to a media-level `MediaExtension` contract registered on `HTMLMediaAdapter`, so a plain `<video>` was silently ignored and casting worked only because `<google-cast>` happened to register before the store attached. This record lays out the architecture #2880 implements so it can be discussed before it is treated as settled.

## Problem

```html
<video-player>
  <video src="https://example.com/video.mp4"></video>
  <google-cast></google-cast> <!-- did nothing: no adapter to register with -->
</video-player>
```

The `MediaExtension` registry lived in `@videojs/media/dom`, keyed by adapter. `HTMLMediaAdapter` resolved every getter through `getMediaOwner()`, which scanned extension `targetOverride`s before its own protected `target`. Ownership, ordering, and interception were all decided one level below the thing they were about.

## Decisions

### 1. Extensions register with the player

Markup and JSX do not change. What changes is who the element or component talks to: the player, through context, instead of an adapter it has to find.

```html
<video-player>
  <video src="https://example.com/video.mp4"></video>
  <google-cast receiver="APP_ID"></google-cast>
  <mux-data env-key="KEY"></mux-data>
</video-player>
```

```tsx
<Player>
  <Video src="https://example.com/video.mp4" />
  <GoogleCast receiver="APP_ID" />
  <MuxData envKey="KEY" />
</Player>
```

The contract moves to `@videojs/core/dom` and receives the player's resolved target, never an adapter:

```ts
interface PlayerExtension {
  /** Read on every access; may change while attached (e.g. only while a cast session is connected). */
  readonly mediaOverride?: Partial<Video> | null;
  connect?(player: ExtensionPlayer): void; // once, on register: { initTime }
  disconnect?(): void; // on release
  attach?(target: PlayerTarget): void; // every media change: { media, container }
  detach?(): void;
  destroy?(): void;
}
```

The owner (element or hook) creates and destroys the instance. The player connects it when it registers and disconnects it when it is released; in between, the player attaches and detaches it alongside the store and moves it when the media changes, and a container-only change leaves it attached. `PlayerExtensionCoordinator` holds one instance per class and is created with the player, so its creation time is the player's `initTime`; it outlives any store the player replaces, which is why `initTime` is not store state.

`ExtensionPlayer` is the player as an extension sees it: facts about the player that hold across media changes, so they never ride on `attach`. It grows as extensions need more of the player: the store (for the resolved title and poster Cast and Mux Data don't send yet), a player ID, or command observation.

The authoring contract is internal at 10.0 (`@internal`, and not re-exported from `@videojs/react`): it is the part most likely to change as observers and owners split and Cast becomes real media.

### 2. The player owns attach order

Store features capture members such as `media.remote` once, at attach time. The player therefore attaches extensions before the store, and re-attaches the store when an extension that declares `mediaOverride` is registered or released, so a late `<google-cast>` takes effect instead of silently never working. An extension without `mediaOverride` is an observer: registering one (Mux Data, including a late CDN script or consent-gated mount) never re-attaches the store.

```ts
// packages/html/src/player/element.ts, packages/react/src/player/create-player.tsx
#attach(target: PlayerTarget) {
  this.#detach?.();
  this.#extensions.attach(target);
  this.#detach = store.attach({ media: this.#extensions.getStoreMedia(target.media), container: target.container });
}

#extensions = new PlayerExtensionCoordinator(() => this.#attach(this.#attached)); // on overriding register / release
```

Cost: a re-attach resets non-`preserve` store state, the same as a media swap. Only an overriding extension (today, Google Cast) added or removed dynamically pays it.

### 3. The player intercepts media reads through a facade

`getStoreMedia()` returns the registered media itself unless an extension that declares `mediaOverride` is registered, otherwise a `Proxy` that consults each extension's `mediaOverride` first (first defined member wins) and falls through to the media. One facade is cached per media, so `store.target.media` is stable across re-attaches. Getters run and methods bind against the owner, so DOM accessors and `#private` members keep working; `instanceof`, `in`, `matches(':fullscreen')`, `shadowRoot`, and event dispatch still resolve to the real element.

Identity does not: the facade is never `===` the element. The facade answers the internal `REGISTERED_MEDIA` key (`Symbol.for`, so duplicate package copies agree) with the registered media, and `getRegisteredMedia()` in `@videojs/media` reads it. Identity checks (controls tap-to-hide, `document.fullscreenElement`, `document.pictureInPictureElement`) and `getMediaElement()` / `getMediaAdapter()` compare against or start from the registered media. This is a stopgap until Cast becomes real media and the facade goes away.

```ts
// Google Cast, simplified: the whole provider while connected, only `remote` otherwise so the cast button can prompt.
get mediaOverride() {
  return this.#connected ? this.#provider : { get remote() { return provider.remote; } };
}
```

`internal/design/media/architecture.md` rejects Proxy machinery for custom media implementations. This facade is player-internal plumbing over a media the player already resolved; a hand-written class would break Element semantics for a plain `<video>`. Whether that distinction holds is one of the open questions below.

### 4. `HTMLMediaAdapter` is a pure host

No registry, no override routing: every member forwards to the target. Extensions reach the adapter or native element behind any media through two internal helpers instead of protected access:

```ts
import { getMediaAdapter, getMediaElement } from '@videojs/media/dom';

getMediaElement(media); // HTMLMediaElement | null — the <video> a custom element or adapter fronts
getMediaAdapter(media); // HTMLMediaAdapter | null — for `engine` and adapter-level `src`
```

### 5. Media swaps have one owner

The player's attach lifecycle drives both extensions; each decides what a swap means for its own session.

- **Google Cast:** attaches to any media, embeds included: a receiver can't play a YouTube or Vimeo page, but it can play an explicit `src` set on the extension. An embed never falls back to its own `src`, so without an explicit one nothing is loaded on the receiver. The provider and session persist; the override stays the provider. On every `loadstart` the provider re-binds to the native element behind the media (an adapter can swap it), and a source the receiver does not have loads there. The cast source is the media's `src`, else `currentSrc`, else its first `<source>`. The provider claims the source before awaiting anything so one local load reaches the receiver once, and releases the claim on failure. Adapter-backed media now also loads locally (paused) rather than short-circuiting the engine rebuild.
- **Mux Data:** one `view_session_id` per instance; `player_init_time` is the player's creation time unless set explicitly. A container change never touches the monitor. Same element, new `src` is a `videochange` on the live monitor; same element, new `engine` swaps the hls.js / dash.js hook; a different native element destroys the monitor and starts one on the new element, because `mux-embed` binds a monitor to an element.

## Public API changes

| Before (`@videojs/media/dom`) | After |
| --- | --- |
| `MediaExtension` with `targetOverride`, `setAdapter(adapter)`, `attach(target)` | `PlayerExtension` with `mediaOverride`, `attach({ media, container })` in `@videojs/core/dom` |
| `addMediaExtension`, `getMediaExtensions`, `getMediaProp`, `setMediaProp`, `getMediaOwner` | removed; `PlayerExtensionCoordinator` (`register`, `attach`, `detach`, `getStoreMedia`, `get`) |
| — | `getMediaAdapter(media)`, `getMediaElement(media)` (internal) |
| `MediaExtensionElement` / `createComponent()` / `this.component` (`@videojs/html`) | `PlayerExtensionElement` / `createExtension()` / `this.extension` (not exported) |
| `useMediaExtension` (`@videojs/react`) | removed from the public entry; `usePlayerExtension`, optional `registerExtension` on the player context, and `useExtensionRegistrar()` are internal |

Everything in the right column other than the removals is `@internal`; markup, JSX, and extension props are the public surface.

`@videojs/google-cast` and `@videojs/mux-data` gain a dependency on `@videojs/core`.

## Open questions

- Is a Proxy facade acceptable given `media/architecture.md`, or should the store instead expose an explicit override hook that features read through?

- `mediaOverride` resolution is first-registered-wins. Is that sufficient, or do extensions need explicit priority?
- Re-attaching the store on register/release resets transient state. Is that acceptable, or should the store support swapping its media without a full detach?
- Should `PlayerExtension` live in `@videojs/core/dom`, or in a smaller package so extension packages do not depend on the whole player core?

## Sources

- Contract, coordinator, facade: [`packages/core/src/dom/extensions/`](../../../packages/core/src/dom/extensions/)
- Player wiring: [`packages/html/src/player/element.ts`](../../../packages/html/src/player/element.ts), [`packages/react/src/player/create-player.tsx`](../../../packages/react/src/player/create-player.tsx)
- Extensions: [`packages/extensions/google-cast/src/extension.ts`](../../../packages/extensions/google-cast/src/extension.ts), [`packages/extensions/mux-data/src/extension.ts`](../../../packages/extensions/mux-data/src/extension.ts)
- Plain `<video>` coverage: the `extensions` cases in [`create-player.test.ts`](../../../packages/html/src/player/tests/create-player.test.ts) and [`create-player.test.tsx`](../../../packages/react/src/player/tests/create-player.test.tsx)
- Related: [`provider-attach`](../../decisions/player/provider-attach.md) (the player owns `store.attach()`), #2872, #2873, #1863
