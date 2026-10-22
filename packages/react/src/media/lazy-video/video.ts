import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';
import { Video } from '../video';

/** Plays video and audio files in a native `<video>`, with no engine to load. */
export const video: LazyMediaDefinition = {
  match: matchAdapterType('video', 'audio'),
  fallback: true,
  component: Video,
};
