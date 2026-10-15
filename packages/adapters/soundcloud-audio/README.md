# @videojs/soundcloud-audio

[SoundCloud Widget](https://developers.soundcloud.com/docs/api/html5-widget) playback adapter for Video.js. It plays
SoundCloud tracks and sets, public or private, and exposes the adapter, its props, and defaults; the HTML and React
façades live in `@videojs/html` and `@videojs/react`.

```bash
pnpm add @videojs/html @videojs/soundcloud-audio
# or
pnpm add @videojs/react @videojs/soundcloud-audio
```

## Usage

```ts
import '@videojs/html/media/soundcloud-audio';
```

```html
<soundcloud-audio src="https://soundcloud.com/forss/flickermood"></soundcloud-audio>
```

## License

[Apache-2.0](../../../LICENSE)
