import * as shared from '../../../core/store/features';
import type { PlayerFeature, PlayerTarget } from '../../player';

/** A platform-neutral feature as the web player sees it: the same object, attached with the web target. */
type WebFeature<Feature> =
  Feature extends PlayerFeature<infer State, infer Derived, infer Config, any>
    ? PlayerFeature<State, Derived, Config, PlayerTarget>
    : never;

// Each web feature is its `@videojs/core` counterpart re-typed for the web target, so web code reads `container` as an
// element. The API stability check treats these `typeof` uses as written out (see `WRITTEN_OUT_VALUE_DIRECTORIES`),
// so the neutral features stay internal.
export const audioTrackFeature: WebFeature<typeof shared.audioTrackFeature> = shared.audioTrackFeature;
export const bufferFeature: WebFeature<typeof shared.bufferFeature> = shared.bufferFeature;
export const errorFeature: WebFeature<typeof shared.errorFeature> = shared.errorFeature;
export const liveFeature: WebFeature<typeof shared.liveFeature> = shared.liveFeature;
export const metadataFeature: WebFeature<typeof shared.metadataFeature> = shared.metadataFeature;
export const playbackFeature: WebFeature<typeof shared.playbackFeature> = shared.playbackFeature;
export const playbackRateFeature: WebFeature<typeof shared.playbackRateFeature> = shared.playbackRateFeature;
export const qualityFeature: WebFeature<typeof shared.qualityFeature> = shared.qualityFeature;
export const sourceFeature: WebFeature<typeof shared.sourceFeature> = shared.sourceFeature;
export const streamTypeFeature: WebFeature<typeof shared.streamTypeFeature> = shared.streamTypeFeature;
export const timeFeature: WebFeature<typeof shared.timeFeature> = shared.timeFeature;
