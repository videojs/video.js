import type { ComponentProps } from 'react';

import { nativePlaybackFeature } from '../store/playback';
import { createPlayer } from './create-player';

/**
 * Features for a react-native video player.
 *
 * A plain array, not `as const` — `NativePlayerStore` takes a mutable array, mirroring web's `PlayerStore`, and would
 * reject a readonly tuple.
 */
export const nativeVideoFeatures = [nativePlaybackFeature];

/**
 * Preconfigured player with the react-native video features.
 *
 * Compose it the same way as the web preset:
 *
 * ```tsx
 * <VideoPlayer>
 *   <VideoSkin>
 *     <Video src="…" />
 *   </VideoSkin>
 * </VideoPlayer>;
 * ```
 */
export const {
  Player: VideoPlayer,
  /** Access the video player store, or select a typed value from it. */
  usePlayer,
  /** Access the video player's media adapter. */
  useMedia,
} = createPlayer({ features: nativeVideoFeatures, displayName: 'VideoPlayer' });

/** Props accepted by the preconfigured video Player. */
export interface VideoPlayerProps extends ComponentProps<typeof VideoPlayer> {}
