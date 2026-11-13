import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Wistia sources with `WistiaVideo`.
 *
 * @internal
 */
export const wistiaVideo: LazyMediaDefinition = {
  match: matchAdapterType('wistia'),
  source: true,
  load: () => import('../wistia-video').then((m) => m.WistiaVideo),
};
