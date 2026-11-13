import { matchAdapterType } from '@videojs/media';

import type { LazyMediaDefinition } from '../lazy-media';

/**
 * Plays Cloudflare Stream sources with `CloudflareVideo`.
 *
 * @internal
 */
export const cloudflareVideo: LazyMediaDefinition = {
  match: matchAdapterType('cloudflare'),
  source: true,
  load: () => import('../cloudflare-video').then((m) => m.CloudflareVideo),
};
