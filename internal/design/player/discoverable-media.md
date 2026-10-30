---
status: draft
date: 2026-10-02
---

# Discoverable media

## Problem

Our media elements register themselves with the player, and the HTML player finds plain `<video>` and `<audio>` on its own. A third-party media element does neither, so the player never connects to it.

```html
<video-player>
  <video-skin>
    <acme-video src="…"></acme-video>
    <!-- never attached -->
  </video-skin>
</video-player>
```

## Solution

In HTML, the player treats any descendant named `*-video` or `*-audio` as a media candidate. You write nothing extra:

```html
<acme-video src="…"></acme-video>
```

- **No configuration.** You place the element and it works, the same way plain `<video>` already does.
- **It matches the ecosystem.** The media-elements family (`mux-video`, `youtube-video-element`, `hls-video-element`, …) and most third-party media elements already use these suffixes, so their markup drops in unchanged.
- **Skins don't change.** The name isn't an attribute or a slot, so rendering and projection stay as they are.

The name is a guess, so the player checks it. Once a candidate is defined, the player attaches only if it passes `isMediaPauseCapable` (it has `paused`, `ended`, and `pause()`), the same predicate features use. A layout wrapper like `<my-intro-video>` fails the check and is skipped, and the search moves on to the next candidate, then to plain `<video>` and `<audio>`.

In React, pass the element to `useMediaAttach()` with a ref. The React player renders no DOM, so a search would have to borrow the container's, which [provider-attach](../../decisions/player/provider-attach.md) decoupled on purpose. A ref keeps each layer independent, and it's how `<Video>` already connects.

```tsx
const setMedia = useMediaAttach();

<acme-video ref={setMedia} src="…" />;
```

Self-registered media still wins, then the first suffix element that passes the check, then a plain `<video>` or `<audio>`. The suffix element outranks the native search because a plain `<video>` is often that element's own child. Our own suffixed elements (`hls-video`, `mux-video`, `background-video`, …) register themselves, so the guess never decides for them.

If a candidate is a custom element that isn't defined yet, the player skips it, waits for `customElements.whenDefined()`, then searches again. Features check what the media supports once, when the store attaches. An element that isn't defined yet has no media properties, so every feature would skip setup and never retry. Once defined, the element must return real values from its media getters, as media-chrome-compatible elements already do.

## Potential problems

- **False positives.** Any element ending in `-video` or `-audio` is a candidate. The capability check filters out wrappers, but a wrapper that forwards `paused`, `ended`, and `pause()` to an inner video passes and wins over that video.
- **No override when the guess is wrong.** You can't point the player at a different element or tell it to ignore one. The fix is to rename the element or add an explicit marker, which this approach doesn't have yet.
- **Undefined lookalikes cost a wait.** The player waits on every undefined suffix element, including wrappers that turn out not to be media. The wait is cheap and the player keeps its fallback meanwhile, but a never-defined element is never attached and never reported.
- **Elements that break the contract fail quietly.** If a getter returns `undefined` when the store attaches, that feature stays off for the life of the attachment. If `paused` is `undefined`, the element fails the check and isn't attached at all.
- **The player can attach to the wrong media briefly.** Until a suffix element is defined, the player may use a plain `<video>` it finds, often that element's own child, then switch. Self-registered elements already behave this way.
- **The search walks every descendant.** There's no CSS selector for a tag-name suffix, so each mutation walks the player's subtree with a `TreeWalker`. Skins are small, but it's more work than a single `querySelector`.
- **The search has the same limits as today's `<video>` and `<audio>` search.** It reaches into nested players and can't see inside shadow roots.

## Alternatives considered

Both explicit markers are real contenders, each with its own prototype. Either one could also be layered on later as an override for the suffix guess.

- **`data-vjs-media`** ([videojs/v10#3149](https://github.com/videojs/v10/pull/3149)). An explicit opt-in: the player attaches only to elements you mark, so there are no false positives and no capability check. The `vjs` prefix is ours, so it doesn't collide with anything, and a `data-*` attribute doesn't affect rendering, so skins don't change. The search is one selector. The cost is one more thing to remember: leave it off and nothing attaches, and media-chrome users must rewrite `slot="media"`.
- **`slot="media"`** ([videojs/v10#3152](https://github.com/videojs/v10/pull/3152)). media-chrome users already write `<acme-video slot="media">`, so their markup moves over unchanged. It's as explicit as `data-vjs-media`, with no false positives. The cost is rendering: `slot` decides where a shadow-DOM child appears, and our video and audio skins only have a default slot, so every skin needs a named `media` slot, as the background skin already has. [context-media-discovery](../../decisions/player/context-media-discovery.md) removed it once because people forgot to add it, a risk any marker shares.
- **Match `*-player` too.** Players aren't media, and the name collides with our own `<video-player>`.
- **Search the DOM in React.** It only works when a container exists, so a player without a skin or container would never find its media.
- **Re-check support on every event**, like media-chrome's store. That changes every feature to handle a case only third-party elements hit. The element contract covers it.
