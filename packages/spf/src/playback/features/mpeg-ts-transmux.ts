import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../core/composition/define-behavior';
import { defineFeature } from '../../core/composition/define-feature';
import { canPlayTrackWithDrm } from '../../media/dom/capabilities';
import { MPEG_TS_MIME } from '../../media/hls/parse-media-playlist';
import type { CanPlayTrack, PartiallyResolvedTrack } from '../../media/types';
import { buildMimeCodec } from '../../media/utils/tracks';
import type { setupAudioBufferActors, setupVideoBufferActors } from '../behaviors/dom/setup-buffer-actors';
import type { resolveAudioTrack, resolveVideoTrack } from '../behaviors/resolve-track';
import type { switchAudioTrack, switchVideoTrack } from '../behaviors/track-switching';
import {
  type ReportUnsupportedTrackConditions,
  reportUnsupportedTrackConditionsWithDrm,
} from '../primitives/report-track-conditions';
import { transmuxPipelinesFor } from '../primitives/transmux-pipelines';

/** A TS rendition as the fMP4 it becomes: the container MIME the transmuxer outputs for the track's type. */
function asTransmuxed<T extends { mimeType?: string; type?: string }>(track: T): T {
  if (track.mimeType !== MPEG_TS_MIME) return track;

  return { ...track, mimeType: track.type === 'audio' ? 'audio/mp4' : 'video/mp4' };
}

/**
 * `canPlayTrackWithDrm` over the transmuxed container, so TS renditions probe by codec instead of being pruned. Wraps
 * the DRM-aware probe: on clear content it answers as the plain probe does, so it suits a composition without
 * `drmFeature` too.
 */
export const canPlayTransmuxedTrack: CanPlayTrack = (track, config) => canPlayTrackWithDrm(asTransmuxed(track), config);

/** The DRM-aware reporter over the transmuxed container: a TS rendition is no longer an unsupported format. */
export const reportUnsupportedTransmuxedTrackConditions: ReportUnsupportedTrackConditions = (track, config) =>
  reportUnsupportedTrackConditionsWithDrm(asTransmuxed(track), config);

/** The fMP4 MIME codec string the SourceBuffer receives for a (possibly TS) track. */
export function transmuxedSourceBufferMimeCodec(track: PartiallyResolvedTrack): string {
  return buildMimeCodec(asTransmuxed(track));
}

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
  // The loader pipelines: fetch → transmux → relocation discover/stamp → dispatch.
  // fMP4 segments pass through the transmux step untouched.
  videoMessagePipelines: transmuxPipelinesFor('video'),
  audioMessagePipelines: transmuxPipelinesFor('audio'),
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
 * reaches the SourceBuffer. fMP4 and CMAF content plays through it unchanged. Compose it after `shiftTimestampsFeature`
 * and `drmFeature`: it replaces the loader pipelines the former sets and the playability probe and reporter the latter
 * sets, and it needs `deriveStartMediaTime` from the former to place TS content, whose timestamps rarely start at zero,
 * onto the playlist timeline.
 *
 * Scope (spike): one program, H.264 + AAC-LC, unencrypted. A muxed rendition's in-band audio is carried when the track
 * declares an audio codec and dropped when the audio is demuxed into renditions of its own. A URI-less default audio
 * rendition (audio muxed into the video segments) is not yet supported as a selection.
 */
export const mpegTsTransmuxFeature = defineFeature({ behaviors, defaultConfig, initialState });
