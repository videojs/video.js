/**
 * **Drive each `open → ended` transition of the MediaSource.** Calls `MediaSource.endOfStream()` once every active
 * buffer actor's currently-loading track is _complete_ (finite `Track.duration` — the parser's completeness signal),
 * its temporally last segments are fully appended, and the user has reached them — letting the browser finalize
 * duration and fire `ended` on the media element. The completeness gate keeps it inert for ongoing live
 * (`Track.duration === Infinity`), whose "last segment" is only the rolling edge; a live stream opts in when its
 * duration turns finite.
 *
 * Re-fires on every subsequent `open → ended → open` cycle. Per the MSE spec, `appendBuffer()` after `endOfStream()`
 * transitions the MediaSource back to `'open'`; seek-back replays and back-buffer refills that re-load earlier segments
 * take this path, so the behavior must call `endOfStream()` again once the last segments are reappended. The reactor's
 * `'preconditions-unmet'` ↔ `'eos-ready'` cycle _is_ the re-arm mechanism: a successful `endOfStream()` flips
 * `mediaSource.readyState` to `'ended'`, which (via the local `msIsOpen` signal) exits `'eos-ready'`; the next `'open'`
 * re-evaluates preconditions and may re-enter.
 *
 * # Tracking what's in the buffer
 *
 * Each `SourceBufferActor` knows which track it's currently loading via `initTrackId` (set on the most recent
 * `append-init` message) and which segments it has appended. `deriveState` iterates over the available buffer actors
 * (`[videoBufferActor, audioBufferActor].filter(Boolean)`), resolves each to its track via `findTrackById`, and checks
 * that track's last segment is appended. This means audio-only / video-only / mixed configurations compose uniformly —
 * the body iterates whatever's in scope. No reliance on `selectedTrackId` slots: the actor's view IS the source of
 * truth for "what's being loaded into this buffer."
 *
 * **Two-fire on mid-end ABR switches**: when a quality switch occurs near end-of-stream, the actor's `initTrackId`
 * still reflects the _old_ track until the new init segment is appended. The reactor may fire `endOfStream()` against
 * the old track's last-segment-appended state, then the new init's `appendBuffer()` re-opens the MS, which re-arms us
 * to fire again once the new track's last segment lands. Functionally correct (the browser re-fires `ended` after the
 * re-arm), at the cost of one extra call. Accepted as the price of dropping `selectedTrackId` dependence.
 *
 * # Buffer-actor idle gate
 *
 * Each actor must be `'idle'` (no queued or in-flight tasks) before we fire. `buffer.updating === false` alone is
 * insufficient: for chunked fMP4 streaming, `updateend` fires after each chunk while the actor's for-await loop
 * synchronously enqueues the next `appendBuffer()` — so the buffer flips `!updating → updating` across a microtask
 * boundary. The actor's `'updating'` state spans the entire multi-chunk append, so `actor.snapshot.value === 'idle'` is
 * the canonical "no more pending or in-flight work" oracle.
 *
 * This bet (actor models the pipeline; `mediaSource.sourceBuffers` models DOM state) is durable as long as the segment
 * loader is the sole writer of `appendBuffer()` calls. A future loop-mode that auto-fetches earlier segments
 * mid-`ended` would require a broader coordination story between SourceBuffers and the MediaSource — possibly via a
 * `MediaSourceActor` — and that's where this gate would want re-evaluating.
 *
 * # currentTime gate
 *
 * `currentTime` must have reached (within {@link LAST_SEGMENT_REACHED_SLACK}) at least one active track's last segment
 * startTime. Prevents `'eos-ready'` entry when a back-buffer `remove()` / `appendBuffer()` briefly re-opens the
 * MediaSource while the user is mid-stream. HLS rendition time-alignment means any active track works as the reference.
 * The slack absorbs the near-end playhead freeze (see the constant) so a tiny final segment doesn't deadlock.
 *
 * # MS readyState — local subscription
 *
 * The behavior subscribes to `mediaSource`'s readyState changes inside its setup (via `onMediaSourceReadyStateChange`)
 * and mirrors `'open'` to a behavior-local `msIsOpen` signal that `deriveState` reads. No shared
 * `mediaSourceReadyState` slot dependency. Anticipates a future `MediaSourceActor` whose snapshot would expose the same
 * signal — the consumer code wouldn't change.
 *
 * # `endOfStream` entry sequence
 *
 * 1. Wait for all SourceBuffers to be idle (DOM-level — defensive, should already hold given the actor-idle gate in
 *    `deriveState`).
 * 2. Set `mediaSource.duration` from `getMaxBufferedEnd` to match actual container timestamps (`endOfStream()` only clamps
 *    up implicitly; setting it explicitly here keeps the final value deterministic).
 * 3. Call `mediaSource.endOfStream()`.
 *
 * State-exit cleanup (`controller.abort()`) cancels any in-flight wait on source unload, presentation replace, or
 * behavior destroy.
 *
 * # Coordination with `updateMediaSourceDuration`
 *
 * `updateMediaSourceDuration` writes the initial `mediaSource.duration` from `presentation.duration` once per source;
 * this behavior writes the final value from the buffered end. Decision domains don't overlap.
 */
