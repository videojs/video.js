# @videojs/fcast

An FCast casting option for Video.js 10. The package connects player playback controls to an FCast sender supplied by
your application. The sender handles receiver discovery, the device picker, the FCast connection, and receiver state.
Browsers cannot use the FCast SDK's TCP and mDNS features directly. Use a native SDK sender or a local bridge behind the
`FCastBridge` interface (`FCastSender` remains a compatible alias). This package defines the bridge contract; it does not implement a bridge.

```bash
pnpm add @videojs/react @videojs/fcast
# or
pnpm add @videojs/html @videojs/fcast
```

React:

```tsx
import { FCast } from '@videojs/react/extensions/fcast';
import { FCastButton } from '@videojs/react/ui/fcast-button';
import { CastButton } from '@videojs/react/ui/cast-button';
import { AirPlayButton } from '@videojs/react/ui/airplay-button';
import type { FCastSender } from '@videojs/fcast';

function CastingControls({ sender }: { sender: FCastSender }) {
  return <>
    <CastButton />
    <AirPlayButton />
    <FCast sender={sender} />
    <FCastButton>FCast</FCastButton>
  </>;
}
```

HTML:

```ts
import '@videojs/html/ui/cast-button';
import '@videojs/html/ui/airplay-button';
import '@videojs/html/ui/fcast-button';
import '@videojs/html/extensions/fcast';
import type { FCastSender } from '@videojs/fcast';

declare const sender: FCastSender; // Your application-provided native sender or bridge.
const extension = document.querySelector('fcast-extension');
extension!.sender = sender;
```

```html
<media-cast-button></media-cast-button>
<media-airplay-button></media-airplay-button>
<fcast-extension></fcast-extension>
<media-fcast-button>FCast</media-fcast-button>
```

Place the extension and controls inside a Video.js player. The extension component registers the core; buttons observe it. The FCast sender's `snapshot` reports availability, connection, playback position, duration, volume,
mute state, and speed. It dispatches a `change` event whenever those values change. `prompt()` opens the application
device picker; `disconnect()` ends the session; `load()` and the remaining commands control the receiver. The extension
uses `src`/`contentType` when the receiver needs a different playable URL or MIME type from the local media.

The packaged video and live video skins include an FCast button, hidden until the player has an FCast extension with a sender. Configure `sender`, `src`, and `contentType` on `<FCast />` or `<fcast-extension>`. Removing a button leaves the extension active; removing the extension disconnects its session.

See the [FCast SDK](https://docs.fcast.org/sdk/) for native sender libraries and the
[FCast protocol](https://docs.fcast.org/protocol/v4/) for a bridge implementation.

The [FCast extension reference](https://videojs.org/docs/framework/react/reference/components/fcast) documents bridge lifecycle, command ordering, state normalization, and error events.
