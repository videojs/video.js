import type {
  MediaAudioTrackState,
  MediaBufferState,
  MediaErrorState,
  MediaLiveState,
  MediaPlaybackState,
  MediaQualityState,
  MediaSourceState,
  MediaStreamTypeState,
  MediaTimeState,
} from '@videojs/media';

import * as shared from '../../../core/store/features';
import type {
  MetadataDerivedState,
  MetadataFeatureConfig,
  MetadataSourceState,
} from '../../../core/store/features/metadata';
import type {
  PlaybackRateDerivedState,
  PlaybackRateFeatureConfig,
  PlaybackRateSourceState,
} from '../../../core/store/features/playback-rate';
import type { PlayerFeature, PlayerFeatureConfig, PlayerTarget } from '../../player';

// The platform-neutral features, re-typed for the web target so web code reads `container` as an element. Each is the
// same object as its `@videojs/core` counterpart. The types are spelled out rather than derived with `typeof`, which
// would make the neutral exports part of the web packages' public types.

type WebFeature<State, Derived = object, Config extends PlayerFeatureConfig = Record<never, never>> = PlayerFeature<
  State,
  Derived,
  Config,
  PlayerTarget
>;

export const audioTrackFeature: WebFeature<MediaAudioTrackState> = shared.audioTrackFeature;
export const bufferFeature: WebFeature<MediaBufferState> = shared.bufferFeature;
export const errorFeature: WebFeature<MediaErrorState> = shared.errorFeature;
export const liveFeature: WebFeature<MediaLiveState> = shared.liveFeature;
export const metadataFeature: WebFeature<MetadataSourceState, MetadataDerivedState, MetadataFeatureConfig> =
  shared.metadataFeature;
export const playbackFeature: WebFeature<MediaPlaybackState> = shared.playbackFeature;
export const playbackRateFeature: WebFeature<
  PlaybackRateSourceState,
  PlaybackRateDerivedState,
  PlaybackRateFeatureConfig
> = shared.playbackRateFeature;
export const qualityFeature: WebFeature<MediaQualityState> = shared.qualityFeature;
export const sourceFeature: WebFeature<MediaSourceState> = shared.sourceFeature;
export const streamTypeFeature: WebFeature<MediaStreamTypeState> = shared.streamTypeFeature;
export const timeFeature: WebFeature<MediaTimeState> = shared.timeFeature;

export type {
  MetadataDerivedState,
  MetadataFeatureConfig,
  MetadataSourceState,
  PlaybackRateDerivedState,
  PlaybackRateFeatureConfig,
  PlaybackRateSourceState,
};
