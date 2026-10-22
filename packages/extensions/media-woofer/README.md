# @videojs/media-woofer

Kick up the bass of your player. The media woofer extension for Video.js shakes the media along with the bass (using
the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)) and vibrates phones that support
the [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API).

A port of [`<media-woofer>`](https://github.com/muxinc/media-woofer) to Video.js 10.

```bash
pnpm add @videojs/html @videojs/media-woofer
# or
pnpm add @videojs/react @videojs/media-woofer
```

## Usage

```ts
import '@videojs/html/extensions/media-woofer';
```

```html
<video-player>
  <video src="https://example.com/video.mp4" crossorigin></video>
  <media-woofer></media-woofer>
</video-player>
```

```tsx
import { MediaWoofer } from '@videojs/react/extensions/media-woofer';

<Player>
  <Video src="https://example.com/video.mp4" crossOrigin="" />
  <MediaWoofer />
</Player>;
```

Cross-origin media needs `crossorigin` and CORS headers for its sound to be read; without them the extension leaves the
media alone.

## License

[Apache-2.0](../../../LICENSE)
