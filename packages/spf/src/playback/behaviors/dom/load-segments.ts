/**
 * **Per-type segment loading dispatch.** Per available track type (video / audio / text), reads the per-type
 * segment-loader actor from context and sends typed `'load'` messages whenever a meaningful loading condition changes
 * (selected track, current time crossing a segment boundary).
 *
 * Loader-actor lifecycle is owned upstream:
 *
 * - Video: `setupVideoBufferActors`
 * - Audio: `setupAudioBufferActors`
 * - Text: `setupTextTrackActors`
 *
 * This behavior is pure-consumer: it reads `context[loaderKey]` and dispatches typed messages via the variant's
 * per-type `findResolvedTrack` resolver.
 *
 * # Load modes as reactor states
 *
 * Four states encode the load-gating policy directly:
 *
 * - `'preconditions-unmet'` — no loader actor in context, or the selected track hasn't resolved.
 * - `'dormant'` — loading disabled by policy: an observed `loadingSuspended` or `segmentLoadingBlocked` (highest
 *   precedence) or `preload === 'none' && !loadActivated`. Nothing fires; already-queued loader work drains.
 *   Auto-resumes into the derived state when the policy lifts.
 * - `'metadata-only'` — `!loadActivated && preload !== 'auto' && preload !== 'none'`. Fires an init-segment-only `load`
 *   message **once on entry**. The variant's loader actor decides what to do — v/a's actor fetches the init segment;
 *   text's actor no-ops (no init concept).
 * - `'full-range'` — `loadActivated || preload === 'auto'`. Effect re-fires on selected-track change and on
 *   segment-boundary crossing.
 *
 * # Per-type parameterization (inference-driven)
 *
 * The helper is generic over `Track` — the resolved-track type. Each variant supplies its own `findResolvedTrack`
 * resolver via config; TS infers `Track` from the resolver's return type. The loader signal's value type is constrained
 * to `SegmentLoaderLike<Track>` — anything with a `send` method accepting the `Track`-parameterized message. Concrete
 * actor types (`SegmentLoaderActor`, `TextTrackSegmentLoaderActor`) satisfy this via function-parameter contravariance:
 * an actor whose `.send` accepts a wider track type is assignable to a slot expecting a narrower track type.
 *
 * No widening of actor message types is needed; no casts inside the helper. Per-variant wiring (right loader paired
 * with right resolver) is enforced at the variant call site.
 */
import { defineBehavior } from '../../../core/composition/create-composition';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { computed, peek, type ReadonlySignal } from '../../../core/signals/primitives';
import {
  DEFAULT_FORWARD_BUFFER_CONFIG,
  type ForwardBufferConfig,
  segmentStartForTime,
} from '../../../media/buffer/forward-buffer';
import type { MaybeResolvedPresentation, Segment } from '../../../media/types';
import { findResolvedAudioTrack, findResolvedTextTrack, findResolvedVideoTrack } from '../../../media/utils/tracks';
import type { BufferState, SegmentLoaderActor, SourceBufferState } from '../../actors/dom/segment-loader';
import type { TextTrackSegmentLoaderActor } from '../../actors/text-track-segment-loader';
import { AUDIO_TYPE_CONFIG, TEXT_TYPE_CONFIG, VIDEO_TYPE_CONFIG } from '../../primitives/track-types';

// Re-export buffer state types for consumers that import them from this module.
export type { BufferState, SourceBufferState };

// ============================================================================
// STATE & CONTEXT
// ============================================================================

