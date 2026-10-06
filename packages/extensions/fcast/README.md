# @videojs/fcast

An FCast casting option for Video.js 10. The package connects player playback controls to an FCast sender supplied by
your application. The sender handles receiver discovery, the device picker, the FCast connection, and receiver state.
Browsers cannot use the FCast SDK's TCP and mDNS features directly. Use a native SDK sender or a local bridge behind the
`FCastSender` interface.

```bash
pnpm add @videojs/react @videojs/fcast
# or
pnpm add @videojs/html @videojs/fcast
```

React:

```tsx
import { FCastButton } from '@videojs/react/ui/fcast-button';
import { CastButton } from '@videojs/react/ui/cast-button';
import { AirPlayButton } from '@videojs/react/ui/airplay-button';
import type { FCastSender } from '@videojs/fcast';

function CastingControls({ sender }: { sender: FCastSender }) {
  return <>
    <CastButton />
    <AirPlayButton />
    <FCastButton sender={sender}>FCast</FCastButton>
  </>;
}
```

HTML:

```ts
import '@videojs/html/ui/cast-button';
import '@videojs/html/ui/airplay-button';
import '@videojs/html/ui/fcast-button';
import type { FCastSender } from '@videojs/fcast';

declare const sender: FCastSender; // Your application-provided native sender or bridge.
const button = document.querySelector('media-fcast-button');
button!.sender = sender;
```

```html
<media-cast-button></media-cast-button>
<media-airplay-button></media-airplay-button>
<media-fcast-button>FCast</media-fcast-button>
```

Place the controls inside a Video.js player. The button registers its own extension, so it can be included beside the
other controls. The FCast sender's `snapshot` reports availability, connection, playback position, duration, volume,
mute state, and speed. It dispatches a `change` event whenever those values change. `prompt()` opens the application
device picker; `disconnect()` ends the session; `load()` and the remaining commands control the receiver. The button
uses `src`/`contentType` when the receiver needs a different playable URL or MIME type from the local media.

See the [FCast SDK](https://docs.fcast.org/sdk/) for native sender libraries and the
[FCast protocol](https://docs.fcast.org/protocol/v4/) for a bridge implementation.
