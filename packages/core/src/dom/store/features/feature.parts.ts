import { controlsFeature } from './controls';
import { fullscreenFeature } from './fullscreen';
import { orientationLockFeature } from './orientation-lock';
import { pipFeature } from './pip';
import { remotePlaybackFeature } from './remote-playback';
import {
  audioTrackFeature,
  bufferFeature,
  liveFeature,
  metadataFeature,
  playbackFeature,
  playbackRateFeature,
  qualityFeature,
  sourceFeature,
  streamTypeFeature,
  timeFeature,
} from './shared';
import { textCuesFeature } from './text-cues';
import { textTrackFeature } from './text-track';
import { volumeFeature } from './volume';

export { audioFeatures, backgroundFeatures, videoFeatures } from './presets';

// Short aliases
export {
  audioTrackFeature as audioTrack,
  bufferFeature as buffer,
  controlsFeature as controls,
  fullscreenFeature as fullscreen,
  liveFeature as live,
  metadataFeature as metadata,
  orientationLockFeature as orientationLock,
  pipFeature as pip,
  playbackFeature as playback,
  playbackRateFeature as playbackRate,
  qualityFeature as quality,
  remotePlaybackFeature as remotePlayback,
  sourceFeature as source,
  streamTypeFeature as streamType,
  textCuesFeature as textCues,
  textTrackFeature as textTrack,
  timeFeature as time,
  volumeFeature as volume,
};
