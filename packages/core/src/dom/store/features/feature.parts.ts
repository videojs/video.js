import { audioTrackFeature } from '../../../core/store/features/audio-track';
import { bufferFeature } from '../../../core/store/features/buffer';
import { liveFeature } from '../../../core/store/features/live';
import { metadataFeature } from '../../../core/store/features/metadata';
import { playbackFeature } from '../../../core/store/features/playback';
import { playbackRateFeature } from '../../../core/store/features/playback-rate';
import { qualityFeature } from '../../../core/store/features/quality';
import { sourceFeature } from '../../../core/store/features/source';
import { streamTypeFeature } from '../../../core/store/features/stream-type';
import { timeFeature } from '../../../core/store/features/time';
import { controlsFeature } from './controls';
import { fullscreenFeature } from './fullscreen';
import { orientationLockFeature } from './orientation-lock';
import { pipFeature } from './pip';
import { remotePlaybackFeature } from './remote-playback';
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
  textTrackFeature as textTrack,
  timeFeature as time,
  volumeFeature as volume,
};
