import { matchAdapterType, matchHls } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

const matchFile = matchAdapterType('audio', 'video');
const matchNativeHls = matchHls('native');

/** Plays audio and video files in a native `<audio>`, and HLS where it plays natively, with no engine to load. */
export const audio: LazyMediaDefinition = {
  match: (source) => matchFile(source) || matchNativeHls(source),
  tag: 'audio',
};
