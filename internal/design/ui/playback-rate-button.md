---
status: implemented
date: 2026-02-26
---

# PlaybackRateButton

Button for cycling through playback speeds. Displays the current rate and advances to the next on click.

## Problem

Users want to speed up or slow down video playback. A button that cycles through preset rates is a common pattern — compact, one-click, no menu required.

Two things are needed:

1. **Store feature** — `playbackRate` isn't tracked in the store yet. No state, no selector, no action.
2. **Button component** — Three-layer implementation (Core + HTML + React) following existing button patterns.

## Why a Separate Feature

The alternative is extending `playbackFeature` — adding `playbackRate` and `setPlaybackRate` to existing `MediaPlaybackState`. Conceptually cohesive since rate is a property of playback, and the native API puts it on the same `HTMLMediaElement`. But coupling means every playback subscriber re-renders on rate change, and the state can't independently track capability/support.

A separate feature wins out ([per review](https://github.com/videojs/v10/pull/624#discussion_r2861102031)):

- **Self-contained capability** — Rate support varies by provider (e.g., Vimeo required Pro, YouTube exposes `getAvailablePlaybackRates`). A separate feature can later track availability without bloating the playback state.
- **Used independently in UI** — The playback rate button only needs rate state, not `paused`/`ended`/`waiting`.
- **Granular contracts** — Aligns with the pattern of capability-scoped features.

## Accessibility

- `aria-label`: Default `"Playback rate, {rate}"` (e.g., `"Playback rate, 1.5"`). Updates on rate change. The comma gives screen readers a pause before the value.
- Tooltip: `"Playback rate"` without the value, which the button already shows. No shortcut hint or `aria-keyshortcuts`: the button cycles and wraps, which no hotkey does.
- `aria-disabled`: Present when `disabled` prop is true.
- Keyboard: `Enter` and `Space` cycle to next rate.

## Deferred: Custom `rates` Prop

Custom rates are intentionally deferred ([per review](https://github.com/videojs/v10/pull/624#discussion_r2861088551)). Some providers only support specific playback rates (e.g., [YouTube's `getAvailablePlaybackRates`](https://developers.google.com/youtube/iframe_api_reference#getAvailablePlaybackRates)), so exposing a consumer-facing `rates` prop without accounting for provider constraints could lead to broken UX. The store's `playbackRates` array is the right place — providers can populate it dynamically in the future.

When we're ready to expose custom rates, the following research applies:

**Proposed API:** `<PlaybackRateButton rates={[0.5, 1, 1.5, 2]} />` in React, `rates="0.5 1 1.5 2"` (space-separated) in HTML. A component `rates` prop would override the store's `playbackRates` for that instance.

**ReactiveElement `converter`:** The HTML attribute needs a `converter` option on `ReactiveElement` since it only handles `String`, `Boolean`, and `Number` today. Aligns with [Lit's converter API](https://lit.dev/docs/v1/components/properties/#conversion-converter).

**No auto-sorting:** Rates are cycled in array order, not sorted numerically. Media Chrome sorts with `.sort((a, b) => a - b)`, but we respect the consumer's order.

**Alternatives explored:**

- **Property-only (no attribute)** — Forces JS-only configuration, undermines declarative HTML story.
- **`AttributeTokenList`** — Media Chrome's `DOMTokenList`-like approach. More infrastructure than needed.
- **`Array` built-in type with `JSON.parse`** — Produces `rates='[1, 1.5, 2]'` which is awkward for HTML authors.
- **`min`/`max`/`step`** — [Vidstack's approach](https://vidstack.io/docs/wc/player/components/sliders/speed-slider/) for continuous ranges. Doesn't allow non-uniform spacing or arbitrary ordering.

## References

- [Media Chrome: Playback Rate Button](https://www.media-chrome.org/docs/en/components/media-playback-rate-button) — Default rates `[1, 1.2, 1.5, 1.7, 2]`, cycle on click
- [`HTMLMediaElement.playbackRate` (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate)
- Issue [#622](https://github.com/videojs/v10/issues/622)
