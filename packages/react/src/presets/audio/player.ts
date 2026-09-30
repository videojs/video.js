'use client';

import { audioFeatures, type AudioPlayerStore } from '@videojs/core/dom';
import type { ComponentProps } from 'react';

import { createPlayer, type CreatePlayerResult } from '../../player/create-player';

/** Preconfigured player with the standard audio features. */
export const {
  Player: AudioPlayer,
  /** Access the standard audio player store or select a value from it. */
  usePlayer,
}: CreatePlayerResult<AudioPlayerStore> = createPlayer({ features: audioFeatures, displayName: 'AudioPlayer' });

/** Props accepted by the preconfigured audio Player. */
export interface AudioPlayerProps extends ComponentProps<typeof AudioPlayer> {}
