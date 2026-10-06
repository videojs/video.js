import { defineFeature } from '../../../../core/composition/define-feature';
import { delayedReschedule } from '../../../../core/tasks/delayed-reschedule';
import { mediaPlaylistReloadDelay, resolveLiveLatency } from '../../../../media/hls/reload-policy';
import { seekToLiveEdge } from '../../../behaviors/dom/seek-to-live-edge';
import { syncLiveSeekableRange } from '../../../behaviors/dom/sync-live-seekable-range';
import { establishStartMediaTime, gateFirstParseOnAnchor } from '../../../behaviors/establish-start-media-time';

/**
 * Plays live streams: reloads their playlists, keeps the seekable window current, starts at the live edge, and keeps
 * the playhead inside the window. Aligns separately delivered tracks on the stream's program date-times when joining
 * mid-stream. Inert for on-demand content. Needs `startPositionFeature`, which performs the live-edge seek.
 */
export const liveFeature = defineFeature({
  behaviors: [syncLiveSeekableRange, seekToLiveEdge, establishStartMediaTime],
  defaultConfig: {
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
  },
});
