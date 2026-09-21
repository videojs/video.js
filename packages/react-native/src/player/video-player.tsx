import { combine, createStore } from '@videojs/store';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { ReactNativeMedia } from '../media/react-native-media';
import type { NativePlayerTarget } from '../store/native-player-target';
import { nativePlaybackFeature } from '../store/playback';
import { useDestroy } from '../utils/use-destroy';
import { NativePlayerContextProvider } from './context';

export interface VideoPlayerProps {
  children?: ReactNode | undefined;
}

/**
 * Provides a player store and media adapter to its subtree.
 *
 * Renders no host element of its own, matching the web `Player` — layout belongs to the skin's container. Compose it
 * the same way as the web preset:
 *
 * ```tsx
 * <VideoPlayer>
 *   <VideoSkin>
 *     <Video src="…" />
 *   </VideoSkin>
 * </VideoPlayer>;
 * ```
 *
 * A single concrete component rather than a `createPlayer({ features })` factory: one feature set does not yet justify
 * the indirection. Generalizing means lifting the `combine(...)` call into a factory and returning a typed `usePlayer`
 * alongside the component, as `packages/react/src/player/create-player.tsx` does.
 */
export function VideoPlayer({ children }: VideoPlayerProps): ReactNode {
  // Both created during render, not in an effect, so `media.handle` is already non-null on the first render and the
  // surface never has a null pass to render around.
  const [media] = useState(() => new ReactNativeMedia());
  const [store] = useState(() => createStore<NativePlayerTarget>()(combine(nativePlaybackFeature)));

  useDestroy(store);
  useDestroy(media);

  useEffect(() => store.attach({ media, container: null }), [store, media]);

  const value = useMemo(() => ({ store, media }), [store, media]);

  return <NativePlayerContextProvider value={value}>{children}</NativePlayerContextProvider>;
}

export namespace VideoPlayer {
  export type Props = VideoPlayerProps;
}
