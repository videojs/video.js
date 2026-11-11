import {
  bufferFeature,
  errorFeature,
  metadataFeature,
  playbackFeature,
  playbackRateFeature,
  timeFeature,
} from '@videojs/core';
import type { ComponentProps } from 'react';

import { createPlayer } from './create-player';

/**
 * The feature tuple behind {@link nativeVideoFeatures}. Spelled out, as web's `VideoFeatures` is, because `metadata` and
 * `playbackRate` key their state on symbols `@videojs/core` doesn't export, so an inferred type couldn't be named in
 * the published declarations; `typeof` the imported feature can.
 */
export type NativeVideoFeatures = [
  typeof playbackFeature,
  typeof timeFeature,
  typeof bufferFeature,
  typeof errorFeature,
  typeof metadataFeature,
  typeof playbackRateFeature,
];

/**
 * Features for a react-native video player. Core's platform-neutral features attach to the react-native target as-is,
 * since `ReactNativeMedia` passes the capability checks they open with.
 */
export const nativeVideoFeatures: NativeVideoFeatures = [
  playbackFeature,
  timeFeature,
  bufferFeature,
  errorFeature,
  metadataFeature,
  playbackRateFeature,
];

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
