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
import type { PlayerFeature, PlayerTarget } from '../../player';

/** A platform-neutral feature as the web player sees it: the same object, attached with the web target. */
type WebFeature<Feature> =
  Feature extends PlayerFeature<infer State, infer Derived, infer Config, any>
    ? PlayerFeature<State, Derived, Config, PlayerTarget>
    : never;

/** Re-type a neutral feature for the web target. Identity at runtime. */
function asWebFeature<Feature>(feature: Feature): WebFeature<Feature> {
  // SAFETY: a feature that reads less than the web target provides attaches to it unchanged.
  return feature as WebFeature<Feature>;
}

// Each web feature is its `@videojs/core` counterpart re-typed for the web target, so web code reads `container` as an
// element. The type is inferred so the published declaration spells it out rather than naming the neutral export, which
// would make that export part of the web packages' public API.
export const audioTrackFeature = asWebFeature(shared.audioTrackFeatureBase);
export const bufferFeature = asWebFeature(shared.bufferFeatureBase);
export const errorFeature = asWebFeature(shared.errorFeatureBase);
export const liveFeature = asWebFeature(shared.liveFeatureBase);
export const playbackFeature = asWebFeature(shared.playbackFeatureBase);
export const qualityFeature = asWebFeature(shared.qualityFeatureBase);
export const sourceFeature = asWebFeature(shared.sourceFeatureBase);
export const streamTypeFeature = asWebFeature(shared.streamTypeFeatureBase);
export const timeFeature = asWebFeature(shared.timeFeatureBase);

// These two can't be inferred: their types use module-private symbols that only their own modules can name. Their
// modules export named types instead, which these declarations use.
export const metadataFeature: PlayerFeature<
  MetadataSourceState,
  MetadataDerivedState,
  MetadataFeatureConfig,
  PlayerTarget
> = shared.metadataFeatureBase;
export const playbackRateFeature: PlayerFeature<
  PlaybackRateSourceState,
  PlaybackRateDerivedState,
  PlaybackRateFeatureConfig,
  PlayerTarget
> = shared.playbackRateFeatureBase;

export type {
  MetadataDerivedState,
  MetadataFeatureConfig,
  MetadataSourceState,
  PlaybackRateDerivedState,
  PlaybackRateFeatureConfig,
  PlaybackRateSourceState,
};
