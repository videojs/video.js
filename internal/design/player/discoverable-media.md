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

In HTML, mark the element with `data-vjs-media`. The player searches its own subtree for the marker, so it works with or without a skin or container.

```html
<acme-video data-vjs-media src="…"></acme-video>
```

The marker is a plain opt-in:

- **No false positives.** The player only attaches to elements you mark, so a wrapper like `<my-intro-video>` is never mistaken for media.
- **No existing meaning.** The `vjs` prefix is ours, so it doesn't collide with the platform, with media-chrome, or with a site's own `data-*` attributes.
- **No effect on rendering.** A `data-*` attribute doesn't move the element into a different slot or change its layout, so every skin works as is.
- **No extra machinery.** The search is one selector next to today's `video, audio` search. Skins don't change, and there's no capability check.

In React, pass the element to `useMediaAttach()` with a ref. The React player renders no DOM, so a search would have to borrow the container's, which [provider-attach](../../decisions/player/provider-attach.md) decoupled on purpose. A ref keeps each layer independent, and it's how `<Video>` already connects.

```tsx
const setMedia = useMediaAttach();

<acme-video ref={setMedia} src="…" />;
```

Self-registered media still wins, then the marked element, then a plain `<video>` or `<audio>`. If there are several marked elements, the first in document order wins.

If the media is a custom element that isn't defined yet, the player waits for `customElements.whenDefined()` before attaching. In React, that only applies when you pass a custom element like `<acme-video>` to the ref; our own React media components render native elements, not custom elements. Features check what the media supports once, when the store attaches. An element that isn't defined yet has no media properties, so every feature would skip setup and never retry. Once defined, the element must return real values from its media getters, as media-chrome-compatible elements already do.

## Potential problems

- **It's one more thing to remember.** Leave the marker off and nothing attaches, with no warning. media-chrome users must rewrite `slot="media"` as `data-vjs-media`.
- **Elements that break the contract fail quietly.** If a getter returns `undefined` when the store attaches, that feature stays off for the life of the attachment, and nothing reports why.
- **The marker or ref must land on the media element itself.** A wrapper `<div>` isn't media. React components must forward the ref, and HTML components must keep the attribute on their media element.
- **The player can attach to the wrong media briefly.** Until a marked custom element is defined, the player may use a plain `<video>` it finds, often that element's own child, then switch. Self-registered elements already behave this way.
- **A marked element that's never defined is never attached.** The player keeps whatever fallback it found, or no media at all, with no warning.
- **The search has the same limits as today's `<video>` and `<audio>` search.** It reaches into nested players and can't see inside shadow roots.

## Alternatives considered

Two of these are real contenders, each with its own prototype.

- **`slot="media"`** (branch `claude/discoverable-media-slot`). media-chrome users already write `<acme-video slot="media">`, so their markup moves over unchanged. It's as explicit as `data-vjs-media`, with no false positives. Our custom media elements also accept `slot="media"` children, but they register themselves and win, so the two meanings don't collide. [context-media-discovery](../../decisions/player/context-media-discovery.md) removed it because people forgot to add it, but any marker shares that risk. The cost is rendering: `slot` decides where a shadow-DOM child appears, and our video and audio skins only have a default slot. Every skin needs a named `media` slot, as the background skin already has, or a `slot="media"` child doesn't render.
- **Match `*-video` and `*-audio` tag names** (branch `claude/discoverable-media-suffix`). `<acme-video>` works with no configuration, the way plain `<video>` already does, and the whole media-elements family (`mux-video`, `youtube-video`, …) drops in. Our own suffixed elements register themselves and win. The cost is false positives: layout wrappers like `<my-intro-video>` match too, so the player needs a capability check after the element is defined. When the guess is wrong, there's no way to override it without adding a marker anyway.
- **`data-media`.** It's shorter, but generic enough that a site may already use it.
- **Search the DOM in React.** It only works when a container exists, so a player without a skin or container would never find its media.
- **Re-check support on every event**, like media-chrome's store. That changes every feature to handle a case only third-party elements hit. The element contract covers it.
