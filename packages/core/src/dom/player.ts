import type {
  Media,
  MediaAudioTrackState,
  MediaBufferState,
  MediaControlsState,
  MediaErrorState,
  MediaFullscreenState,
  MediaLiveState,
  MediaPictureInPictureState,
  MediaPlaybackRateState,
  MediaPlaybackState,
  MediaQualityState,
  MediaRemotePlaybackState,
  MediaSourceState,
  MediaTextTrackState,
  MediaTimeState,
  MediaVolumeState,
} from '@videojs/media';
import type { AnySlice, InferSliceSourceState, Slice, Store, UnionSliceState } from '@videojs/store';
import type { CamelCase } from '@videojs/utils/types';

import type { metadataFeature } from './store/features/metadata';

export interface MediaContainer extends HTMLElement {}

export interface PlayerTarget {
  media: Media;
  container: MediaContainer | null;
}

type ConfigValue = string | null | undefined;

type ActionInput<Action> = Action extends (...args: infer Arguments) => unknown
  ? Arguments extends [infer Value]
    ? Value
    : never
  : never;

/**
 * Actions accepting text, including narrower unions such as a string enum, so a feature keeps its own value type on the
 * provider input. `null | undefined` stays mandatory because that is how a provider clears an absent input.
 */
type ConfigActionKey<State> = [State] extends [never]
  ? PropertyKey
  : {
      [Key in keyof State]-?: [ActionInput<State[Key]>] extends [ConfigValue]
        ? [null | undefined] extends [ActionInput<State[Key]>]
          ? Key
          : never
        : never;
    }[keyof State];

type ConfigStateKey<State> = [State] extends [never] ? PropertyKey : keyof State;

/**
 * Maps provider inputs to feature-owned state actions and detach-persistent keys. Pass the feature's source-state type
 * when declaring a config map so both keys are checked and each action accepts nullable text, including absent input.
 */
export type PlayerFeatureConfig<State = never> = Record<
  string,
  {
    /**
     * Source-state action applied when the input changes. It must accept the input's own value type plus `null |
     * undefined`, since an input the author omits arrives as `undefined`. A feature's own public setter qualifies when
     * it accepts that; otherwise point at a private action that does.
     */
    action: ConfigActionKey<State>;
    /** Provider-owned source-state key whose value survives media detach. */
    state: ConfigStateKey<State>;
    /** How an HTML provider element names this input, when the key's own name won't do. */
    html?: {
      /**
       * Attribute name in markup, kebab-case, for a key whose own name is taken on an element. The matching property
       * follows from it, so `content-title` is also `element.contentTitle`. Defaults to the kebab-cased key.
       */
      attribute: string;
    };
  }
>;

export type PlayerFeature<State, Derived = object, Config extends PlayerFeatureConfig = Record<never, never>> = Slice<
  PlayerTarget,
  State,
  Derived
> & {
  config?: Config;
};

export type AnyPlayerFeature = AnySlice<PlayerTarget> & { config?: PlayerFeatureConfig };

type ConfigInputValue<Feature extends AnyPlayerFeature, Entry> = Entry extends { action: infer Action }
  ? Action extends keyof InferSliceSourceState<Feature>
    ? ActionInput<InferSliceSourceState<Feature>[Action]>
    : never
  : never;

export type InferPlayerFeatureConfig<Feature extends AnyPlayerFeature> = Feature extends {
  config?: infer Config extends PlayerFeatureConfig;
}
  ? { [Key in keyof Config]: ConfigInputValue<Feature, Config[Key]> }
  : object;

/** The same inputs under the names they go by on an HTML element. */
export type InferPlayerFeatureHtmlConfig<Feature extends AnyPlayerFeature> = Feature extends {
  config?: infer Config extends PlayerFeatureConfig;
}
  ? {
      [Key in keyof Config as HtmlPropertyKey<Key, Config[Key]>]: ConfigInputValue<Feature, Config[Key]>;
    }
  : object;

type HtmlPropertyKey<Key, Entry> = Entry extends { html: { attribute: infer Attribute extends string } }
  ? CamelCase<Attribute>
  : Key;

/** Merge a union of per-feature config objects into one flat object type. */
type MergedConfig<Union> = (Union extends any ? (config: Union) => void : never) extends (config: infer Merged) => void
  ? { [Key in keyof Merged]: Merged[Key] } & {}
  : never;

export type UnionPlayerConfig<Features extends readonly AnyPlayerFeature[]> = Features extends readonly []
  ? object
  : MergedConfig<InferPlayerFeatureConfig<Features[number]>>;

export type UnionPlayerHtmlConfig<Features extends readonly AnyPlayerFeature[]> = Features extends readonly []
  ? object
  : MergedConfig<InferPlayerFeatureHtmlConfig<Features[number]>>;

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
  PlayerFeature<MediaPlaybackRateState>,
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
  PlayerFeature<MediaTextTrackState>,
  PlayerFeature<MediaErrorState>,
  typeof metadataFeature,
];

export type AudioFeatures = [
  PlayerFeature<MediaPlaybackState>,
  PlayerFeature<MediaPlaybackRateState>,
  PlayerFeature<MediaVolumeState>,
  PlayerFeature<MediaTimeState>,
  PlayerFeature<MediaSourceState>,
  PlayerFeature<MediaBufferState>,
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
  PlayerFeature<MediaTextTrackState>,
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
  PlayerFeature<MediaErrorState>,
  PlayerFeature<MediaLiveState>,
  typeof metadataFeature,
];

export type VideoPlayerStore = PlayerStore<VideoFeatures>;

export type AudioPlayerStore = PlayerStore<AudioFeatures>;

export type BackgroundPlayerStore = PlayerStore<BackgroundFeatures>;

export type LiveVideoPlayerStore = PlayerStore<LiveVideoFeatures>;

export type LiveAudioPlayerStore = PlayerStore<LiveAudioFeatures>;
