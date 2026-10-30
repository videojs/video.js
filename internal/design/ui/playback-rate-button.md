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
- Tooltip: `"Playback rate"` without the value, which the button already shows, plus the `speedUp` shortcut hint. The button also exposes that shortcut through `aria-keyshortcuts`.
- `aria-disabled`: Present when `disabled` prop is true.
- Keyboard: `Enter` and `Space` cycle to next rate.

## Custom Rates

The player input `defaultPlaybackRates` (`default-playback-rates="0.5 1 1.5 2"` in HTML) sets the rates every control uses, and the button and radio group take their own `rates` to override it ([#9273](https://github.com/videojs/video.js/issues/9273), [review](https://github.com/videojs/video.js/pull/9533#issuecomment-6503311479)). Hotkeys and menus are different interfaces: a menu wants a short list, while an editing flow may want hotkeys that step by `0.1`, so `speedUp`/`speedDown` step by a hotkey's `value` when it has one.

- **No converter needed:** HTML inputs are declared as strings, and the shared parser accepts a space-separated list or an array.
- **No auto-sorting:** The button cycles in the author's order. `speedUp`/`speedDown` step by value and stop at the ends, so they work whatever the order.
- **The media owns the rate:** It can be one no control offers, set through the media API or a stepped hotkey. The radio group slots it in before the next faster rate as a `custom` option, named "Custom, {rate}" for assistive technology.
- **Ranges, not lists:** Media report a `{ min, max }` range through an internal `playbackRateRange` getter, kept internal until the name and shape settle ([review](https://github.com/videojs/video.js/pull/9533#pullrequestreview-5706911916)); one that reports none gets the native `0.0625`–`16`. YouTube lists quarter steps in `getAvailablePlaybackRates` but plays any rate from `0.25` to `2`, floored to `0.05`, so a list would hide rates it accepts. Rates outside the range are left out of the offered lists, and `setPlaybackRate` clamps to the nearest end with a development warning.

**Alternatives explored:**

- **One shared list only** — Forces the menu and hotkeys to agree.
- **Discrete supported-rate lists** — YouTube's list understates what it plays, and native media have no list at all.
- **`AttributeTokenList`** — Media Chrome's `DOMTokenList`-like approach. More infrastructure than needed.
- **`Array` built-in type with `JSON.parse`** — Produces `rates='[1, 1.5, 2]'` which is awkward for HTML authors.
- **`min`/`max`/`step`** — [Vidstack's approach](https://vidstack.io/docs/wc/player/components/sliders/speed-slider/) for continuous ranges. Doesn't allow non-uniform spacing or arbitrary ordering.

## References

- [Media Chrome: Playback Rate Button](https://www.media-chrome.org/docs/en/components/media-playback-rate-button) — Default rates `[1, 1.2, 1.5, 1.7, 2]`, cycle on click
- [`HTMLMediaElement.playbackRate` (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/playbackRate)
- Issue [#622](https://github.com/videojs/v10/issues/622)
