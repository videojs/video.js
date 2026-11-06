# @videojs/relay-video

Mux Relay playback adapter for Video.js. It plays a live broadcast from a connection the application already holds: the
application connects with the Relay SDK, hands the element its subscriber and a namespace, and keeps using the same
connection for chat and other tracks. The HTML element lives in `@videojs/html`.

```bash
pnpm add @videojs/html @videojs/relay-video @caprid/relay @caprid/moq-media
```

## Usage

```ts
import '@videojs/html/media/relay-video';
import { connectSupervisedSubscriber } from '@caprid/relay';

const subscriber = await connectSupervisedSubscriber({ url: 'https://relay.mux.global', getToken: () => token });

document.querySelector('relay-video')!.source = { subscriber, namespace: ['live', 'room-1'] };
```

The element wants the catalog, video and audio tracks under keys of its own, and unwants only those when its source
changes or it is removed. It never closes or rotates the connection.

## License

[Apache-2.0](../../../LICENSE)