/** State shape for segment loading. */
export interface SegmentLoadingState {
  presentation?: MaybeResolvedPresentation;
  preload?: string;
  /** Current playback position in seconds. Defaults to 0 when undefined. */
  currentTime?: number;
  /** True once a preload-overriding event has fired for the current source. */
  loadActivated?: boolean;
  /**
   * Intent-level policy input: initiate no new loading work while `true`. Read here by the `loadXSegments` dispatchers
   * (park in `'dormant'`, highest precedence) and by `setupMediaSource` (a pending MediaSource rebuild waits — attach
   * runs the element's load algorithm). **Observed, never declared**: no reader lists this key in `stateKeys`, so the
   * slot exists only in compositions where a feature behavior declares and writes it (e.g. `setupAirPlay`, while a
   * remote-playback session owns presentation). An absent slot means never suspended.
   */
  loadingSuspended?: boolean;
  /**
   * Segment-load gate: dispatch no new segment work while `true`. **Observed, never declared**, exactly like
   * `loadingSuspended`, so an absent slot means never gated — but narrower in what it forbids: only the dispatchers
   * read it, never `setupMediaSource`, because a writer holding this has no quarrel with the element's load algorithm.
   * That asymmetry is why it isn't folded into `loadingSuspended`, which both read; a single boolean would newly gate
   * MediaSource attach, and co-writing one would be a last-write-wins conflict besides.
   *
   * Single writer per composition. Today that writer is DRM (`setupMediaKeys`, holding from its setup and each new
   * source until the source is confirmed clear or its MediaKeys attach — appending encrypted data before `setMediaKeys`
   * misbehaves on Chromium); the slot names the prohibition rather than the domain so a second such gate needs no
   * vocabulary here.
   */
  segmentLoadingBlocked?: boolean;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
  selectedTextTrackId?: string;
}

/** Context shape for segment loading. Each variant only consumes its own type's loader actor. */
export interface SegmentLoadingContext {
  videoSegmentLoaderActor?: SegmentLoaderActor;
  audioSegmentLoaderActor?: SegmentLoaderActor;
  textTrackSegmentLoaderActor?: TextTrackSegmentLoaderActor;
}

// ============================================================================
// REACTOR
// ============================================================================

type SegmentLoadingFsmState = 'preconditions-unmet' | 'dormant' | 'metadata-only' | 'full-range';

type SelectedTrackKey = 'selectedVideoTrackId' | 'selectedAudioTrackId' | 'selectedTextTrackId';
type SegmentLoaderActorKey = 'videoSegmentLoaderActor' | 'audioSegmentLoaderActor' | 'textTrackSegmentLoaderActor';

type SegmentLoadingStateMap<K extends SelectedTrackKey> = {
  presentation: ReadonlySignal<SegmentLoadingState['presentation']>;
  preload: ReadonlySignal<SegmentLoadingState['preload']>;
  currentTime: ReadonlySignal<SegmentLoadingState['currentTime']>;
  loadActivated: ReadonlySignal<SegmentLoadingState['loadActivated']>;
} & { [P in K]: ReadonlySignal<SegmentLoadingState[P]> };

/** Shared `'load'` message shape parameterized over the resolved track type. */
interface LoadMessage<Track> {
  type: 'load';
  track: Track;
  range?: { start: number; end: number };
}

/** Structural constraint for any segment-loader-style actor. */
interface SegmentLoaderLike<Track> {
  send: (message: LoadMessage<Track>) => void;
}

/**
 * Specialization helper. Generic over `Track` (inferred from `findResolvedTrack`'s return type). The loader value type
 * is constrained to `SegmentLoaderLike<Track>` — concrete actor types (whose `.send` accepts a wider track union)
 * satisfy this via function-parameter contravariance.
 *
 * Tracks that the helper handles must have a `segments` field — used by `segmentBoundarySignal` to compute the
 * load-anchor boundary. Each variant's resolver narrows to the right resolved-track shape.
 */
function setupSegmentLoading<
  K extends SelectedTrackKey,
  L extends SegmentLoaderActorKey,
  Track extends { segments: readonly Segment[] },
