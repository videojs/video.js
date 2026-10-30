# @videojs/kaltura-video

The Video.js playback adapter for [Kaltura](https://corp.kaltura.com/) entries, over
[hls.js](https://github.com/video-dev/hls.js). It resolves a partner and an entry with the Kaltura API, then plays the
entry's HLS stream through `@videojs/hlsjs-video`. No Kaltura player loads.

Install the adapter with the framework façade your player uses:

```bash
pnpm add @videojs/html @videojs/kaltura-video
# or
pnpm add @videojs/react @videojs/kaltura-video
```

## Usage

```ts
import '@videojs/html/media/kaltura-video';
```

```html
<kaltura-video src="kaltura/243342/0_uka1msg4"></kaltura-video>
```

```tsx
import { KalturaVideo } from '@videojs/react/media/kaltura-video';

<KalturaVideo source={{ partnerId: 243342, entryId: '0_uka1msg4' }} />;
```

Low-level consumers can import the Media directly:

```ts
import { KalturaVideoAdapter } from '@videojs/kaltura-video';
```

For an entry that access control restricts, sign a Kaltura Session on your server and pass it as `source.ks`. Never
send an admin secret to the browser.

## License

[Apache-2.0](../../../LICENSE)
