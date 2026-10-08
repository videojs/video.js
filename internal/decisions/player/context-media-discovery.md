---
status: decided
date: 2026-03-17
---

# Context-Based Media Discovery

## Decision

Media components are discovered via context, not named slots. Skins use a default `<slot>` instead of `<slot name="media">`. Users no longer need `slot="media"` on their `<video>` or `<audio>` elements.

The provider's `mediaAttachContext` is the primary discovery mechanism. Custom elements that consume context register themselves directly. Plain `<video>`/`<audio>` elements that can't consume context are found via the provider's fallback `querySelector('video, audio')`.

The `<slot name="media">` inside `CustomMediaElement` is a separate concern — it's for overriding the internal native element and stays unchanged.

## Context

Skins previously used `<slot name="media">` inside `<media-container>` for two purposes:

1. **DOM projection** — visually placing the media component inside the container's layout.
2. **Media discovery** — the container's `slotchange` listener and `MutationObserver` watched the slot to detect when a media component appeared.

With [provider-attach](provider-attach.md), the provider now owns media discovery and `store.attach()`. The container no longer watches for media components. Discovery purpose (2) is gone. Only DOM projection (1) remains — and a default slot serves that purpose without requiring users to mark their elements with `slot="media"`.

The named slot created user-facing friction:

- Forgetting `slot="media"` meant the player silently didn't attach — no error, just a broken player.
- The slot pattern confused users who expected shadow DOM semantics under the hood.
- Frameworks that hijack slot assignment could conflict with the sentinel usage.
- React already used context-based registration, making the HTML behavior inconsistent.

## Alternatives Considered

- **Keep named slots alongside context** — Skins keep `<slot name="media">`, users keep writing `slot="media"`. Rejected because the named slot no longer serves a discovery purpose and creates unnecessary friction.

- **Remove all slots from skins** — Skins render media via a different mechanism (e.g., `<template>` insertion). Rejected because default slots still provide clean DOM projection without any user-facing attributes.

## Rationale

**One less thing to remember.** Users drop a `<video>` inside a skin and it works. No attribute ceremony.

**Consistent with React.** React uses `<Video>` with a callback ref — no slot concept. HTML now matches: elements register via context, the provider discovers them.

**Default slot is invisible.** A `<slot>` (default) projects all light DOM children. The media component, controls, and other children all project naturally. No named targeting needed.

**Fallback covers plain elements.** The provider's `querySelector('video, audio')` microtask fallback handles native elements that can't consume context. This path is simple and predictable.

## Previous Behavior

Skins defined `<slot name="media"></slot>` inside `<media-container>`. Users wrote:

```html
<video-player>
  <video-skin>
    <video slot="media" src="video.mp4"></video>
  </video-skin>
</video-player>
```

The container discovered media via `querySelector`, `MutationObserver`, duck-type checks (`localName.endsWith('-video')`), and `slotchange` listeners. Forgetting `slot="media"` meant the video rendered but never attached to the store.
