'use client';

import { MediaWooferExtension, type MediaWooferExtensionProps } from '@videojs/media-woofer';
import type { ReactNode } from 'react';

import { usePlayerExtension } from '../../utils/use-player-extension';
import { useSyncProps } from '../../utils/use-sync-props';

/** @experimental */
export type MediaWooferProps = Partial<MediaWooferExtensionProps>;

/**
 * Adds the media woofer extension to the surrounding player: the media shakes along with the bass, and phones that
 * support vibration vibrate with it.
 *
 * Renders nothing — place it inside the Player and it follows whatever media the player attaches. Cross-origin media
 * needs `crossOrigin` (and CORS headers) for its sound to be read.
 *
 * @example
 *   ```tsx
 *   <Player>
 *     <Video src="https://example.com/video.mp4" crossOrigin="" />
 *     <MediaWoofer />
 *   </Player>;
 *   ```;
 *
 * @experimental
 */
export function MediaWoofer(props: MediaWooferProps): ReactNode {
  const extension = usePlayerExtension(MediaWooferExtension);

  useSyncProps(extension, props, MediaWooferExtension.defaultProps);

  return null;
}

/** @experimental */
export namespace MediaWoofer {
  export type Props = MediaWooferProps;
}
