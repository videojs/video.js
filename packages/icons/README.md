# @videojs/icons

SVG icon library for Video.js. Ships optimized icons for React, HTML strings, static rendering, and the `<media-icon>` custom element, organized into icon sets.

## Icon Sets

Icons are grouped into visual sets. Each set contains the same icon names with different designs.

| Set | Description |
| --- | --- |
| `default` | Standard icon set used by the default skin |
| `neutral` | Simplified icon set used by the neutral skin |

### Available Icons

| Icon | React Export | HTML Export |
| --- | --- | --- |
| `airplay-enter` | `AirPlayEnterIcon` | `airPlayEnterIcon` |
| `airplay-exit` | `AirPlayExitIcon` | `airPlayExitIcon` |
| `captions-off` | `CaptionsOffIcon` | `captionsOffIcon` |
| `captions-on` | `CaptionsOnIcon` | `captionsOnIcon` |
| `cast-enter` | `CastEnterIcon` | `castEnterIcon` |
| `cast-exit` | `CastExitIcon` | `castExitIcon` |
| `check` | `CheckIcon` | `checkIcon` |
| `chevron` | `ChevronIcon` | `chevronIcon` |
| `fullscreen-enter` | `FullscreenEnterIcon` | `fullscreenEnterIcon` |
| `fullscreen-exit` | `FullscreenExitIcon` | `fullscreenExitIcon` |
| `gear` | `GearIcon` | `gearIcon` |
| `pause` | `PauseIcon` | `pauseIcon` |
| `pip-enter` | `PipEnterIcon` | `pipEnterIcon` |
| `pip-exit` | `PipExitIcon` | `pipExitIcon` |
| `play` | `PlayIcon` | `playIcon` |
| `quality` | `QualityIcon` | `qualityIcon` |
| `restart` | `RestartIcon` | `restartIcon` |
| `seek` | `SeekIcon` | `seekIcon` |
| `speech` | `SpeechIcon` | `speechIcon` |
| `speed` | `SpeedIcon` | `speedIcon` |
| `spinner` | `SpinnerIcon` | `spinnerIcon` |
| `switches` | `SwitchesIcon` | `switchesIcon` |
| `volume-high` | `VolumeHighIcon` | `volumeHighIcon` |
| `volume-low` | `VolumeLowIcon` | `volumeLowIcon` |
| `volume-off` | `VolumeOffIcon` | `volumeOffIcon` |

## Usage

### React

Import icons as React components. They accept standard SVG props and support ref forwarding.

```tsx
import { PlayIcon, PauseIcon } from '@videojs/react/icons';

function Controls() {
  return (
    <button>
      <PlayIcon className="icon" aria-hidden="true" />
    </button>
  );
}
```

Import from a specific icon set:

```tsx
import { PlayIcon } from '@videojs/react/icons/neutral';
```

### HTML

Import icons as SVG strings for use in plain HTML or web components.

```ts
import { playIcon, pauseIcon } from '@videojs/html/icons';

button.innerHTML = playIcon;
```

Import from a specific icon set:

```ts
import { playIcon } from '@videojs/html/icons/neutral';
```

Register the `<media-icon>` custom element separately when you want HTML skins to render icons lazily:

```ts
import '@videojs/html/icons/element';
```

Import a specific element icon set when eager family registration is preferred:

```ts
import '@videojs/html/icons/element/neutral';
```

## Styling

All icons use `fill="currentColor"`, so they inherit the text color of their parent element. Size and color can be controlled with CSS:

```css
.icon {
  width: 18px;
  height: 18px;
  color: white;
}
```

Icons are designed on an **18×18 grid**. Rendering at `18px` (or exact multiples like `36px`) produces the crispest result. Other sizes may introduce sub-pixel rendering artifacts.

## Adding Icons

1. Add an SVG file to `src/assets/<set>/` (e.g., `src/assets/default/my-icon.svg`).
2. Run `pnpm -F @videojs/icons build`.
3. The build script optimizes the SVG with SVGO and generates React components and HTML string exports.

The build automatically:

- Optimizes each source SVG once and normalizes black fills and strokes to `currentColor`.
- Adds `aria-hidden="true"` because accessible names belong on the surrounding control.
- Preserves the `viewBox` attribute.
- Generates executable `.js` modules and matching `.d.ts` declarations.

## Adding an Icon Set

Create a new directory under `src/assets/` (e.g., `src/assets/custom/`), add SVG files, and rebuild. The set is automatically available via:

```ts
import { PlayIcon } from '@videojs/react/icons/custom';
import { playIcon } from '@videojs/html/icons/custom';
```

## Development

Running `pnpm -F @videojs/icons dev` starts the build in watch mode. Any changes to `.svg` files under `src/assets/` trigger an automatic rebuild, including new icons and new icon sets — no restart required.

## Scripts

```bash
pnpm -F @videojs/icons build        # Build all icon sets
pnpm -F @videojs/icons dev          # Build and watch for changes
pnpm -F @videojs/icons clean        # Remove build output
```
