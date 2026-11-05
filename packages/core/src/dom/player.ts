import type {
  Media,
  MediaAudioTrackState,
  MediaBufferState,
  MediaControlsState,
  MediaErrorState,
  MediaFullscreenState,
  MediaLiveState,
  MediaPictureInPictureState,
  MediaPlaybackState,
  MediaQualityState,
  MediaRemotePlaybackState,
  MediaSourceState,
  MediaTimeState,
  MediaVolumeState,
} from '@videojs/media';
import type { Store, UnionSliceState } from '@videojs/store';

import type { AnyPlayerFeature, PlayerFeature, UnionPlayerConfig, UnionPlayerHtmlConfig } from '../core/player';
import type { metadataFeature, playbackRateFeature } from './store/features/shared';
import type { textCuesFeature } from './store/features/text-cues';
import type { textTrackFeature } from './store/features/text-track';

export interface MediaContainer extends HTMLElement {}

export interface PlayerTarget {
  media: Media;
  container: MediaContainer | null;
}

export type {
  AnyPlayerFeature,
  InferPlayerFeatureConfig,
  InferPlayerFeatureHtmlConfig,
  PlayerFeature,
  PlayerFeatureConfig,
  PlayerMediaTarget,
  UnionPlayerConfig,
  UnionPlayerHtmlConfig,
} from '../core/player';

declare const PLAYER_CONFIG: unique symbol;
declare const PLAYER_HTML_CONFIG: unique symbol;

export type PlayerStore<Features extends AnyPlayerFeature[] = []> = Store<PlayerTarget, UnionSliceState<Features>> & {
  readonly [PLAYER_CONFIG]?: UnionPlayerConfig<Features>;
  readonly [PLAYER_HTML_CONFIG]?: UnionPlayerHtmlConfig<Features>;
};

export type InferPlayerConfig<Store> = Store extends {
  readonly [PLAYER_CONFIG]?: infer Config;
}
  ? Config
  : object;

export type InferPlayerHtmlConfig<Store> = Store extends {
  readonly [PLAYER_HTML_CONFIG]?: infer Config;
}
  ? Config
  : object;

export type AnyPlayerStore = Store<PlayerTarget, object>;

// ----------------------------------------
// Feature Presets
// ----------------------------------------

export type VideoFeatures = [
  PlayerFeature<MediaPlaybackState>,
  typeof playbackRateFeature,
  PlayerFeature<MediaQualityState>,
  PlayerFeature<MediaAudioTrackState>,
  PlayerFeature<MediaVolumeState>,
  PlayerFeature<MediaTimeState>,
  PlayerFeature<MediaSourceState>,
  PlayerFeature<MediaBufferState>,
  PlayerFeature<MediaFullscreenState>,
  PlayerFeature<MediaPictureInPictureState>,
  PlayerFeature<MediaRemotePlaybackState>,
  PlayerFeature<MediaControlsState>,
  typeof textTrackFeature,
  typeof textCuesFeature,
  PlayerFeature<MediaErrorState>,
  typeof metadataFeature,
];

export type AudioFeatures = [
  PlayerFeature<MediaPlaybackState>,
  typeof playbackRateFeature,
  PlayerFeature<MediaVolumeState>,
  PlayerFeature<MediaTimeState>,
  PlayerFeature<MediaSourceState>,
  PlayerFeature<MediaBufferState>,
  typeof textTrackFeature,
  typeof textCuesFeature,
  PlayerFeature<MediaErrorState>,
  typeof metadataFeature,
];

// TODO: Define background video features (e.g., playback, source, buffer)
export type BackgroundFeatures = [];

/**
 * Features for a live video player. Mirrors {@link VideoFeatures} but drops the playback-rate feature (not meaningful
 * for live) and adds `PlayerFeature<MediaLiveState>` so the store exposes `liveEdgeStart` and `targetLiveWindow`.
 */
export type LiveVideoFeatures = [
  PlayerFeature<MediaPlaybackState>,
  PlayerFeature<MediaVolumeState>,
  PlayerFeature<MediaTimeState>,
  PlayerFeature<MediaSourceState>,
  PlayerFeature<MediaBufferState>,
  PlayerFeature<MediaFullscreenState>,
  PlayerFeature<MediaPictureInPictureState>,
  PlayerFeature<MediaRemotePlaybackState>,
  PlayerFeature<MediaControlsState>,
  typeof textTrackFeature,
  typeof textCuesFeature,
  PlayerFeature<MediaErrorState>,
  PlayerFeature<MediaLiveState>,
  typeof metadataFeature,
];

/**
 * Features for a live audio player. Mirrors {@link AudioFeatures} but drops the playback-rate feature (not meaningful
 * for live) and adds `PlayerFeature<MediaLiveState>` so the store exposes `liveEdgeStart` and `targetLiveWindow`.
 */
export type LiveAudioFeatures = [
  PlayerFeature<MediaPlaybackState>,
  PlayerFeature<MediaVolumeState>,
  PlayerFeature<MediaTimeState>,
  PlayerFeature<MediaSourceState>,
  PlayerFeature<MediaBufferState>,
  typeof textTrackFeature,
  typeof textCuesFeature,
  PlayerFeature<MediaErrorState>,
  PlayerFeature<MediaLiveState>,
  typeof metadataFeature,
];

export type VideoPlayerStore = PlayerStore<VideoFeatures>;

export type AudioPlayerStore = PlayerStore<AudioFeatures>;

export type BackgroundPlayerStore = PlayerStore<BackgroundFeatures>;

export type LiveVideoPlayerStore = PlayerStore<LiveVideoFeatures>;

export type LiveAudioPlayerStore = PlayerStore<LiveAudioFeatures>;
