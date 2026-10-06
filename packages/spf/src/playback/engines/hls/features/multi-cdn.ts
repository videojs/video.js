import { defineFeature } from '../../../../core/composition/define-feature';
import { deriveCdnPriority } from '../../../behaviors/derive-cdn-priority';
import { setupFailoverMonitor } from '../../../behaviors/setup-failover-monitor';

/**
 * Plays sources served from several CDNs (redundant streams): keeps every track type on one CDN, and fails over to the
 * next when a CDN fails, returning to it once its cooldown lapses. Single-CDN sources pass through unchanged.
 */
export const multiCdnFeature = defineFeature({
  behaviors: [
    // Session-level CDN priority. Owns `cdnPriority`; `track-switching`'s
    // preferActiveCdn scope reads it so every type stays on one CDN.
    deriveCdnPriority,
    // CDN failover cooldown: owns the expiry half of failover — watches
    // `failedCdns` (tripped directly by track resolution on a failed
    // media-playlist fetch) and removes each CDN once its cooldown lapses.
    setupFailoverMonitor,
  ],
});
