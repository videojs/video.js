'use client';

import { FCastExtension, type FCastExtensionProps } from '@videojs/fcast';
import type { ReactNode } from 'react';

import { usePlayerExtension } from '../../utils/use-player-extension';
import { useSyncProps } from '../../utils/use-sync-props';

/** Configuration for the application-provided FCast sender. @experimental */
export type FCastProps = Partial<FCastExtensionProps>;

/**
 * Adds FCast to the surrounding player. Renders nothing and follows the player's media. The application supplies a
 * sender that handles receiver discovery, selection, and transport.
 *
 * @example
 *   ```tsx
 *   <VideoPlayer>
 *     <Video src="https://example.com/video.mp4" />
 *     <FCast sender={sender} />
 *     <VideoSkin />
 *   </VideoPlayer>;
 *   ```;
 *
 * @experimental
 */
export function FCast(props: FCastProps): ReactNode {
  const extension = usePlayerExtension(FCastExtension);

  useSyncProps(extension, props, FCastExtension.defaultProps);

  return null;
}

/** @experimental */
export namespace FCast {
  export type Props = FCastProps;
}
