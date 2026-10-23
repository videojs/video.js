import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Cloudflare Stream sources with `<cloudflare-video>`.
 *
 * @internal
 */
export const cloudflareVideo: LazyMediaDefinition = {
  match: matchAdapterType('cloudflare'),
  tag: 'cloudflare-video',
  load: () => import('../../define/media/cloudflare-video'),
};
