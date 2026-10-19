import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../core/composition/define-behavior';
import { defineFeature } from '../../core/composition/define-feature';
import { canPlayTransmuxedTrack } from '../../media/dom/capabilities';
import { aacCodec } from '../../media/mpeg-ts/codecs/aac';
import { avcCodec } from '../../media/mpeg-ts/codecs/avc';
import { transmuxedSourceBufferMimeCodec } from '../../media/mpeg-ts/transmuxed-track';
import type { setupAudioBufferActors, setupVideoBufferActors } from '../behaviors/dom/setup-buffer-actors';
import type { resolveAudioTrack, resolveVideoTrack } from '../behaviors/resolve-track';
import type { switchAudioTrack, switchVideoTrack } from '../behaviors/track-switching';
import { reportUnsupportedTransmuxedTrackConditions } from '../primitives/report-track-conditions';
import { transmuxPipelinesFor } from '../primitives/transmux-pipelines';

/** The feature composes no behaviors of its own: it reconfigures the track features' loaders and probes. */
export const behaviors = [] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** The track features' behaviors that read the keys this feature sets. */
type ConfigReaders = readonly [
  typeof setupVideoBufferActors,
  typeof setupAudioBufferActors,
  typeof switchVideoTrack,
  typeof switchAudioTrack,
  typeof resolveVideoTrack,
  typeof resolveAudioTrack,
];

/** The config defaults the feature contributes. */
export const defaultConfig = {
  // The loader pipelines: fetch → transmux → relocation discover/stamp → dispatch. The
  // video SourceBuffer carries the muxed AAC too (dropped when the track declares no
  // audio codec); fMP4 segments pass through the transmux step untouched.
  videoMessagePipelines: transmuxPipelinesFor('video', [avcCodec, aacCodec]),
  audioMessagePipelines: transmuxPipelinesFor('audio', [aacCodec]),
  // The container-aware seams see a TS rendition as the fMP4 it becomes: the
  // probe no longer prunes it, the reporter no longer calls it an unsupported
  // format, and each SourceBuffer is created with the MIME its bytes will carry.
  canPlayTrack: canPlayTransmuxedTrack,
  reportUnsupportedTrackConditions: reportUnsupportedTransmuxedTrackConditions,
  sourceBufferMimeCodec: transmuxedSourceBufferMimeCodec,
} satisfies Partial<ResolveBehaviorConfig<ConfigReaders>>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Plays HLS content packaged as MPEG-TS (H.264 + AAC) by transmuxing each segment to fMP4 on the client before it
 * reaches the SourceBuffer. fMP4 and CMAF content plays through it unchanged. No shipped HLS engine composes it: its
 * codec and edge coverage is what Mux Video packages, so the Mux media compose it and a general HLS source keeps the
 * unsupported-format verdict. An audio-only composition takes `mpegTsAudioTransmuxFeature` instead, which carries no
 * H.264 framing. Compose either after `shiftTimestampsFeature` and `drmFeature`: it replaces the loader pipelines the
 * former sets and the playability probe and reporter the latter sets, and it needs `deriveStartMediaTime` from the
 * former to place TS content, whose timestamps rarely start at zero, onto the playlist timeline.
 *
 * Scope (spike): one program, H.264 + AAC-LC, unencrypted. A muxed rendition's in-band audio is carried when the track
 * declares an audio codec and dropped when the audio is demuxed into renditions of its own. A URI-less default audio
 * rendition (audio muxed into the video segments) is not yet supported as a selection.
 */
export const mpegTsTransmuxFeature = defineFeature({ behaviors, defaultConfig, initialState });
