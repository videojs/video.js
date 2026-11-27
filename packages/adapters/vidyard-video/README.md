# @videojs/vidyard-video

[Vidyard Player API](https://knowledge.vidyard.com/hc/en-us/articles/360019034753-Using-the-Vidyard-Player-API)
playback adapter for Video.js. It plays Vidyard players and exposes the adapter, its props, and defaults; the HTML and
React façades live in `@videojs/html` and `@videojs/react`.

```bash
pnpm add @videojs/html @videojs/vidyard-video
# or
pnpm add @videojs/react @videojs/vidyard-video
```

## Usage

```ts
import '@videojs/html/media/vidyard-video';
```

```html
<vidyard-video src="https://share.vidyard.com/watch/YBvcF2BEfvKdowmfrRwk57"></vidyard-video>
```

`src` takes a Vidyard sharing page URL, player URL, or player UUID. Vidyard's own controls stay hidden so a Video.js skin
can drive playback; set `controls` to show them instead.

## License

[Apache-2.0](../../../LICENSE)
