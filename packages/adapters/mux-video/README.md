# @videojs/mux-video

The Video.js playback adapter for Mux-hosted video. It owns the Mux source model (playback IDs, tokens, DRM, posters,
storyboards) and plays it through one of two engines, picked by import path:

- `@videojs/mux-video` — the default, over the Video.js streaming engine from `@videojs/spf`. `@videojs/mux-video/spf`
  names the same Media explicitly.
- `@videojs/mux-video/hls-js` — over [hls.js](https://github.com/video-dev/hls.js), through `@videojs/hlsjs-video`. Reach
  for it when a source needs hls.js configuration, native HLS playback, client-side rendition caps, Low-Latency HLS, or
  a live stream packaged as MPEG-TS.

Install the adapter with the framework façade your player uses:

```bash
pnpm add @videojs/html @videojs/mux-video
# or
pnpm add @videojs/react @videojs/mux-video
```

## AI Quickstart

Using an AI coding agent? Install the [Video.js skill](https://github.com/videojs/skills) so it reads the docs that
match this package version before writing code. Then print installation instructions with this adapter selected:

```sh
npx @videojs/cli agents init --framework react --media mux-video
npx @videojs/cli agents init --framework html --media mux-video
```

## Usage

```ts
import '@videojs/html/media/mux-video';
```

```tsx
import { MuxVideo } from '@videojs/react/media/mux-video';
```

The hls.js-backed flavor is the same element and component at an `hls-js` subpath:

```ts
import '@videojs/html/media/mux-video/hls-js';
```

```tsx
import { MuxVideo } from '@videojs/react/media/mux-video/hls-js';
```

Low-level consumers can import the Media directly:

```ts
import { MuxVideoAdapter } from '@videojs/mux-video';
// or, over hls.js
import { MuxVideoAdapter } from '@videojs/mux-video/hls-js';
```

## License

[Apache-2.0](../../../LICENSE)
