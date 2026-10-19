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

- `aria-label`: Default `"Playback rate {rate}"` (e.g., `"Playback rate 1.5"`). Updates on rate change. Matches Media Chrome's format.
- `aria-disabled`: Present when `disabled` prop is true.
- Keyboard: `Enter` and `Space` cycle to next rate.

## Custom Rates

Rates are a player input, `playbackRates` (`playback-rates="0.5 1 1.5 2"` in HTML), on the playback rate feature rather than a `rates` prop on the button ([#9273](https://github.com/videojs/video.js/issues/9273)). The button, the radio group, and the `speedUp`/`speedDown` hotkeys all read the store's `playbackRates`; a per-button override would let them disagree.

- **No converter needed:** HTML player inputs are declared as strings, so the feature's private action parses the space-separated list itself. A JS property can still take an array.
- **No auto-sorting:** The button cycles in the author's order. `speedUp`/`speedDown` step by value and stop at the ends, so they work whatever the order.
- **Provider constraints:** Still deferred ([per review](https://github.com/videojs/v10/pull/624#discussion_r2861088551)). Some providers only support specific rates (e.g., [YouTube's `getAvailablePlaybackRates`](https://developers.google.com/youtube/iframe_api_reference#getAvailablePlaybackRates)). When a media capability reports them, the feature should publish the configured rates intersected with the supported ones.

**Alternatives explored:**

- **Per-component `rates` prop** — Desyncs the button from the menu and hotkeys.
- **`AttributeTokenList`** — Media Chrome's `DOMTokenList`-like approach. More infrastructure than needed.
- **`Array` built-in type with `JSON.parse`** — Produces `rates='[1, 1.5, 2]'` which is awkward for HTML authors.
- **`min`/`max`/`step`** — [Vidstack's approach](https://vidstack.io/docs/wc/player/components/sliders/speed-slider/) for continuous ranges. Doesn't allow non-uniform spacing or arbitrary ordering.

## References

- [Media Chrome: Playback Rate Button](https://www.media-chrome.org/docs/en/components/media-playback-rate-button) — Default rates `[1, 1.2, 1.5, 1.7, 2]`, cycle on click
- [`HTMLMediaElement.playbackRate` (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate)
- Issue [#622](https://github.com/videojs/v10/issues/622)
