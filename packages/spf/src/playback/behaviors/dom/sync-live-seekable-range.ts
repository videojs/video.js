import type { Behavior } from '../../../core/composition/define-behavior';
import { effect } from '../../../core/signals/effect';
import type { ReadonlySignal } from '../../../core/signals/primitives';
import type { MaybeResolvedPresentation } from '../../../media/types';
import { liveWindowFromState } from '../../primitives/live-window';

export interface SyncLiveSeekableRangeState {
  presentation?: MaybeResolvedPresentation;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
}

export interface SyncLiveSeekableRangeContext {
  mediaSource?: MediaSource;
}

function syncLiveSeekableRangeSetup({
  state,
  context,
}: {
  state: {
    presentation: ReadonlySignal<SyncLiveSeekableRangeState['presentation']>;
    selectedVideoTrackId?: ReadonlySignal<SyncLiveSeekableRangeState['selectedVideoTrackId']>;
    selectedAudioTrackId?: ReadonlySignal<SyncLiveSeekableRangeState['selectedAudioTrackId']>;
  };
  context: {
    mediaSource: ReadonlySignal<SyncLiveSeekableRangeContext['mediaSource']>;
  };
}): () => void {
  return effect(() => {
    const mediaSource = context.mediaSource.get();
    const liveWindow = liveWindowFromState(state);
    if (!mediaSource || !liveWindow) return;

    // An earlier audio window can stand alone after video is deselected;
    // native MSE ranges cannot start before presentation-0.
    const start = Math.max(0, liveWindow.start);
    if (start >= liveWindow.end) return;

    // Re-declared as the window slides so seekable tracks the live window
    // (the full DVR range remains seekable; seek-to-live-edge starts near the edge).
    // No readyState check, no try/catch: `setLiveSeekableRange` throws only on a
    // non-'open' readyState or an invalid range, and neither can occur here —
    // `setupMediaSource` publishes `context.mediaSource` only while open, and a
    // non-null live window means the timeline-bearing track is still `Infinity`
    // (so `endOfStream` hasn't ended the MS); the clamp above ensures
    // 0 ≤ start < end.
    mediaSource.setLiveSeekableRange(start, liveWindow.end);
  });
}

/**
 * Mirror the live window into the MediaSource's seekable range. On every window update — **including while paused**
 * (the seekable range must stay current as the window slides, regardless of play state) — declare
 * `setLiveSeekableRange(start, end)` so the browser's `HTMLMediaElement.seekable` reflects the live window (without it,
 * `seekable` is empty under `duration === Infinity`).
 *
 * The live window comes from `liveWindowFromState` (the shared derivation — the intersection over the selected A/V
 * tracks' windows); inert when it returns `null` (VoD / ended live). Clamp the start to presentation-0 and skip windows
 * ending at or before it. Composed _before_ `seekToLiveEdge` so the range is declared before that behavior seeks the
 * playhead into it (a seek outside `seekable` is clamped).
 *
 * Duration is owned solely by `updateMediaSourceDuration`; this behavior only declares the seekable range
 * (`setLiveSeekableRange` requires only `readyState === 'open'` per the W3C MSE spec, not a set `duration`).
 *
 * No `clearLiveSeekableRange()` on termination, by design: the MSE spec consults the live seekable range _only_ while
 * `duration === Infinity`. When a live stream ends, `endOfStream()` sets a finite duration and the UA derives
 * `seekable` from buffered + duration, ignoring the live range — so clearing is unnecessary. Clearing on the
 * `ENDLIST`→finite-`Track.duration` transition (when the window goes `null`) would also be premature: `duration` is
 * still `Infinity` until `endOfStream`, so clearing would shrink `seekable` to buffered-only while the stream is still
 * effectively live.
 *
 * Manual `Behavior<>` literal (like `seekToLiveEdge`): declares only `presentation` in stateKeys while reading
 * `selectedVideoTrackId` / `selectedAudioTrackId` defensively (contributed by the switch* behaviors), so it composes
 * without a stateKeys/type conflict.
 */
export const syncLiveSeekableRange: Behavior<
  { presentation: ReadonlySignal<SyncLiveSeekableRangeState['presentation']> },
  { mediaSource: ReadonlySignal<SyncLiveSeekableRangeContext['mediaSource']> },
  object
> = {
  stateKeys: ['presentation'],
  contextKeys: ['mediaSource'],
  setup: syncLiveSeekableRangeSetup,
};
