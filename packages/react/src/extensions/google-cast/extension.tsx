'use client';

import { GoogleCastExtension, type GoogleCastExtensionProps } from '@videojs/google-cast';
import type { ReactNode } from 'react';

import { usePlayerExtension } from '../../utils/use-player-extension';
import { useSyncProps } from '../../utils/use-sync-props';

export type GoogleCastProps = Partial<GoogleCastExtensionProps>;

/**
 * Adds the Google Cast extension to the surrounding player.
 *
 * Renders nothing — place it inside the Player and it follows whatever media the player attaches, a plain `<Video />`
 * included.
 *
 * @example
 *   ```tsx
 *   <Player>
 *     <Video src="https://example.com/video.mp4" />
 *     <GoogleCast receiver="YOUR_APP_ID" />
 *   </Player>;
 *   ```;
 */
export function GoogleCast(props: GoogleCastProps): ReactNode {
  const extension = usePlayerExtension(GoogleCastExtension);

  useSyncProps(extension, props, GoogleCastExtension.defaultProps);

  return null;
}

export namespace GoogleCast {
  export type Props = GoogleCastProps;
}
