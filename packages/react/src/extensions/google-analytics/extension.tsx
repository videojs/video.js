'use client';

import {
  GoogleAnalyticsExtension,
  type GoogleAnalyticsMetadata,
  type GoogleAnalyticsProps as GoogleAnalyticsPropsBase,
} from '@videojs/google-analytics';
import type { ReactNode } from 'react';

import { usePlayerExtension } from '../../utils/use-player-extension';
import { useSyncProps } from '../../utils/use-sync-props';

export type GoogleAnalyticsProps = GoogleAnalyticsPropsBase;

/**
 * Adds the Google Analytics 4 (GA4) telemetry extension to the surrounding player.
 *
 * Renders nothing — place it inside the Player and it follows whatever media the player attaches, dispatching standard
 * GA4 video events (`video_start`, `video_progress`, `video_complete`) to `window.dataLayer`.
 *
 * @example
 *   ```tsx
 *   <Player>
 *     <Video src="https://example.com/video.mp4" />
 *     <GoogleAnalytics metadata={{ video_title: 'My Video' }} />
 *   </Player>;
 *   ```;
 */
export function GoogleAnalytics(props: GoogleAnalyticsProps): ReactNode {
  const extension = usePlayerExtension(GoogleAnalyticsExtension);

  useSyncProps(extension, props, GoogleAnalyticsExtension.defaultProps);

  return null;
}

export namespace GoogleAnalytics {
  export type Props = GoogleAnalyticsProps;
  export type Metadata = GoogleAnalyticsMetadata;
}
