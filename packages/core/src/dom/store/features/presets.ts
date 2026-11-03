import { audioTrackFeature } from '../../../core/store/features/audio-track';
import { bufferFeature } from '../../../core/store/features/buffer';
import { errorFeature } from '../../../core/store/features/error';
import { liveFeature } from '../../../core/store/features/live';
import { metadataFeature } from '../../../core/store/features/metadata';
import { playbackFeature } from '../../../core/store/features/playback';
import { playbackRateFeature } from '../../../core/store/features/playback-rate';
import { qualityFeature } from '../../../core/store/features/quality';
import { sourceFeature } from '../../../core/store/features/source';
import { timeFeature } from '../../../core/store/features/time';
import type {
  AudioFeatures,
  BackgroundFeatures,
  LiveAudioFeatures,
  LiveVideoFeatures,
  VideoFeatures,
} from '../../player';
import { controlsFeature } from './controls';
import { fullscreenFeature } from './fullscreen';
import { pipFeature } from './pip';
import { remotePlaybackFeature } from './remote-playback';
import { textTrackFeature } from './text-track';
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
  errorFeature,
  liveFeature,
  metadataFeature,
];
