/**
 * Load-start seam for the `loadXSegments` dispatchers: a signal that moves a full-range load's start earlier than the
 * playhead. The dispatcher re-sends its load whenever the value changes and starts the range there (`undefined`: at the
 * playhead), so the loader's ordinary planning fetches whatever the earlier start reaches.
 */
import { computed, type ReadonlySignal } from '../../core/signals/primitives';
import { previousSegmentLeadInStart } from '../../media/buffer/lead-in';
import type { Segment } from '../../media/types';
import type { SourceBufferActor } from '../actors/dom/source-buffer';

/** What a dispatcher already resolves, handed to {@link CreateLoadStart} once at setup. */
export interface LoadStartDeps {
  currentTime: ReadonlySignal<number | undefined>;
  selectedTrack: ReadonlySignal<{ segments: readonly Segment[] } | undefined>;
  /** The dispatcher's SourceBuffer actor. Observed, never declared: absent for text, or in a composition without one. */
  bufferActor: ReadonlySignal<SourceBufferActor | undefined> | undefined;
}

/**
 * Builds the load-start signal. Its value is a primitive so a change — by `Object.is` — is a real reason to re-send;
 * `undefined` on every tick that needs nothing.
 */
export type CreateLoadStart = (deps: LoadStartDeps) => ReadonlySignal<number | undefined>;

/**
 * The lead-in load start: the previous segment's start while the segment at the playhead turns out to start late (see
 * `media/buffer/lead-in`), so the load reaches back for the tail that covers the playhead.
 */
export const leadInLoadStart: CreateLoadStart = ({ currentTime, selectedTrack, bufferActor }) =>
  computed(() => {
    const track = selectedTrack.get();
    const actor = bufferActor?.get();
    if (!track || !actor) return undefined;

    const { bufferedRanges } = actor.snapshot.get().context;

    return previousSegmentLeadInStart(track.segments, bufferedRanges, currentTime.get() ?? 0);
  });
