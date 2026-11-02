# @videojs/remotion-video

[Remotion](https://www.remotion.dev) composition playback adapter for Video.js. It exposes the adapter, its props, and defaults; the React façade lives in
`@videojs/react`.

Remotion renders compositions with React, so this adapter has no HTML façade.

## Installation

```bash
pnpm add @videojs/react @videojs/remotion-video remotion @remotion/player
```

Remotion throws `Multiple versions of Remotion detected` when its packages disagree, so keep `remotion` and `@remotion/player` on the same version. This
package takes `@remotion/player` as a peer dependency rather than depending on it, so the version you install is the one that is used.

## Usage

A composition is code rather than a URL, so it is named by `source` instead of `src`.

```tsx
import { VideoPlayer } from '@videojs/react/video';
import { RemotionVideo } from '@videojs/react/media/remotion-video';

import { MyComposition } from './my-composition';

<VideoPlayer>
  <RemotionVideo
    source={{
      id: 'my-composition',
      composition: {
        component: MyComposition,
        durationInFrames: 150,
        fps: 30,
        compositionWidth: 1920,
        compositionHeight: 1080,
      },
    }}
  />
</VideoPlayer>;
```

## License

[Apache-2.0](../../LICENSE)
