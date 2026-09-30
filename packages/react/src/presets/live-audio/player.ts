'use client';

import { liveAudioFeatures, type LiveAudioPlayerStore } from '@videojs/core/dom';
import type { ComponentProps } from 'react';

import { createPlayer, type CreatePlayerResult } from '../../player/create-player';

/** Preconfigured player with the live audio features. */
export const {
  Player: LiveAudioPlayer,
  /** Access the live audio player store or select a value from it. */
  usePlayer,
}: CreatePlayerResult<LiveAudioPlayerStore> = createPlayer({
  features: liveAudioFeatures,
  displayName: 'LiveAudioPlayer',
});

/** Props accepted by the preconfigured live-audio Player. */
export interface LiveAudioPlayerProps extends ComponentProps<typeof LiveAudioPlayer> {}
