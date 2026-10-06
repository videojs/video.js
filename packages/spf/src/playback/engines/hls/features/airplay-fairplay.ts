import { defineFeature } from '../../../../core/composition/define-feature';
import { setupAirPlayFairPlay } from '../../../behaviors/dom/setup-airplay-fairplay';

/**
 * Plays FairPlay-protected content on an AirPlay receiver, negotiating the receiver's keys while a session holds.
 * Compose it with both `airPlayFeature` and `drmFeature`, listed immediately before `drmFeature`: when a session ends,
 * list order is what releases the receiver's MediaKeys before `setupMediaKeys` attaches MSE's afresh.
 */
export const airPlayFairPlayFeature = defineFeature({
  behaviors: [setupAirPlayFairPlay],
});
