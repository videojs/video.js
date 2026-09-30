'use client';

import { videoFeatures, type VideoPlayerStore } from '@videojs/core/dom';
import type { ComponentProps } from 'react';

import { createPlayer, type CreatePlayerResult } from '../../player/create-player';

/** Preconfigured player with the standard video features. */
export const {
  Player: VideoPlayer,
  /** Access the standard video player store or select a value from it. */
  usePlayer,
}: CreatePlayerResult<VideoPlayerStore> = createPlayer({ features: videoFeatures, displayName: 'VideoPlayer' });

/** Props accepted by the preconfigured video Player. */
export interface VideoPlayerProps extends ComponentProps<typeof VideoPlayer> {}
