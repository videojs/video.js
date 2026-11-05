import * as shared from '../../../core/store/features';
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
export const audioTrackFeature = asWebFeature(shared.audioTrackFeature);
export const bufferFeature = asWebFeature(shared.bufferFeature);
export const errorFeature = asWebFeature(shared.errorFeature);
export const liveFeature = asWebFeature(shared.liveFeature);
export const playbackFeature = asWebFeature(shared.playbackFeature);
export const qualityFeature = asWebFeature(shared.qualityFeature);
export const sourceFeature = asWebFeature(shared.sourceFeature);
export const streamTypeFeature = asWebFeature(shared.streamTypeFeature);
export const timeFeature = asWebFeature(shared.timeFeature);
export const metadataFeature = asWebFeature(shared.metadataFeature);
export const playbackRateFeature = asWebFeature(shared.playbackRateFeature);
