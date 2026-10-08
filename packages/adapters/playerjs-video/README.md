# @videojs/playerjs-video

[player.js](https://github.com/embedly/player.js) embed playback adapter for Video.js. player.js is an iframe
`postMessage` protocol rather than a hosting service, so this one adapter plays any embed that implements it —
Mux Player, Gumlet, FrameRate, Livid, Bunny Stream, Streamable, and others. It exposes the adapter, its props, and defaults; the HTML and React
façades live in `@videojs/html` and `@videojs/react`.

```bash
pnpm add @videojs/html @videojs/playerjs-video
# or
pnpm add @videojs/react @videojs/playerjs-video
```

## Usage

```ts
import '@videojs/html/media/playerjs-video';
```

```html
<playerjs-video src="https://play.gumlet.io/embed/64bfb0913ed6e5096d66dc1e"></playerjs-video>
```

## License

[Apache-2.0](../../../LICENSE)
