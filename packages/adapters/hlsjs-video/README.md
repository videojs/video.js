# @videojs/hlsjs-video

The Video.js playback adapter for [hls.js](https://github.com/video-dev/hls.js). It owns the supported hls.js runtime,
browser playback implementation, and compatibility tests. `@videojs/mux-video/hls-js` builds on it.

Install the adapter with the framework façade your player uses:

```bash
pnpm add @videojs/html @videojs/hlsjs-video
# or
pnpm add @videojs/react @videojs/hlsjs-video
```

## AI Quickstart

Using an AI coding agent? Install the [Video.js skill](https://github.com/videojs/skills) so it reads the docs that
match this package version before writing code. Then print installation instructions with this adapter selected:

```sh
npx @videojs/cli agents init --framework react --media hls
npx @videojs/cli agents init --framework html --media hls
```

## Usage

Use the HTML or React façade for normal player integration:

```ts
import '@videojs/html/media/hlsjs-video';
```

```tsx
import { HlsJsVideo } from '@videojs/react/media/hlsjs-video';
```

Low-level consumers can import the Media and supported hls.js class directly:

```ts
import { Hls, HlsJsAdapter } from '@videojs/hlsjs-video';
```

## License

[Apache-2.0](../../../LICENSE)
