# Use case: an animated GIF as a Video.js media

An animated GIF is a video that the web treats as an image. An `<img>` plays it from the first byte, loops it forever,
and offers no pause, no seek, no speed, no "which frame is this". This use case makes a GIF a real Video.js media, then
builds a skin for what people actually do with GIFs.

Everything lives in the sandbox for now. Nothing here is published or part of a package.

## Pages

| Page                                 | What it shows                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `/gif-video-html/`, `/gif-video-react/` | `<gif-video>` / `<GifVideo>` inside the stock video player and skin. Proves the media contract. |
| `/gif-skin-html/`, `/gif-skin-react/`   | The GIF skin: frame counter, tap to toggle, frame stepping, loop, speed, copy a still.          |
| `/gif-grid-html/`, `/gif-grid-react/`   | Eight tiles that sit on their first frame and play only while hovered or focused.               |

## Parts

The `gif/` directory is a small GIF library that knows nothing about Video.js. Nothing in it imports `@videojs/*`,
and a test (`gif-library-boundary.test.ts`) keeps it that way. Everything beside it is Video.js integration.

- `gif/gif-source.ts` — `loadGif()` owns the file: it fetches the bytes, picks a decoder, and returns a `GifSource`
  with the geometry, the frame timeline in media time (`startOf`, `delayOf`, `frameAt`, `duration`), and
  `drawFrame()`. A `GifLoadError` says whether the network or the decode failed.
- `gif/image-decoder-source.ts` — the primary decoder: WebCodecs `ImageDecoder`. The browser composites frames; only
  the timing table is read up front. Chrome 94+, Firefox 133+, no Safari as of October 2026.
- `gif/gif-decoder.ts`, `gif/decoded-gif-source.ts` — the fallback: a dependency-free GIF89a parser (LZW, interlace,
  local color tables, transparency, all four disposal methods) and a compositor that keeps frames as palette indices
  until they are painted. Replaces the gifuct-js dependency the earlier spike used.
- `gif/frame-source.ts` — the seam between the two decoders and the timeline.
- `adapter.ts` — `GifAdapter`, a framework-neutral media that only runs a clock over a `GifSource` and drives a
  `<canvas>`. Implements the pause, seek, source, playback-rate, and buffer capabilities, dispatches the standard media
  events, and adds `frameCount`, `currentFrame`, `seekToFrame()`, and a `framechange` event.
- `element.ts` — `<gif-video>`, built with `CustomMediaElement('canvas', GifAdapter)` and `MediaAttachMixin`, the same
  way the embed adapters build theirs.
- `react.tsx` — `<GifVideo>`, built from `useMediaInstance`, `useMediaEvents`, and `useMediaRef` like the other React
  media components.
- `../features/` — three store features the skin uses, none of them GIF-specific: `loopFeature` (loop and
  `setLoop`), `frameFeature` (`frameCount`, `currentFrame`, `stepFrame`, `seekToFrame`, for any media that addresses
  time by frame), and `snapshotFeature` (`copySnapshot`, for a `<video>` or any adapter that paints a canvas). Each is
  one `definePlayerFeature` call passed to `createPlayer({ features: [...videoFeatures, ...] })` on both platforms, and
  each is a candidate for the core presets.
- Reduced motion is deliberately not a feature. It is a viewer fact, like color scheme or locale, so the pages read it
  with `matchMedia` (a `useReducedMotion` hook on React) to withhold autoplay and hover-to-play, and the skins show the
  "paused for reduced motion" caption with a plain `prefers-reduced-motion` media query.
- `skin/react.tsx`, `skin/html.ts` — the GIF skin, composed from stock primitives (container, gesture, controls, play
  button, time slider, playback-rate button) plus three buttons of its own. The HTML one is a shadow-DOM element
  registered as `<gif-skin>` alongside `<gif-player>`.

Tests are in `app/tests/gif-*.test.ts`; `app/tests/helpers/encode-gif.ts` is a small GIF encoder so fixtures are
readable palette indices rather than binary files.

## What the architecture handled without changes

- A canvas-backed media with no `<video>` underneath. The capability-based contract meant the stock features either
  worked (play, seek, rate, buffer) or quietly stood down (volume, captions, fullscreen on media, PiP).
- Custom state next to the stock state. One `definePlayerFeature` call put frame state in the same store the stock UI
  reads, and the same `createPlayer` overload accepted it on HTML and React.
- Eight players on one page, each with its own store, each a few kilobytes of UI.

## What it surfaced

- `definePlayerFeature` is marked `@internal`, yet it is the only way to add state. Both skins depend on it.
- The React `useSyncProps` helper the media components share is not exported, so the sandbox carries a copy.
- `loop` is not in the store. The playback feature tracks `paused`, `ended`, `started`, and `waiting`; `loopFeature`
  had to be written here. Video players want it too, which is why it lives in `../features/` rather than beside the GIF.
- Frame addressing is a media capability, not a GIF one. `frameFeature` reads `frameCount`, `currentFrame`,
  `seekToFrame()`, and a `framechange` event off any media that offers them; an image sequence or a time-sampled
  dataset would satisfy the same contract.
- The stock skins show the poster layer until playback starts, which hides a GIF's first frame behind a dark overlay.
  The GIF skin drops the poster entirely; a media should probably be able to say it has no poster to show.
- `prefers-reduced-motion` is a player concern, not a GIF concern. The pages here read it to withhold autoplay and
  hover-to-play and the skins say why they started paused; the same belongs in the stock autoplay story.

The day-to-day friction (undocumented conventions, tooling surprises) is in `FRICTION.md` next to this file.
