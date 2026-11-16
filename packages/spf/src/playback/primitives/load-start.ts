/**
 * Load-start seam for the `loadXSegments` dispatchers: a signal that moves a full-range load's start earlier than the
 * playhead. The dispatcher re-sends its load whenever the value changes and starts the range there (`undefined`: at the
 * playhead), so the loader's ordinary planning fetches whatever the earlier start reaches.
 */
import { computed, type ReadonlySignal } from '../../core/signals/primitives';
import { previousSegmentLeadInStart } from '../../media/buffer/lead-in';
import type { MaybeResolvedPresentation, Segment } from '../../media/types';
import type { SourceBufferActor } from '../actors/dom/source-buffer';

type SelectedTrackKey = 'selectedVideoTrackId' | 'selectedAudioTrackId' | 'selectedTextTrackId';

/** The context keys of the per-type SourceBuffer actors. */
export type BufferActorKey = 'videoBufferActor' | 'audioBufferActor';

/** A dispatcher's own setup arguments — the same `{ state, context, config }` a behavior's setup receives. */
export interface LoadStartDeps {
  state: {
    presentation: ReadonlySignal<MaybeResolvedPresentation | undefined>;
    currentTime: ReadonlySignal<number | undefined>;
  } & Partial<Record<SelectedTrackKey, ReadonlySignal<string | undefined>>>;
  /**
   * The SourceBuffer actors are observed, never declared: absent for text, or in a composition without them, and a load
   * start must handle that by leaving the load at the playhead.
   */
  context: Partial<Record<BufferActorKey, ReadonlySignal<SourceBufferActor | undefined>>>;
  config: {
    selectedKey: SelectedTrackKey;
    bufferActorKey?: BufferActorKey;
    findResolvedTrack: (
      presentation: MaybeResolvedPresentation | undefined,
      trackId: string | undefined
    ) => { segments: readonly Segment[] } | undefined;
  };
}

/**
 * Builds the load-start signal from a dispatcher's setup arguments. Its value is a primitive so a change — by
 * `Object.is` — is a real reason to re-send; `undefined` on every tick that needs nothing.
 */
export type CreateLoadStart = (deps: LoadStartDeps) => ReadonlySignal<number | undefined>;

/**
 * The lead-in load start: the previous segment's start while the segment at the playhead turns out to start late (see
 * `media/buffer/lead-in`), so the load reaches back for the tail that covers the playhead.
 */
export const leadInLoadStart: CreateLoadStart = ({ state, context, config }) =>
  computed(() => {
    const track = config.findResolvedTrack(state.presentation.get(), state[config.selectedKey]?.get());
    const bufferActor = config.bufferActorKey && context[config.bufferActorKey]?.get();
    if (!track || !bufferActor) return undefined;

    const { bufferedRanges } = bufferActor.snapshot.get().context;

    return previousSegmentLeadInStart(track.segments, bufferedRanges, state.currentTime.get() ?? 0);
  });
