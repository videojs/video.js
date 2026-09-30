'use client';

import { backgroundFeatures, type BackgroundPlayerStore } from '@videojs/core/dom';

import { createPlayer, type CreatePlayerResult } from '../../player/create-player';

/** Preconfigured player with the background video features. */
export const {
  Player: BackgroundVideoPlayer,
  /** Access the background video player store or select a value from it. */
  usePlayer,
}: CreatePlayerResult<BackgroundPlayerStore> = createPlayer({
  features: backgroundFeatures,
  displayName: 'BackgroundVideoPlayer',
});
