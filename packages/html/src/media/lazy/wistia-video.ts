import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Wistia sources with `<wistia-video>`.
 *
 * @internal
 */
export const wistiaVideo: LazyMediaDefinition = {
  match: matchAdapterType('wistia'),
  tag: 'wistia-video',
  load: () => import('../../define/media/wistia-video'),
};
