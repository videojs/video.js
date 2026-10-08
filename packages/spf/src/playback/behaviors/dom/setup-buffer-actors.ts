/**
 * **Per-type buffer + segment-loader actor setup.** Per available track type (video / audio), when `mediaSource` is
 * attached and the selected track of that type is present in the presentation with codecs (partial resolution from the
 * multivariant playlist is enough — codecs live on the `EXT-X-STREAM-INF` line, not in the per-type media playlist),
 * creates a `SourceBuffer`, a `SourceBufferActor`, and a `SegmentLoaderActor` bound to that buffer-actor; publishes the
 * per-type actor slots. On `mediaSource` detach or behavior destroy, destroys both actors in reverse order and clears
 * the per-type slots so the next source starts fresh.
 *
 * Each per-type variant (`setupVideoBufferActors` / `setupAudioBufferActors`) is a single-positive-state reactor
 * (`'preconditions-unmet'` ↔ `'buffer-ready'`) gating only on its own type. No cross-type coupling in `stateKeys` —
 * `setupVideoBufferActors` carries only `selectedVideoTrackId` (plus `bandwidthState`, written by its trackedFetch),
 * and audio mirrors.
 *
 * # Firefox `mozHasAudio` invariant
 *
 * Appending to a video `SourceBuffer` before the audio `SourceBuffer` exists causes `mozHasAudio` to be permanently
 * false in Firefox. With the two per-type variants decoupled, the invariant is no longer structural to a single `entry`
 * body (as it was when both buffers were created in one synchronous block inside a merged behavior). It's now preserved
 * by a chain of assumptions about how this behavior composes with its upstream and downstream siblings:
 *
 * 1. **Upstream — default selections land in one `runPending`.** `selectAudioTrack` (default audio) and `switchVideoTrack`
 *    (default video) both subscribe to `state.presentation` flipping to resolved; their effects run in the same
 *    `runPending` iteration and write `selectedAudioTrackId` + `selectedVideoTrackId` within it.
 * 2. **Self — both per-type monitors flip in one `runPending`.** After (1), both monitors re-evaluate and flip to
 *    `'buffer-ready'` in the next `runPending`. Both `entry` bodies run synchronously within that iteration — both
 *    `addSourceBuffer` calls land before the iteration ends.
 * 3. **Downstream — `appendBuffer` is async.** `loadVideoSegments` / `loadAudioSegments` read the per-type
 *    `xSegmentLoaderActor` slots; their effects fire in the _next_ `runPending` and the actual `appendBuffer` requires
 *    a network round-trip via the `SegmentLoaderActor` — many microtasks past both `addSourceBuffer` calls.
 *
 * The cross-tick failure mode — a user-initiated audio track switch _after_ video segments have begun appending — is
 * out of scope for this behavior and would be addressed in the buffer/segment-loading path via `changeType`-aware
 * logic.
 *
 * # Sole writer
 *
 * `setupVideoBufferActors` is sole writer of `videoBufferActor` + `videoSegmentLoaderActor` (and `bandwidthState` via
 * its trackedFetch); `setupAudioBufferActors` is sole writer of `audioBufferActor` + `audioSegmentLoaderActor`. Both
 * read `mediaSource` from `setupMediaSource`. Downstream MSE behaviors (`loadVideoSegments`, `loadAudioSegments`,
 * `endOfStream`, `updateMediaSourceDuration`) only read these slots.
 */
import { listen } from '@videojs/utils/dom';

import { defineBehavior } from '../../../core/composition/create-composition';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { computed, type ReadonlySignal, type Signal } from '../../../core/signals/primitives';
import { createSourceBuffer } from '../../../media/dom/mse/mediasource-setup';
import type { MaybeResolvedPresentation, PartiallyResolvedTrack } from '../../../media/types';
import type { GetCdnId } from '../../../media/utils/cdn';
import { getSelectedTrack, type TrackSelectionState } from '../../../media/utils/track-selection';
import { buildMimeCodec } from '../../../media/utils/tracks';
import { hasCodecs } from '../../../media/utils/tracks';
import type { BandwidthState } from '../../../network/bandwidth-estimator';
import { credentialsFetch, type RequestCredentialsPolicy } from '../../../network/credentials-fetch';
import { createTrackedFetch, type FetchBytes, fetchStream } from '../../../network/fetch';
import {
  createSegmentLoaderActor,
  type SegmentLoaderActor,
  type SegmentLoaderActorConfig,
} from '../../actors/dom/segment-loader';
import { createSourceBufferActor, type SourceBufferActor } from '../../actors/dom/source-buffer';
import { failoverFetch } from '../../primitives/failover-fetch';
import type { MessagePipelines } from '../../primitives/segment-load-pipeline';
import { AUDIO_TYPE_CONFIG, VIDEO_TYPE_CONFIG } from '../../primitives/track-types';

/** Media track type for MSE buffer setup. Text tracks are excluded as they don't use MSE SourceBuffers. */
export type MediaTrackType = 'video' | 'audio';

export interface BufferActorsState {
  presentation?: MaybeResolvedPresentation;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
  bandwidthState?: BandwidthState;
}

