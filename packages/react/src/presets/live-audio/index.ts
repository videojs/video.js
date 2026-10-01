/**
 * Live audio player preset — `audio` minus playback rate, plus the live feature, with a skin that swaps the time slider
 * and time displays for a Live button.
 */
export { liveAudioFeatures } from '@videojs/core/dom';
export { Audio, type AudioProps } from '@/media/audio';
export * from './compat-skin';
export * from './neutral-skin';
export { LiveAudioPlayer, type LiveAudioPlayerProps, usePlayer } from './player';
export * from './skin';
