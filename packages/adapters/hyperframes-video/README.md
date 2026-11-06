# @videojs/hyperframes-video

[HyperFrames](https://github.com/heygen-com/hyperframes) composition playback adapter for Video.js. A HyperFrames
composition is HTML clips timed with `data-start` and `data-duration`, animated by a seekable timeline (usually GSAP).
The adapter plays one in an iframe under the HyperFrames runtime and drives it as media, so the player's controls,
time slider, and keyboard shortcuts work against it. It exposes the adapter, its props, and defaults; the HTML and React
façades live in `@videojs/html` and `@videojs/react`.

```bash
pnpm add @videojs/html @videojs/hyperframes-video
# or
pnpm add @videojs/react @videojs/hyperframes-video
```

## Usage

```ts
import '@videojs/html/media/hyperframes-video';
```

```html
<hyperframes-video>
  <template>
    <h1 class="clip title" data-start="0" data-duration="3" data-track-index="1">Hello</h1>
  </template>
</hyperframes-video>
```

## License

[Apache-2.0](../../../LICENSE)
