import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../core/composition/define-behavior';
import { defineFeature } from '../../core/composition/define-feature';
import { canPlayTransmuxedTrack } from '../../media/dom/capabilities';
import { resolveCarriedAudioRenditions } from '../../media/hls/carried-audio';
import { parseMultivariantPlaylist } from '../../media/hls/parse-multivariant';
import { aacCodec } from '../../media/mpeg-ts/codecs/aac';
import { transmuxedSourceBufferMimeCodec } from '../../media/mpeg-ts/transmuxed-track';
import type { setupAudioBufferActors } from '../behaviors/dom/setup-buffer-actors';
import type { ParsePresentation, resolvePresentation } from '../behaviors/resolve-presentation';
import type { resolveAudioTrack } from '../behaviors/resolve-track';
import type { switchAudioTrack } from '../behaviors/track-switching';
import { reportUnsupportedTransmuxedTrackConditions } from '../primitives/report-track-conditions';
import { transmuxPipelinesFor } from '../primitives/transmux-pipelines';

/** The feature composes no behaviors of its own: it reconfigures the audio feature's loader and probes. */
export const behaviors = [] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** The audio feature's behaviors that read the keys this feature sets. */
type ConfigReaders = readonly [
  typeof resolvePresentation,
  typeof setupAudioBufferActors,
  typeof switchAudioTrack,
  typeof resolveAudioTrack,
];

/** The HLS parser, with audio renditions carried in the video segments resolved to their carrier variants. */
const parsePresentation: ParsePresentation = (text, presentation) =>
  resolveCarriedAudioRenditions(parseMultivariantPlaylist(text, presentation));

/** The config defaults the feature contributes. */
export const defaultConfig = {
  parsePresentation,
  // Only the AAC codec: like the audio-only engine ignoring video renditions at
  // the playlist level, this pipeline never assembles the video PES and the
  // composition never bundles the H.264 framing.
  audioMessagePipelines: transmuxPipelinesFor('audio', [aacCodec]),
  canPlayTrack: canPlayTransmuxedTrack,
  reportUnsupportedTrackConditions: reportUnsupportedTransmuxedTrackConditions,
  sourceBufferMimeCodec: transmuxedSourceBufferMimeCodec,
} satisfies Partial<ResolveBehaviorConfig<ConfigReaders>>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * The audio-only counterpart of `mpegTsTransmuxFeature`: plays MPEG-TS audio renditions (an audio-only `.ts` asset, or
 * the audio-only TS alternates of a video asset, or a video asset's default audio carried in its video segments) by
 * transmuxing their AAC to fMP4, with no video codec compiled in. The `hls-audio-mpeg-ts` engine composes it; a
 * composition with video takes `mpegTsTransmuxFeature`. Same placement rules and the same narrow scope, AAC only.
 */
export const mpegTsAudioTransmuxFeature = defineFeature({ behaviors, defaultConfig, initialState });