>({
  state,
  context,
  config,
}: {
  // `loadingSuspended` and `segmentLoadingBlocked` are observed, never declared
  // (see their state-shape docs): optional here so variant maps — which omit
  // them from their contracts — are assignable as-is, while compositions with
  // a writer expose the live slot.
  state: SegmentLoadingStateMap<K> & {
    loadingSuspended?: ReadonlySignal<SegmentLoadingState['loadingSuspended']>;
    segmentLoadingBlocked?: ReadonlySignal<SegmentLoadingState['segmentLoadingBlocked']>;
  };
  context: { [P in L]: ReadonlySignal<SegmentLoaderLike<Track> | undefined> };
  config: {
    selectedKey: K;
    loaderKey: L;
    findResolvedTrack: (
      presentation: MaybeResolvedPresentation | undefined,
      trackId: string | undefined
    ) => Track | undefined;
    forwardBuffer?: Partial<ForwardBufferConfig>;
  };
}): Reactor<SegmentLoadingFsmState | 'destroying' | 'destroyed'> {
  const { selectedKey, loaderKey, findResolvedTrack } = config;
  const bufferDuration = config.forwardBuffer?.bufferDuration ?? DEFAULT_FORWARD_BUFFER_CONFIG.bufferDuration;

  // The `'dormant'` policy, read in three places: the derived state, and both
  // dispatching handlers, which re-read it against the concurrent-rise window
  // described on `'metadata-only'`. Either gate holding forbids a dispatch;
  // an absent slot never gates.
  const isLoadingDormant = () => !!(state.loadingSuspended?.get() || state.segmentLoadingBlocked?.get());

  const selectedTrack = computed<Track | undefined>(() =>
    findResolvedTrack(state.presentation.get(), state[selectedKey].get())
  );

  // Segment-boundary signal — `segmentStartForTime` returns the same number
  // while `currentTime` stays inside one segment, so signal-polyfill's
  // `Object.is` equality on this computed dedups within-segment ticks.
  const segmentBoundarySignal = computed(() => {
    const track = selectedTrack.get();
    if (!track) return undefined;

    return segmentStartForTime(state.currentTime.get() ?? 0, track.segments);
  });

  const derivedStateSignal = computed<SegmentLoadingFsmState>(() => {
    // Policy-off wins even over preconditions: a loader arriving while
    // either gate holds must not dispatch.
    if (isLoadingDormant()) return 'dormant';

    if (!context[loaderKey].get() || !selectedTrack.get()) return 'preconditions-unmet';

    if (state.loadActivated.get() || state.preload.get() === 'auto') return 'full-range';

    if (state.preload.get() === 'none') return 'dormant';

    return 'metadata-only';
  });

  return createMachineReactor<SegmentLoadingFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},
      dormant: {},
      'metadata-only': {
        // Fires once on entry. Matches HTMLMediaElement's preload='metadata'
        // semantics — load enough to surface metadata for the entry-time
        // selection. Each variant's loader decides what to do: v/a's actor
        // fetches the init segment; text's actor treats no-range as a
        // no-op. Selection changes while still in `'metadata-only'` are
        // intentionally not followed.
        entry: () => {
          // Re-checked rather than asserted, even though `derivedStateSignal`
          // already required both. `monitor` and this handler are separate
          // effects over the same signals, and the flush order between them is
          // the scheduler's dirty-notification order, not registration order —
          // so a track that un-resolves can reach here before the transition to
          // `'preconditions-unmet'` lands. Returning is safe: the effect re-runs
          // when a track resolves again.
          const track = selectedTrack.get();
          const loader = context[loaderKey].get();
          if (!track || !loader) return;

          // The policy gates need the same re-read, and for a sharper reason: on
          // an encrypted source they rise in the *same flush* that resolves the
          // first rendition, because `setupMediaKeys` keys off the same event.
          // The machine can therefore commit to a dispatching state while the
          // gate is still down and arrive here after it is up. Composition order
          // alone does not close that window — it only decides whether the gate
          // write lands before or after this body runs.
          if (isLoadingDormant()) return;

          loader.send({ type: 'load', track });
        },
      },
      'full-range': {
        // Re-fires on selected-track changes and on segment-boundary
        // crossings. The loader and `currentTime` are peeked — the
        // boundary-dedup signal already handles re-firing policy.
        effects: () => {
          // Guarded for the reason given on `'metadata-only'`'s entry: this
          // effect tracks `selectedTrack` directly, so it can re-fire on the
          // very change that should be transitioning the machine out of this
          // state, and would otherwise dispatch a load with no track.
          const track = selectedTrack.get();

          segmentBoundarySignal.get();
          const loader = peek(context[loaderKey]);
          if (!track || !loader) return;

          // Same concurrent-rise window as `'metadata-only'`'s entry; see there.
          if (isLoadingDormant()) return;

          const currentTime = peek(state.currentTime) ?? 0;

          loader.send({
            type: 'load',
            track,
            range: { start: currentTime, end: currentTime + bufferDuration },
          });
        },
      },
    },
  });
}

