---
status: decided
date: 2026-03-13
---

# Provider Owns Media Attachment

## Decision

The provider (`<video-player>` / React `Provider`) owns the `store.attach()` lifecycle. The container (`<media-container>` / React `Container`) no longer discovers media or calls `store.attach()` — it registers itself with the provider via context and serves only as a layout reference element.

Media and container elements register themselves with the provider through attach contexts. Each registration returns an identity-specific release callback, so an older element cannot clear a newer registration when it disconnects. The provider calls `store.attach({ media, container })` when both are available. Plain `<video>` and `<audio>` descendants are tracked with a `MutationObserver` because they cannot consume context.

## Context

The [player-container separation](player-container-separation.md) decision established that the provider owns state and the container handles layout. But the container still owned a critical piece of the store lifecycle: media discovery and `store.attach()`.

The container discovered media via `querySelector('video, audio')`, duck-type checks for media components, `MutationObserver` watching the subtree, and `slotchange` listeners on `<slot name="media">`. When it found media, it called `store.attach({ media, container: this })` and managed the detach lifecycle.

This split created friction:

- The provider creates the store and destroys it, but a descendant controls when state flows through it. The lifecycle is split across two elements.
- Setups without a container (audio-only, headless, programmatic) couldn't attach — they needed the container present just to wire up the store.
- The container's media discovery logic (MutationObserver, slot queries, duck-typing) was brittle and required users to remember `slot="media"`.

## Alternatives Considered

- **Keep attach in the container** — Leave the current architecture. Rejected because it perpetuates the split lifecycle and forces container presence for attachment.

- **Move all discovery to provider DOM queries** — The provider watches its subtree for every kind of media component. Rejected as the primary mechanism because custom media can be nested across component boundaries, making reliable DOM queries fragile. DOM observation is used only for plain `<video>`/`<audio>`.

- **Event-based registration** — Media components dispatch a bubbling event that the provider catches. Simpler than context but doesn't handle disconnection cleanly and requires the provider to be in the DOM path (shadow DOM boundaries block event bubbling unless composed).

## Rationale

**Unified lifecycle.** The provider already creates and destroys the store. Adding attach/detach means one element controls the full store lifecycle: create → attach → detach → destroy. No split ownership.

**Container becomes truly dumb.** The container is a reference element — the store uses it for fullscreen, PiP, keyboard focus, and gesture tracking. It doesn't need to know about media discovery or store internals. It registers itself with the provider and renders children.

**No-container setups work.** Audio-only players, headless stores, and programmatic setups can attach media directly through the provider without requiring a container element in the DOM.

**Context-based registration matches React.** React already uses this pattern — `<Video>` calls `setMedia` via context, `<Container>` calls `setContainer`. The HTML implementation now mirrors this with `mediaAttachContext` and `containerAttachContext`.

### Trade-offs

- **Player element grows in complexity.** It owns attach lifecycle management, native media discovery, and two additional context providers. This is manageable because it consolidates previously scattered responsibilities in the element that already owns the store.

- **DOM observation is a pragmatic compromise.** Plain `<video>` and `<audio>` elements can't consume context, so the provider observes its subtree for them. This means two discovery paths exist, but native elements continue to work when added, removed, or replaced after connection.