export interface BufferActorsContext {
  mediaSource?: MediaSource;
  videoBufferActor?: SourceBufferActor;
  audioBufferActor?: SourceBufferActor;
  videoSegmentLoaderActor?: SegmentLoaderActor;
  audioSegmentLoaderActor?: SegmentLoaderActor;
}

type BufferActorsFsmState = 'preconditions-unmet' | 'buffer-ready';

type SelectedTrackKey = 'selectedVideoTrackId' | 'selectedAudioTrackId';
type BufferActorKey = 'videoBufferActor' | 'audioBufferActor';
type SegmentLoaderActorKey = 'videoSegmentLoaderActor' | 'audioSegmentLoaderActor';

type BufferActorsStateMap<K extends SelectedTrackKey> = {
  presentation: ReadonlySignal<BufferActorsState['presentation']>;
} & { [P in K]: ReadonlySignal<BufferActorsState[P]> };

type BufferActorsContextMap<A extends BufferActorKey, L extends SegmentLoaderActorKey> = {
  mediaSource: ReadonlySignal<BufferActorsContext['mediaSource']>;
} & { [P in A]: Signal<SourceBufferActor | undefined> } & {
  [P in L]: Signal<SegmentLoaderActor | undefined>;
};

// ============================================================================
// Specialization helper
//
// `setupBufferActors` has the same shape as a Behavior `setup` function:
// `({ state, context, config }) => reactor`. Each `setupXBufferActors`
// export below calls it from inside its own `defineBehavior` setup,
// passing its narrowed `state` / `context` through directly and supplying
// the per-type `selectedKey`, `actorKey`, `loaderKey`, `type` discriminator,
// and `fetch` inline.
//
// Gating is per-type only: no cross-type coupling. See the file-level
// JSDoc for how the Firefox `mozHasAudio` invariant survives the split
// via SPF's effect coalescing.
// ============================================================================

function setupBufferActors<K extends SelectedTrackKey, A extends BufferActorKey, L extends SegmentLoaderActorKey>({
  state,
  context,
  config,
}: {
  state: BufferActorsStateMap<K>;
  context: BufferActorsContextMap<A, L>;
  config: {
    type: MediaTrackType;
    selectedKey: K;
    actorKey: A;
    loaderKey: L;
    fetch: FetchBytes;
  } & SegmentLoaderActorConfig;
}): Reactor<BufferActorsFsmState | 'destroying' | 'destroyed'> {
  const { type, selectedKey, actorKey, loaderKey, fetch, forwardBuffer, backBuffer, messagePipelines } = config;
  const derivedStateSignal = computed<BufferActorsFsmState>(() => {
    if (!context.mediaSource.get()) return 'preconditions-unmet';

    const selection: TrackSelectionState = {
      presentation: state.presentation.get(),
      [selectedKey]: state[selectedKey].get(),
    };

    return hasCodecs(getSelectedTrack(selection, type)) ? 'buffer-ready' : 'preconditions-unmet';
  });

  return createMachineReactor<BufferActorsFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},

      'buffer-ready': {
        entry: () => {
          const mediaSource = context.mediaSource.get()!;
          const selection: TrackSelectionState = {
            presentation: state.presentation.get(),
            [selectedKey]: state[selectedKey].get(),
          };
          const track = getSelectedTrack(selection, type) as PartiallyResolvedTrack;
          const buffer = createSourceBuffer(mediaSource, buildMimeCodec(track));
          const bufferActor = createSourceBufferActor(buffer);
          const segmentLoader = createSegmentLoaderActor(
            bufferActor,
            fetch,
            { forwardBuffer, backBuffer, messagePipelines },
            // Thread the composition deps opaquely to steps (relocation reads
            // `state.mediaContainerData`); the loader/this behavior never read them.
            { state, context, config }
          );

          // Synchronous slot writes — load-bearing for the Firefox
          // `mozHasAudio` invariant (see file-level JSDoc). Both per-type
          // entries' `addSourceBuffer` calls must land in the same
          // `runPending` iteration; synchronous writes keep the contiguous
          // JS frame. Downstream `loadXSegments` effects fire in the
          // *next* `runPending`.
          context[actorKey].set(bufferActor);
          context[loaderKey].set(segmentLoader);

          // State-exit cleanup — fires when `mediaSource` detaches, the
          // selection unsets, or the behavior is destroyed. Destroy the
          // loader before its upstream buffer-actor so any in-flight
          // `appendBuffer` is aborted before the buffer-actor's own
          // teardown. Idempotent, so the sourceclose listener below shares it.
          const disconnect = new AbortController();
          const teardownActors = () => {
            segmentLoader.destroy();
            bufferActor.destroy();
            context[loaderKey].set(undefined);
            context[actorKey].set(undefined);
            disconnect.abort();
          };

          // Also tear down when the UA closes the MediaSource out from under
          // us (notably an AirPlay handoff — see `setupAirPlay`). Must be a
          // DOM listener, not reactive cleanup: already-queued append
          // continuations outrun any effect flush, and only a synchronous
          // abort keeps them off the dead SourceBuffer (InvalidStateError).
          listen(mediaSource, 'sourceclose', teardownActors, { signal: disconnect.signal });

          return teardownActors;
        },
      },
    },
  });
}

