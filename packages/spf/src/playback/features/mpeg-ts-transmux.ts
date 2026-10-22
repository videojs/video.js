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
import { avcCodec } from '../../media/mpeg-ts/codecs/avc';
import { transmuxedSourceBufferMimeCodec } from '../../media/mpeg-ts/transmuxed-track';
import type { setupAudioBufferActors, setupVideoBufferActors } from '../behaviors/dom/setup-buffer-actors';
import type { ParsePresentation, resolvePresentation } from '../behaviors/resolve-presentation';
import type { resolveAudioTrack, resolveVideoTrack } from '../behaviors/resolve-track';
import type { switchAudioTrack, switchVideoTrack } from '../behaviors/track-switching';
import { reportUnsupportedTransmuxedTrackConditions } from '../primitives/report-track-conditions';
import { createSegmentShare } from '../primitives/segment-share';
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
  typeof resolvePresentation,
  typeof setupVideoBufferActors,
  typeof setupAudioBufferActors,
  typeof switchVideoTrack,
  typeof switchAudioTrack,
  typeof resolveVideoTrack,
  typeof resolveAudioTrack,
];

/** The HLS parser, with audio renditions carried in the video segments resolved to their carrier variants. */
const parsePresentation: ParsePresentation = (text, presentation) =>
  resolveCarriedAudioRenditions(parseMultivariantPlaylist(text, presentation));

// One request per video segment serves both loaders: keyed by URL, so one share
// across compositions is as correct as one per composition.
const share = createSegmentShare();

/** The config defaults the feature contributes. */
export const defaultConfig = {
  parsePresentation,
  // The loader pipelines: fetch → transmux → relocation discover/stamp → dispatch. The
  // video SourceBuffer carries the muxed AAC too (dropped when the track declares no
  // audio codec); fMP4 segments pass through the transmux step untouched. The audio
  // pipeline extracts a carried rendition's AAC from the video segments the video
  // pipeline shares with it.
  videoMessagePipelines: transmuxPipelinesFor('video', [avcCodec, aacCodec], { share }),
  audioMessagePipelines: transmuxPipelinesFor('audio', [aacCodec], { share }),
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
 * reaches the SourceBuffer. fMP4 and CMAF content plays through it unchanged. The `hls-video-mpeg-ts` and
 * `hls-background-video-mpeg-ts` engines compose it; the container-neutral engines don't, because its codec and edge
 * coverage is what Mux Video packages, so a general HLS source keeps the unsupported-format verdict there. An
 * audio-only composition takes `mpegTsAudioTransmuxFeature` instead, which carries no H.264 framing. Compose either
 * after `hlsLoadingFeature`, `shiftTimestampsFeature` and `drmFeature`: it wraps the parser the first sets, replaces
 * the loader pipelines the second sets and the playability probe and reporter the third sets, and it needs
 * `deriveStartMediaTime` from the second to place TS content, whose timestamps rarely start at zero, onto the playlist
 * timeline.
 *
 * Scope: one program, H.264 + AAC-LC, unencrypted. A muxed rendition's in-band audio is carried in the video
 * SourceBuffer when the track declares an audio codec. When the audio is demuxed into renditions of its own, the video
 * SourceBuffer drops it and the audio SourceBuffer takes each rendition's AAC — including the default rendition that
 * HLS declares URI-less because it is carried in the video segments: the audio pipeline extracts it from the segments
 * the video pipeline fetches, one request serving both.
 */
export const mpegTsTransmuxFeature = defineFeature({ behaviors, defaultConfig, initialState });
