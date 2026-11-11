import { playbackFeature } from '@videojs/core';
import { createSelector } from '@videojs/store';

/** Select playback state from a react-native player store. */
export const selectPlayback = createSelector(playbackFeature);
