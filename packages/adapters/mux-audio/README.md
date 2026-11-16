# @videojs/mux-audio

The Video.js playback adapter for Mux-hosted audio. `MuxAudioAdapter` takes the same Mux source model as
`@videojs/mux-video` and plays through an `<audio>` element, so audio installs by the media it plays. The import path
picks the engine:

- `@videojs/mux-audio` — the default, over the audio-only Video.js streaming engine from `@videojs/spf`, which fetches
  only the audio renditions. `@videojs/mux-audio/spf` names the same Media explicitly.
- `@videojs/mux-audio/hls-js` — over [hls.js](https://github.com/video-dev/hls.js), extending the hls.js-backed Mux video
  adapter from `@videojs/mux-video/hls-js`.

```bash
pnpm add @videojs/html @videojs/mux-audio
# or
pnpm add @videojs/react @videojs/mux-audio
```

## AI Quickstart

Using an AI coding agent? Install the [Video.js skill](https://github.com/videojs/skills) so it reads the docs that
match this package version before writing code. Then print installation instructions with this adapter selected:

```sh
npx @videojs/cli agents init --framework react --preset audio --media mux-audio
npx @videojs/cli agents init --framework html --preset audio --media mux-audio
```

## Usage

```ts
import '@videojs/html/media/mux-audio';
```

```tsx
import { MuxAudio } from '@videojs/react/media/mux-audio';
```

The hls.js-backed flavor is the same element and component at an `hls-js` subpath:

```ts
import '@videojs/html/media/mux-audio/hls-js';
```

```tsx
import { MuxAudio } from '@videojs/react/media/mux-audio/hls-js';
```

## License

[Apache-2.0](../../../LICENSE)
