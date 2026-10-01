/**
 * Live video player preset — `liveVideoFeatures` (adds `liveFeature`; drops `playbackRateFeature`, `qualityFeature`,
 * and `audioTrackFeature`) with a skin that swaps the time slider and time displays for a Live button.
 */
export { liveVideoFeatures } from '@videojs/core/dom';
export { CompatLiveVideoSkinElement } from './compat-skin';
export { LiveVideoPlayerElement, PlayerController } from './player';
export { LiveVideoSkinElement } from './skin';
export { NeutralLiveVideoSkinElement } from './neutral-skin';
