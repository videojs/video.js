'use client';

import { liveVideoFeatures, type LiveVideoPlayerStore } from '@videojs/core/dom';
import type { ComponentProps } from 'react';

import { createPlayer, type CreatePlayerResult } from '../../player/create-player';

/** Preconfigured player with the live video features. */
export const {
  Player: LiveVideoPlayer,
  /** Access the live video player store or select a value from it. */
  usePlayer,
}: CreatePlayerResult<LiveVideoPlayerStore> = createPlayer({
  features: liveVideoFeatures,
  displayName: 'LiveVideoPlayer',
});

/** Props accepted by the preconfigured live-video Player. */
export interface LiveVideoPlayerProps extends ComponentProps<typeof LiveVideoPlayer> {}
