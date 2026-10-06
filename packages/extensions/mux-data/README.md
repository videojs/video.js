# @videojs/mux-data

Mux Data telemetry for Video.js. This package owns the supported `mux-embed` runtime and can monitor native playback,
hls.js, dash.js, and other Video.js Media implementations without installing a playback engine.
It is an extension: it adds behavior to whichever media the player is playing.

```bash
pnpm add @videojs/html @videojs/mux-data
# or
pnpm add @videojs/react @videojs/mux-data
```

## AI Quickstart

Using an AI coding agent? Install the [Video.js skill](https://github.com/videojs/skills) so it reads the docs that
match this package version before writing code. Then print installation instructions that include Mux Data:

```sh
npx @videojs/cli agents init --framework react --media mux-video --extensions mux-data
npx @videojs/cli agents init --framework html --media mux-video --extensions mux-data
```

## Usage

```ts
import '@videojs/html/extensions/mux-data';
```

```tsx
import { MuxData } from '@videojs/react/extensions/mux-data';
```

## License

[Apache-2.0](../../../LICENSE)
