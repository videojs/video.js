---
status: decided
date: 2026-02-25
---

# Player-Container Separation in HTML

## Decision

The HTML player element (`<video-player>`) is a **provider only** — it owns the store and provides state context to descendants. A separate `<media-container>` element handles layout and interaction and acts as the fullscreen target. The package exposes that concrete `ContainerElement` independently from `createPlayer()`.

This mirrors the React architecture where `Player`, `Container`, and media components (`Video`, `Audio`) are distinct:

```tsx
<Player>
  <VideoSkin> {/* Container + UI */}
    <Video src="..." />
  </VideoSkin>
</Player>
```

The HTML equivalent:

```html
<video-player>
  <video-skin> <!-- Container + UI -->
    <video src="video.mp4"></video>
  </video-skin>
</video-player>
```

## Context

On the React side, the separation between `Player` (state), `Container` (layout/media attachment), and `Video` (media component) is natural — React's component model encourages composition through nesting.

On the HTML side, there was temptation to combine the provider and container into a single `<video-player>` element. This would make the wrapping element feel more "functional" as a traditional HTML element that handles both state and layout. However, combining them means:

- **Skins diverge across platforms.** In React, a skin is `Container` + UI controls — `Player` wraps outside. If the HTML player element _is_ the container, then HTML skins don't include a container (it's already baked in), while React skins do. "Skin" means different things on each platform.
- **Features outside the fullscreen target lose state access.** The container is the fullscreen target. If it's also the provider, then anything outside it (playlist, transcript, sidebar) is also outside the player's state scope and can't use `PlayerController` or context to access player state.

The current architecture returns a configured `PlayerElement` from `createPlayer()` and exposes a concrete `ContainerElement` independently from the main package. This decision formalizes the separation as the default: the player and container remain distinct elements.

## Alternatives Considered

- **Combined provider+container as `<video-player>`** — Bundles state management and layout into a single element. Feels more natural in HTML at first, but forces anything outside the fullscreen target to also be outside the player's state scope. Skins would mean different things on each platform: in React, a skin wraps a container; in HTML, the skin _is_ the player. Rejected because of the parity and extensibility problems described in the rationale.

- **Naming the element `<video-provider>`** — Names the state-boundary implementation detail. Rejected because it breaks HTML naming conventions. In HTML, the parent element of a domain is named after the domain: `<form>` wraps a form, `<table>` wraps a table. A video player's parent element should be called "player", not "provider".

## Rationale

**Cross-platform skin parity.** Skins should mean the same thing on both platforms. In React, a skin is a `Container` plus UI controls — it doesn't include `Player`. If the HTML player element combines provider and container, then HTML skins would exclude the container (it's already baked into `<video-player>`), breaking parity. Keeping them separate means a skin on both platforms is: container + UI.

```tsx
// React: Skin = Container + UI
function VideoSkin() {
  return (
    <Container>
      // media slot
      <PlayButton />
      <TimeDisplay />
    </Container>
  );
}
```

```html
<!-- HTML: Skin = container + UI (same composition) -->
<media-container>
  // media slot
  <media-play-button></media-play-button>
  <media-time-display></media-time-display>
</media-container>
```

**Extended player applications.** A separated provider allows building features that live within the player's state scope but outside the fullscreen target. A playlist, transcript, or sidebar can access player state directly without going fullscreen when the user clicks fullscreen:

```html
<video-player>
  <media-container>
    <video src="video.mp4"></video>
    <!-- UI controls — this goes fullscreen -->
  </media-container>

  <!-- Inside player scope, outside fullscreen target -->
  <my-playlist></my-playlist>
  <my-transcript></my-transcript>
</video-player>
```

If the container is bundled into `<video-player>`, these features must live _outside_ the player element. They lose convenient access to player state via `PlayerController` and context, and need indirect integration instead.

**Separation of concerns.** The player element's job is state management — creating the store, providing context, and managing lifecycle. The container's job is layout and interaction — wrapping the media and UI and acting as the fullscreen target. These are distinct responsibilities that belong in distinct elements. Developers can subclass `ContainerElement` when they need custom container behavior without rebuilding its context integration.

### Trade-offs

The primary cost of this approach is ergonomic friction in HTML:

- **`display: contents` is unusual in HTML.** The player element renders with `display: contents` by default since it has no layout role. This pattern is rare in native HTML. The closest precedent is `<form>`, which many developers style as `display: contents` because its layout is unwanted. But even `<form>` has _some_ default rendering — a purely non-visual wrapper element is not a native HTML concept.

- **Nested elements can feel redundant.** Developers coming from earlier video players will write `<video-player>` and immediately nest `<media-container>` inside it. At first glance, this looks like unnecessary boilerplate compared to a single wrapping element. Documentation and education will need to explain why the separation exists and what it enables.

- **Developer expectations around the player element.** HTML developers may expect to style or interact with `<video-player>` directly for layout purposes. An imperative API accessible from the player element can address the interaction expectation, but layout-related concerns (sizing, aspect ratio, fullscreen) apply to `<media-container>` and this will require clear guidance.
