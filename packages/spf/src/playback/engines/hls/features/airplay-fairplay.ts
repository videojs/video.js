import { defineFeature } from '../../../../core/composition/define-feature';
import { setupAirPlayFairPlay } from '../../../behaviors/dom/setup-airplay-fairplay';

/**
 * Plays FairPlay-protected content on an AirPlay receiver, negotiating the receiver's keys while a session holds.
 *
 * Requires the `drm` and `keySystems` config, such as `drmFeature` sets; without them it throws once a session starts.
 * Does nothing without a writer of `state.loadingSuspended`, such as `airPlayFeature`, which signals the session. The
 * HLS video engine lists it before `drmFeature`, the order its handoff was verified with on real devices.
 */
export const airPlayFairPlayFeature = defineFeature({
  behaviors: [setupAirPlayFairPlay],
});
