import type {
  AudioFeatures,
  BackgroundFeatures,
  LiveAudioFeatures,
  LiveVideoFeatures,
  VideoFeatures,
} from '../../player';
import { audioTrackFeature } from './audio-track';
import { bufferFeature } from './buffer';
import { controlsFeature } from './controls';
import { errorFeature } from './error';
import { fullscreenFeature } from './fullscreen';
import { liveFeature } from './live';
import { metadataFeature } from './metadata';
import { pipFeature } from './pip';
import { playbackFeature } from './playback';
import { playbackRateFeature } from './playback-rate';
import { qualityFeature } from './quality';
import { remotePlaybackFeature } from './remote-playback';
import { sourceFeature } from './source';
import { textCuesFeature } from './text-cues';
import { textTrackFeature } from './text-track';
import { timeFeature } from './time';
import { volumeFeature } from './volume';

export const videoFeatures: VideoFeatures = [
  playbackFeature,
  playbackRateFeature,
  qualityFeature,
  audioTrackFeature,
  volumeFeature,
  timeFeature,
  sourceFeature,
  bufferFeature,
  fullscreenFeature,
  pipFeature,
  remotePlaybackFeature,
  controlsFeature,
  textTrackFeature,
  textCuesFeature,
  errorFeature,
  metadataFeature,
];

export const audioFeatures: AudioFeatures = [
  playbackFeature,
  playbackRateFeature,
  volumeFeature,
  timeFeature,
  sourceFeature,
  bufferFeature,
  textTrackFeature,
  textCuesFeature,
  errorFeature,
  metadataFeature,
];

// TODO: Add background video features (e.g., playback, source, buffer)
export const backgroundFeatures: BackgroundFeatures = [];

/**
 * Features for a live video player. Mirrors {@link videoFeatures} but drops {@link playbackRateFeature} (not meaningful
 * for live) along with {@link qualityFeature} and {@link audioTrackFeature}, and adds {@link liveFeature} so store
 * consumers can read `liveEdgeStart` and `targetLiveWindow`.
 */
export const liveVideoFeatures: LiveVideoFeatures = [
  playbackFeature,
  volumeFeature,
  timeFeature,
  sourceFeature,
  bufferFeature,
  fullscreenFeature,
  pipFeature,
  remotePlaybackFeature,
  controlsFeature,
  textTrackFeature,
  textCuesFeature,
  errorFeature,
  liveFeature,
  metadataFeature,
];

/**
 * Features for a live audio player. Mirrors {@link audioFeatures} but drops {@link playbackRateFeature} (not meaningful
 * for live) and adds {@link liveFeature} so store consumers can read `liveEdgeStart` and `targetLiveWindow`.
 */
export const liveAudioFeatures: LiveAudioFeatures = [
  playbackFeature,
  volumeFeature,
  timeFeature,
  sourceFeature,
  bufferFeature,
  textTrackFeature,
  textCuesFeature,
  errorFeature,
  liveFeature,
  metadataFeature,
];
