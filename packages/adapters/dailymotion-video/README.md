# @videojs/dailymotion-video

Dailymotion embed playback adapter for Video.js. Dailymotion only embeds videos inside a player configuration from
[Dailymotion Studio](https://www.dailymotion.com/partner/embed/players), so every source names one by its Player ID. It
exposes the adapter, its props, and defaults; the HTML and React façades live in `@videojs/html` and `@videojs/react`.

```bash
pnpm add @videojs/html @videojs/dailymotion-video
# or
pnpm add @videojs/react @videojs/dailymotion-video
```

## Usage

```ts
import '@videojs/html/media/dailymotion-video';
```

Name the player configuration with Dailymotion's player embed URL, or with `engine.dailymotion.player` when `src` is a
video page URL:

```html
<dailymotion-video src="https://geo.dailymotion.com/player/x8lr5.html?video=x84sh87"></dailymotion-video>
```

Dailymotion's terms don't allow covering its player, so use it without a Video.js skin: the player configuration decides
which of Dailymotion's controls show.

## License

[Apache-2.0](../../../LICENSE)