// ============================================================================
// Per-helper-per-type configs — defaults that variants spread engine config over
// ============================================================================

const VIDEO_SEGMENT_LOADING_CONFIG = {
  ...VIDEO_TYPE_CONFIG,
  findResolvedTrack: findResolvedVideoTrack,
} as const;

const AUDIO_SEGMENT_LOADING_CONFIG = {
  ...AUDIO_TYPE_CONFIG,
  findResolvedTrack: findResolvedAudioTrack,
} as const;

const TEXT_SEGMENT_LOADING_CONFIG = {
  ...TEXT_TYPE_CONFIG,
  findResolvedTrack: findResolvedTextTrack,
} as const;

// ============================================================================
// Specialized exports — one per media type
// ============================================================================

export const loadVideoSegments = defineBehavior({
  stateKeys: ['presentation', 'preload', 'currentTime', 'loadActivated', 'selectedVideoTrackId'],
  contextKeys: ['videoSegmentLoaderActor'],
  setup: ({
    state,
    context,
    config = {},
  }: {
    state: SegmentLoadingStateMap<'selectedVideoTrackId'>;
    context: {
      videoSegmentLoaderActor: ReadonlySignal<SegmentLoadingContext['videoSegmentLoaderActor']>;
    };
    config?: object;
  }) =>
    setupSegmentLoading({
      state,
      context,
      config: { ...VIDEO_SEGMENT_LOADING_CONFIG, ...config },
    }),
});

export const loadAudioSegments = defineBehavior({
  stateKeys: ['presentation', 'preload', 'currentTime', 'loadActivated', 'selectedAudioTrackId'],
  contextKeys: ['audioSegmentLoaderActor'],
  setup: ({
    state,
    context,
    config = {},
  }: {
    state: SegmentLoadingStateMap<'selectedAudioTrackId'>;
    context: {
      audioSegmentLoaderActor: ReadonlySignal<SegmentLoadingContext['audioSegmentLoaderActor']>;
    };
    config?: object;
  }) =>
    setupSegmentLoading({
      state,
      context,
      config: { ...AUDIO_SEGMENT_LOADING_CONFIG, ...config },
    }),
});

export const loadTextTrackSegments = defineBehavior({
  stateKeys: ['presentation', 'preload', 'currentTime', 'loadActivated', 'selectedTextTrackId'],
  contextKeys: ['textTrackSegmentLoaderActor'],
  setup: ({
    state,
    context,
    config = {},
  }: {
    state: SegmentLoadingStateMap<'selectedTextTrackId'>;
    context: {
      textTrackSegmentLoaderActor: ReadonlySignal<SegmentLoadingContext['textTrackSegmentLoaderActor']>;
    };
    config?: object;
  }) =>
    setupSegmentLoading({
      state,
      context,
      config: { ...TEXT_SEGMENT_LOADING_CONFIG, ...config },
    }),
});
