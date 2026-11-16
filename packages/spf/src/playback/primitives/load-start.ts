/**
 * Load-start seam for the `loadXSegments` dispatchers: a signal that moves a full-range load's start earlier than the
 * playhead. The dispatcher re-sends its load whenever the value changes and starts the range there (`undefined`: at the
 * playhead), so the loader's ordinary planning fetches whatever the earlier start reaches.
 */
import { computed, type ReadonlySignal } from '../../core/signals/primitives';
import { coveringSegmentStart } from '../../media/buffer/covering-segment-start';
import type { MaybeResolvedPresentation, Segment } from '../../media/types';
import type { SourceBufferActor } from '../actors/dom/source-buffer';

type SelectedTrackKey = 'selectedVideoTrackId' | 'selectedAudioTrackId' | 'selectedTextTrackId';

type BufferActorKey = 'videoBufferActor' | 'audioBufferActor';

/**
 * A dispatcher's own setup arguments — the same `{ state, context, config }` a behavior's setup receives, passed
 * straight through. Like a track-switching rule, this declares what it reads beyond the dispatcher's own signals as
 * optional on its own view, so the dispatcher never assumes it exists.
 */
export interface LoadStartDeps {
  state: {
    presentation: ReadonlySignal<MaybeResolvedPresentation | undefined>;
    currentTime: ReadonlySignal<number | undefined>;
  } & Partial<Record<SelectedTrackKey, ReadonlySignal<string | undefined>>>;
  /** The SourceBuffer actors, absent for text or in a composition without them (the load then stays at the playhead). */
  context: Partial<Record<BufferActorKey, ReadonlySignal<SourceBufferActor | undefined>>>;
  config: {
    selectedKey: SelectedTrackKey;
    /** The per-type `actorKey` the dispatcher's type config carries; text has none. */
    actorKey?: BufferActorKey;
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
 * Starts the load at the previous segment while the segment at the playhead turns out to begin after the playhead (its
 * media starts a little after the time the playlist gives for it; see `media/buffer/covering-segment-start`). The end
 * of the previous segment is the media the playhead needs.
 */
export const coveringSegmentLoadStart: CreateLoadStart = ({ state, context, config }) =>
  computed(() => {
    const track = config.findResolvedTrack(state.presentation.get(), state[config.selectedKey]?.get());
    const bufferActor = config.actorKey && context[config.actorKey]?.get();
    if (!track || !bufferActor) return undefined;

    const { bufferedRanges } = bufferActor.snapshot.get().context;

    return coveringSegmentStart(track.segments, bufferedRanges, state.currentTime.get() ?? 0);
  });
