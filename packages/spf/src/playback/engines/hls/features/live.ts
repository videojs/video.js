import type { Simplify } from '@videojs/utils/types';

import {
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../../core/composition/create-composition';
import { defineFeature } from '../../../../core/composition/define-feature';
import { delayedReschedule } from '../../../../core/tasks/delayed-reschedule';
import { mediaPlaylistReloadDelay, resolveLiveLatency } from '../../../../media/hls/reload-policy';
import { seekToLiveEdge } from '../../../behaviors/dom/seek-to-live-edge';
import { syncLiveSeekableRange } from '../../../behaviors/dom/sync-live-seekable-range';
import { establishStartMediaTime, gateFirstParseOnAnchor } from '../../../behaviors/establish-start-media-time';
import type { resolveAudioTrack, resolveTextTrack, resolveVideoTrack } from '../../../behaviors/resolve-track';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [syncLiveSeekableRange, seekToLiveEdge, establishStartMediaTime] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** This feature's behaviors plus the track resolvers, which read `reschedule` and `gateFirstParse`. */
type ConfigReaders = readonly [
  ...Behaviors,
  typeof resolveVideoTrack,
  typeof resolveAudioTrack,
  typeof resolveTextTrack,
];

/** The config defaults the feature contributes. */
export const defaultConfig = {
  // Format-neutral live-latency seam for `seekToLiveEdge` — the HLS resolver
  // (HOLD-BACK); a DASH engine would inject `suggestedPresentationDelay`.
  resolveLiveLatency,
  // The resolve* loaders' RecurringRunner re-runs on this `reschedule`: the pure
  // target-duration cadence, start-anchored + made awaitable by `delayedReschedule`.
  reschedule: delayedReschedule(mediaPlaylistReloadDelay),
  // Live-anchor establishment order: each non-reference track's first parse
  // waits for the reference track to settle the wall-clock anchor question
  // (see `gate-first-parse.ts`); pairs with the reactor's anchor stamp.
  gateFirstParse: gateFirstParseOnAnchor,
} satisfies Partial<ResolveBehaviorConfig<ConfigReaders>>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Plays live streams: reloads their playlists, keeps the seekable window current, starts at the live edge, and keeps
 * the playhead inside the window. Aligns separately delivered tracks on the stream's program date-times when joining
 * mid-stream. Inert for on-demand content.
 *
 * Requires:
 *
 * - A consumer of `state.startPosition`, such as `startPositionFeature`; without one, playback starts at the window's
 *   start instead of the live edge.
 * - A writer of `presentation.duration` and of the MediaSource's duration, such as `calculateDurationFeature` with
 *   `mediaSourceFeature`; without them, the stream never gets its infinite duration and stalls.
 */
export const liveFeature = defineFeature({ behaviors, defaultConfig, initialState });
