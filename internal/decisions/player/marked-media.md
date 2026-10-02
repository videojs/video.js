---
status: decided
date: 2026-10-02
---

# Marked media

## Decision

The HTML player attaches to a descendant marked with `data-vjs-media`. In React, you pass the element to `useMediaAttach()` with a ref. Both players wait for a custom element to be defined before they attach to it.

Self-registered media still wins, then the marked element, then a plain `<video>` or `<audio>`.

## Why

Our media elements register themselves with the player, and the HTML player finds plain `<video>` and `<audio>` on its own. A third-party media element does neither, so the player never connects to it.

The HTML player is a real element, so it can search its own subtree. That works with or without a skin or container. The React player renders no DOM, so a search would have to borrow the container's, which [provider-attach](provider-attach.md) decoupled on purpose. A ref keeps each layer independent, and it's how `<Video>` already connects.

Features check what the media supports once, when the store attaches. A custom element that isn't defined yet has no media properties, so every feature would skip setup and never retry. Waiting for `customElements.whenDefined()` fixes that. Once defined, the element must return real values from its media getters, as media-chrome-compatible elements already do.

## Alternatives considered

- **Match tag names** like `*-video` or `*-player`. These match wrappers, nested players, and elements whose media lives inside them. The old container did this, and we removed it.
- **`slot="media"`.** Inside our custom media elements, it already means "replace my inner element." It isn't a real slot in our layout, and [context-media-discovery](context-media-discovery.md) removed it because people forgot to add it.
- **`data-media`.** It's generic enough that a site may already use it.
- **Re-check support on every event**, like media-chrome's store. That changes every feature to handle a case only third-party elements hit. The element contract covers it.
