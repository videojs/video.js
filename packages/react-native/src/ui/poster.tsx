import { PosterCore, type PosterImageLoadState } from '@videojs/core';
import { isUndefined } from '@videojs/utils/predicate';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Animated, type ImageProps, StyleSheet } from 'react-native';

import { usePlayer } from '../player/context';
import { selectMetadata, selectPlayback } from '../store/selectors';
import { useFadePresence } from './utils/use-fade-presence';

export interface PosterProps extends Omit<ImageProps, 'source' | 'onLoad' | 'onError'> {}

/** How the image for one `src` is faring, so a stale result never applies to a new source. */
interface PosterImageLoad {
  src: string;
  state: Exclude<PosterImageLoadState, 'none' | 'loading'>;
}

/**
 * Shows the poster image until playback starts, from the player's `poster` prop or the media's metadata.
 *
 * Fades in once the image has decoded, so a slow or failed load never shows a partial image, and fades out on start.
 */
export function Poster({ style, resizeMode = 'contain', ...props }: PosterProps): ReactNode {
  const playback = usePlayer(selectPlayback);
  const metadata = usePlayer(selectMetadata);
  const [core] = useState(() => new PosterCore());
  const [load, setLoad] = useState<PosterImageLoad | null>(null);

  const ready = !isUndefined(playback) && !isUndefined(metadata);

  // Derived from `src` rather than `onLoadStart`, whose order against `onLoad` is not guaranteed for cached images.
  if (ready) {
    const src = metadata.poster;

    core.setMedia({ started: playback.started, poster: src });
    core.setImageLoadState(!src ? 'none' : load?.src === src ? load.state : 'loading');
  }

  const state = ready ? core.getState() : null;
  const { opacity, rendered } = useFadePresence(Boolean(state?.visible && state.loaded));
  if (!state?.src || (!state.visible && !rendered)) return null;

  return (
    <Animated.Image
      source={{ uri: state.src }}
      resizeMode={resizeMode}
      pointerEvents="none"
      aria-hidden
      onLoad={() => setLoad({ src: state.src, state: 'loaded' })}
      onError={() => setLoad({ src: state.src, state: 'error' })}
      style={[StyleSheet.absoluteFill, { opacity }, style]}
      {...props}
    />
  );
}

export namespace Poster {
  export type Props = PosterProps;
}