import type { Behavior } from '../../../core/composition/define-behavior';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { effect } from '../../../core/signals/effect';
import { computed, type ReadonlySignal, signal } from '../../../core/signals/primitives';
import { getMaxBufferedEnd, waitForSourceBuffersReady } from '../../../media/dom/mse/duration';
import { isLastSegmentAppended } from '../../../media/dom/mse/end-of-stream';
import { onMediaSourceReadyStateChange } from '../../../media/dom/mse/mediasource-setup';
import type { MaybeResolvedPresentation } from '../../../media/types';
import { isResolvedTrack } from '../../../media/types';
import { findTrackById } from '../../../media/utils/tracks';
import type { SourceBufferActor } from '../../actors/dom/source-buffer';

export interface EndOfStreamState {
  presentation?: MaybeResolvedPresentation;
  currentTime?: number;
}

export interface EndOfStreamContext {
  mediaSource?: MediaSource;
  videoBufferActor?: SourceBufferActor;
  audioBufferActor?: SourceBufferActor;
}

type EndOfStreamFsmState = 'preconditions-unmet' | 'eos-ready';

/**
 * Slack (seconds) on the "playhead has reached the last segment" gate. A tiny final segment (e.g. Apple's ~44ms last
 * segment) starts right at the buffered end, and the browser freezes the playhead ~50–70ms short of that end (its
 * render horizon), so a strict `currentTime >= lastSegStart` would never open — deadlocking `endOfStream` (the
 * MediaSource stays `'open'`, so the browser keeps the playhead frozen waiting for data/EOS that never comes). This
 * slack lets a playhead stalled just short of the final segment still finalize. Firing slightly early is harmless: the
 * last segment is already appended (the gate above), so no more data is expected.
 */
const LAST_SEGMENT_REACHED_SLACK = 0.5;

function deriveState(
  presentation: MaybeResolvedPresentation | undefined,
  mediaSource: MediaSource | undefined,
  msIsOpen: boolean,
  videoBufferActor: SourceBufferActor | undefined,
  audioBufferActor: SourceBufferActor | undefined,
  currentTime: number | undefined
): EndOfStreamFsmState {
  if (!mediaSource || !presentation || !msIsOpen) return 'preconditions-unmet';

  const actors = [videoBufferActor, audioBufferActor].filter((a): a is SourceBufferActor => a !== undefined);
  // No active buffer actors means setup hasn't completed wiring yet.
  if (actors.length === 0) return 'preconditions-unmet';

  // Track the latest last-segment startTime across actors as the
  // currentTime reference. HLS rendition time-alignment makes any active
  // track usable; using the max is safest when timings drift slightly.
  let lastSegStart: number | undefined;

  for (const actor of actors) {
    const snapshot = actor.snapshot.get();
    if (snapshot.value !== 'idle') return 'preconditions-unmet';

    const { initTrackId, segments: appended } = snapshot.context;
    if (!initTrackId) return 'preconditions-unmet';

    const track = findTrackById(presentation, initTrackId);
    if (!track || !isResolvedTrack(track)) return 'preconditions-unmet';

    // Only a complete playlist has a true last segment: firing on an ongoing
    // live window would pin a finite (live-edge) duration and end the stream,
    // only for the next reload's appends to reopen it and re-fire on a loop.
    // Independent of the currentTime slack below — this asks "is there an end at
    // all," the slack asks "has the playhead effectively reached it."
    if (!Number.isFinite(track.duration)) return 'preconditions-unmet';

    if (!isLastSegmentAppended(track.segments, appended)) return 'preconditions-unmet';

    if (track.segments.length > 0) {
      const start = track.segments[track.segments.length - 1]!.startTime;

      if (lastSegStart === undefined || start > lastSegStart) lastSegStart = start;
    }
  }

  // Slack absorbs the near-end playhead freeze so a tiny final segment doesn't deadlock.
  if (lastSegStart !== undefined && (currentTime ?? 0) < lastSegStart - LAST_SEGMENT_REACHED_SLACK) {
    return 'preconditions-unmet';
  }

  return 'eos-ready';
}

