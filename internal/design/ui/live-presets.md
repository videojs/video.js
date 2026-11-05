---
status: implemented
date: 2026-04-21
---

# Live presets

Video.js ships dedicated live-video and live-audio presets alongside the on-demand video and audio presets.

## Decisions

- Preset choice expresses the author's delivery mode; presets do not switch between live and VOD UI at runtime.
- Live feature sets include live state and omit playback-rate behavior.
- Live skins render live controls directly rather than branching on stream type.
- Base VOD presets do not carry live state or UI.
- Runtime live-to-VOD workflows remain custom compositions until a concrete shared need appears.

## Consequences

The common VOD path stays smaller and each preset has a stable first-render shape. Consumers that can change modes must choose or compose an appropriate player.

## Current sources

- packages/core/src/dom/store/features/presets.ts
- packages/core/src/core/store/features/live.ts
- packages/react/src/presets/live-video/
- packages/react/src/presets/live-audio/
- packages/html/src/presets/live-video/index.ts
- packages/html/src/presets/live-audio/index.ts
