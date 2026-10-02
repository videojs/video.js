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

In HTML, give the element `slot="media"`. The player searches its own subtree for it, so it works with or without a skin or container.

```html
<acme-video slot="media" src="…"></acme-video>
```

This is the markup media-chrome users already write. A `<media-controller>` with `<some-video slot="media">` moves into `<video-player>` without touching the media element. It's explicit, so it never guesses wrong, and it's a word people already associate with media.

Every skin now has a named `media` slot next to its default slot, so a `slot="media"` child renders in the same place as unmarked media. The default slot stays, so plain `<video>` and our own media elements still need nothing. Outside a skin, `slot` has no effect on rendering and acts as a plain marker. In React, `<Slot name="media" />` renders nothing, since React skins have no shadow root.

This partly reverses [context-media-discovery](../../decisions/player/context-media-discovery.md). That record dropped `<slot name="media">` because forgetting `slot="media"` silently broke every player. Here, `slot="media"` is optional: you add it only for media that can't register itself, which today attaches to nothing at all.

In React, pass the element to `useMediaAttach()` with a ref. The React player renders no DOM, so a search would have to borrow the container's, which [provider-attach](../../decisions/player/provider-attach.md) decoupled on purpose. A ref keeps each layer independent, and it's how `<Video>` already connects.

```tsx
const setMedia = useMediaAttach();

<acme-video ref={setMedia} src="…" />;
```

Self-registered media still wins, then the `slot="media"` element, then a plain `<video>` or `<audio>`. If there are several, the first in document order wins.

If the media is a custom element that isn't defined yet, the player waits for `customElements.whenDefined()` before attaching. Features check what the media supports once, when the store attaches. An element that isn't defined yet has no media properties, so every feature would skip setup and never retry. Once defined, the element must return real values from its media getters, as media-chrome-compatible elements already do.

## Potential problems

- **`slot` already means something inside our media elements.** `<hls-video><video slot="media"></video></hls-video>` replaces the element's inner video. The search finds that inner video, but our elements register themselves and outrank it, so the player still attaches to `<hls-video>`.
- **`slot` controls rendering.** Every skin, including skins you eject or write yourself, needs a named `media` slot, or a `slot="media"` child disappears. Ejected HTML skins live in the light DOM and aren't affected.
- **The attribute must land on the media element itself.** `<div slot="media">` around a `<video>` renders, but the player attaches to the `<div>`, which isn't media.
- **Elements that break the contract fail quietly.** If a getter returns `undefined` when the store attaches, that feature stays off for the life of the attachment, and nothing reports why.
- **The player can attach to the wrong media briefly.** Until a `slot="media"` custom element is defined, the player may use a plain `<video>` it finds, often that element's own child, then switch.
- **An element that's never defined is never attached.** The player keeps whatever fallback it found, or no media at all, with no warning.
- **The search has the same limits as today's `<video>` and `<audio>` search.** It reaches into nested players and can't see inside shadow roots.

## Alternatives considered

Each of these is a working prototype, and each is a reasonable choice.

- **`data-vjs-media`** ([#3149](https://github.com/videojs/v10/pull/3149)). An attribute with no existing meaning: it never affects rendering, never collides with our media elements' inner slot, and needs no skin change. The cost is one more name to learn, and media-chrome markup has to change from `slot="media"`.
- **Match `*-video` and `*-audio` tag names** (branch `claude/discoverable-media-suffix`). Zero configuration, like plain `<video>`, and the media-chrome element family already uses these names. The cost is false positives, such as a `<my-intro-video>` layout wrapper, so it needs a capability check after definition, and there's no way to override a wrong guess without adding a marker anyway.
- **Search the DOM in React.** It only works when a container exists, so a player without a skin or container would never find its media.
- **Re-check support on every event**, like media-chrome's store. That changes every feature to handle a case only third-party elements hit. The element contract covers it.
