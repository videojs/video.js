import { defineExternalSignals } from '../../../../core/composition/define-external-signals';
import { defineFeature } from '../../../../core/composition/define-feature';
import { attachMediaSourceAsSourceElement } from '../../../../media/dom/mse/mediasource-setup';
import { type DisableRemotePlaybackState, setupAirPlay } from '../../../behaviors/dom/airplay';

/**
 * Plays to AirPlay receivers (WebKit only; inert elsewhere), unless the user sets `disableRemotePlayback`. Attaches the
 * MediaSource through a `<source>` element, which the native fallback the receiver plays requires.
 */
export const airPlayFeature = defineFeature({
  behaviors: [setupAirPlay, defineExternalSignals<DisableRemotePlaybackState>()({ state: ['disableRemotePlayback'] })],
  defaultConfig: { attachMediaSource: attachMediaSourceAsSourceElement },
});
