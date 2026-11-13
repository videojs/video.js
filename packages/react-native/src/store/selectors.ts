import {
  bufferFeature,
  errorFeature,
  metadataFeature,
  playbackFeature,
  playbackRateFeature,
  timeFeature,
} from '@videojs/core';
import { createSelector } from '@videojs/store';

/** Select playback state from a react-native player store. */
export const selectPlayback = createSelector(playbackFeature);

/** Select time state from a react-native player store. */
export const selectTime = createSelector(timeFeature);

/** Select buffer state from a react-native player store. */
export const selectBuffer = createSelector(bufferFeature);

/** Select error state from a react-native player store. */
export const selectError = createSelector(errorFeature);

/** Select content metadata from a react-native player store. */
export const selectMetadata = createSelector(metadataFeature);

/** Select playback-rate state from a react-native player store. */
export const selectPlaybackRate = createSelector(playbackRateFeature);
