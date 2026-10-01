---
status: decided
date: 2026-09-01
---

# Mux Data Keeps One Monitor Per Target

## Decision

`MuxDataExtension` starts one `mux-embed` monitor per target and keeps it alive for the target's lifetime. A source change is reported to the live monitor as `videochange`, and an engine swap re-hooks engine telemetry on the live monitor. The monitor is destroyed and re-created only when the target changes or when an option baked into `monitor()` itself changes (SDK, beacon domain, debug, cookies).

## Why

Destroying and re-running `monitor()` per source, the shape Mux Player's `playback-core` uses, is the outlier among Mux integrations and the cause of #2562. mux-embed's documented contract for playing several videos in one player is `videochange`: the SDK ends the current view, resets every `video_*` and `view_*` field, and arms `viewstart` on the next `play`. Every Mux-maintained integration (the Video.js plugin, THEOplayer, Kaltura, Akamai, React Native Video) follows it. A fresh `monitor()` per source instead re-runs first-view setup, so each fragment of one viewing lands as a separate player and view and can never be grouped back together. `playback-core` rediscovered this the hard way: its FairPlay retry has to force `muxDataKeepSession` and re-hook hls.js on the live monitor to avoid duplicate views, which is the same mechanism this decision makes the default.

Three properties of the contract shaped the details:

- The reset is complete, so `videochange` carries the full video metadata every time, not a diff.
- `viewstart` waits for `play`. That is safe on `HTMLMediaElement` hosts because the load algorithm sets `paused` on every `load()`, so a source change always yields a fresh `play`. Integrations whose pipeline can swap sources without a paused transition (THEOplayer) synthesize `play` themselves. An SPF media (#1845) must either preserve that transition or do the same.
- A cleared source is not a video change. mux-embed's element monitor does not listen to `emptied` or `abort`; the load algorithm's `pause` simply idles the view. So a cleared source is neither reported nor tracked, and the next real source is compared against the last video the monitor was told about.

## Sources

- Mux Data, Monitor HTML5 Video Element, "Changing the video": https://www.mux.com/docs/guides/monitor-html5-video-element
- mux-embed SDK behavior (`videochange` resets the view and arms `viewstart` on `play`; the element monitor's event list), as shipped in the `mux-embed` npm package: https://www.npmjs.com/package/mux-embed
- `playback-core` destroy-per-source and its `muxDataKeepSession` workaround: https://github.com/muxinc/elements/blob/e1a32eb3fb147fcbd42f810ecf54101f4582f868/packages/playback-core/src/index.ts#L671-L679 and https://github.com/muxinc/elements/blob/e1a32eb3fb147fcbd42f810ecf54101f4582f868/packages/playback-core/src/index.ts#L697-L740
- Bug and fix: https://github.com/videojs/v10/issues/2562, https://github.com/videojs/v10/pull/2565. Inheriting work: https://github.com/videojs/v10/issues/1845
- Implementation: [`extension.ts`](/packages/extensions/mux-data/src/extension.ts), [`extension.test.ts`](/packages/extensions/mux-data/src/tests/extension.test.ts)