function endOfStreamSetup({
  state,
  context,
}: {
  state: {
    presentation: ReadonlySignal<EndOfStreamState['presentation']>;
    currentTime: ReadonlySignal<EndOfStreamState['currentTime']>;
  };
  context: {
    mediaSource: ReadonlySignal<EndOfStreamContext['mediaSource']>;
    // See behavior definition for details on these optional context signals.
    videoBufferActor?: ReadonlySignal<SourceBufferActor | undefined>;
    audioBufferActor?: ReadonlySignal<SourceBufferActor | undefined>;
  };
}): () => void {
  // Behavior-local mirror of `mediaSource.readyState === 'open'`. Subscribes
  // to MS events whenever a MediaSource is in scope; tears down when the
  // MS is swapped or the behavior destroys. Anticipates a future
  // `MediaSourceActor` whose snapshot would expose the same value — the
  // consumer code (deriveState) wouldn't change.
  const msIsOpen = signal(false);
  const cleanupMsListener = effect(() => {
    const mediaSource = context.mediaSource.get();

    if (!mediaSource) {
      msIsOpen.set(false);
      return;
    }

    msIsOpen.set(mediaSource.readyState === 'open');
    const controller = new AbortController();

    onMediaSourceReadyStateChange(mediaSource, controller.signal, (rs) => {
      msIsOpen.set(rs === 'open');
    });
    return () => controller.abort();
  });

  const derivedStateSignal = computed(() =>
    deriveState(
      state.presentation.get(),
      context.mediaSource.get(),
      msIsOpen.get(),
      context.videoBufferActor?.get(),
      context.audioBufferActor?.get(),
      state.currentTime.get()
    )
  );

  const reactor = createMachineReactor<EndOfStreamFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},

      'eos-ready': {
        // entry body is auto-untracked. deriveState handles source resets
        // and the MS readyState flip from 'open' to 'ended' that
        // endOfStream() produces; this entry resolves the MSE-spec
        // preconditions and binds its cleanup (abort) to state exit +
        // destroy.
        entry: () => {
          const mediaSource = context.mediaSource.get()!;
          const controller = new AbortController();

          const endStreamWhenReady = async () => {
            // Defensive: the actor-idle gate in deriveState should mean
            // buffers are already settled, but a microtask boundary
            // between deriveState's read and entry firing leaves a thin
            // gap. The DOM-level wait closes it.
            await waitForSourceBuffersReady(mediaSource.sourceBuffers, controller.signal);

            if (controller.signal.aborted) return;

            // MSE spec: duration cannot be less than any buffered range, and
            // endOfStream() will only clamp up implicitly. Setting it
            // explicitly here from actual container timestamps keeps the
            // final value deterministic for assets whose declared duration
            // disagrees with the buffered end (common with CMAF).
            const bufferedEnd = getMaxBufferedEnd(mediaSource.sourceBuffers);

            if (bufferedEnd > 0) mediaSource.duration = bufferedEnd;

            mediaSource.endOfStream();
          };

          endStreamWhenReady().catch((err) => console.error('Failed to call endOfStream:', err));

          return () => controller.abort();
        },
      },
    },
  });

  return () => {
    cleanupMsListener();
    reactor.destroy();
  };
}

/**
 * `endOfStream` uses a manual `Behavior<>` literal (rather than `defineBehavior`) because it reads `videoBufferActor` /
 * `audioBufferActor` defensively without declaring them in its contextKeys — those slots are contributed by other
 * behaviors and compose conditionally per engine variant. The `Behavior<>` literal opts out of the exhaustiveness check
 * so the typed context shape can include the optional fields used at runtime. See the comment on `endOfStreamSetup`'s
 * context param for the discipline.
 */
export const endOfStream: Behavior<
  {
    presentation: ReadonlySignal<EndOfStreamState['presentation']>;
    currentTime: ReadonlySignal<EndOfStreamState['currentTime']>;
  },
  { mediaSource: ReadonlySignal<EndOfStreamContext['mediaSource']> }
> = {
  stateKeys: ['presentation', 'currentTime'],
  contextKeys: ['mediaSource'],
  setup: endOfStreamSetup,
};