// ============================================================================
// Specialized exports — one per media type
// ============================================================================

/**
 * Set up the video `SourceBufferActor` + `SegmentLoaderActor`. Fires when `mediaSource` is attached and the selected
 * video track is present in the presentation with codecs. Gates only on video state — no cross-type coupling. Owns a
 * bandwidth-sampling `trackedFetch` and is sole writer of `state.bandwidthState`.
 */
export const setupVideoBufferActors = defineBehavior({
  stateKeys: ['presentation', 'selectedVideoTrackId', 'bandwidthState'] as const,
  contextKeys: ['mediaSource', 'videoBufferActor', 'videoSegmentLoaderActor'] as const,
  setup: ({
    state,
    context,
    config = {},
  }: {
    state: BufferActorsStateMap<'selectedVideoTrackId'> & {
      bandwidthState: Signal<BufferActorsState['bandwidthState']>;
    };
    context: BufferActorsContextMap<'videoBufferActor', 'videoSegmentLoaderActor'>;
    config?: SegmentLoaderActorConfig & {
      getCdnId?: GetCdnId;
      /** The `credentials` mode segment requests are made with; absent → the platform default. */
      requestCredentials?: RequestCredentialsPolicy;
      /** Optional non-zero-PTS relocation pipelines (Tier-1); the loader uses its Tier-0 default when absent. */
      videoMessagePipelines?: MessagePipelines;
    };
  }) => {
    // Bandwidth-sampling fetch. The factory accumulates EWMA state
    // internally; the callback bridges samples to engine state for ABR.
    // Created once at behavior setup time so the EWMA accumulates across
    // source resets (each per-source loader-actor receives the same
    // tracked fetch when reconstructed in `buffer-ready` entry).
    const trackedFetch = createTrackedFetch(
      state.bandwidthState.get() ?? {
        fastEstimate: 0,
        fastTotalWeight: 0,
        slowEstimate: 0,
        slowTotalWeight: 0,
        bytesSampled: 0,
      },
      (next) => state.bandwidthState.set(next)
    );
    // Engine `config` layers over the per-type defaults; `failoverFetch` reads
    // its `selectedKey` + `getCdnId` from the merged result. Credentials wrap
    // innermost so a failed credentialed request still trips the CDN.
    const typeConfig = { ...VIDEO_TYPE_CONFIG, ...config };

    return setupBufferActors({
      state,
      context,
      config: {
        ...typeConfig,
        messagePipelines: config[VIDEO_TYPE_CONFIG.messagePipelinesKey],
        fetch: failoverFetch(credentialsFetch(trackedFetch, config.requestCredentials), state, typeConfig),
      },
    });
  },
});

/**
 * Set up the audio `SourceBufferActor` + `SegmentLoaderActor`. Same shape as `setupVideoBufferActors`, narrowed to
 * audio. Today supplies a non-sampling `fetchStream` (no audio ABR); adding audio ABR is a localized change to this
 * setup body (swap `fetchStream` for a `createTrackedFetch` call + declare `bandwidthState` writable here) without
 * touching the shared helper. See `internal/design/spf/features/audio-abr.md` for the design surface (bandwidth-state
 * sharing, multi-writer coordination, EWMA mixed- source sampling).
 *
 * **Mid-stream audio track switching is NOT this behavior's concern.** Slot writes to `selectedAudioTrackId` (default
 * selection, programmatic filter-driven, future ABR) are owned by `switchAudioTrack` / future `switchAudioQuality` in
 * `track-switching.ts`. Flush orchestration on track change is dispatched from there via `audioBufferActor.send(...)` —
 * keeping this setup behavior focused on per-source actor lifecycle.
 */
export const setupAudioBufferActors = defineBehavior({
  stateKeys: ['presentation', 'selectedAudioTrackId'] as const,
  contextKeys: ['mediaSource', 'audioBufferActor', 'audioSegmentLoaderActor'] as const,
  setup: ({
    state,
    context,
    config = {},
  }: {
    state: BufferActorsStateMap<'selectedAudioTrackId'>;
    context: BufferActorsContextMap<'audioBufferActor', 'audioSegmentLoaderActor'>;
    config?: SegmentLoaderActorConfig & {
      getCdnId?: GetCdnId;
      /** The `credentials` mode segment requests are made with; absent → the platform default. */
      requestCredentials?: RequestCredentialsPolicy;
      /** Optional non-zero-PTS relocation pipelines (Tier-1); the loader uses its Tier-0 default when absent. */
      audioMessagePipelines?: MessagePipelines;
    };
  }) => {
    // Key order mirrors setupVideoBufferActors.
    const typeConfig = { ...AUDIO_TYPE_CONFIG, ...config };

    return setupBufferActors({
      state,
      context,
      config: {
        ...typeConfig,
        messagePipelines: config[AUDIO_TYPE_CONFIG.messagePipelinesKey],
        fetch: failoverFetch(credentialsFetch(fetchStream, config.requestCredentials), state, typeConfig),
      },
    });
  },
});
