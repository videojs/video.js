import { createMachineActor, type HandlerContext, type MessageActor } from '../../../core/actors/create-machine-actor';
import { peek } from '../../../core/signals/primitives';
import { SerialRunner, Task } from '../../../core/tasks/task';
import {
  type BackBufferConfig,
  calculateBackBufferFlushPoint,
  DEFAULT_BACK_BUFFER_CONFIG,
} from '../../../media/buffer/back-buffer';
import {
  calculateForwardFlushPoint,
  DEFAULT_FORWARD_BUFFER_CONFIG,
  type ForwardBufferConfig,
  getSegmentsToLoad,
  isTimeRangeCovered,
  mergeTimeRanges,
} from '../../../media/buffer/forward-buffer';
import { type AudioTrack, SEGMENT_TIME_EPSILON, type Segment, type VideoTrack } from '../../../media/types';
import {
  DEFAULT_MESSAGE_PIPELINES,
  type FetchBytes,
  type Frame,
  type LoadStep,
  type LoadTask,
  type MessagePipelines,
  type StepDeps,
} from '../../primitives/segment-load-pipeline';
import type { SourceBufferActor } from './source-buffer';

// ============================================================================
// BUFFER STATE TYPES
// ============================================================================

/** Buffer state for a single SourceBuffer. Tracks which init segment and media segments are loaded. */
export interface SourceBufferState {
  /** Track ID of the loaded init segment */
  initTrackId?: string;
  /** Loaded media segments (unordered - selectors derive ordering) */
  segments: Array<{ id: string; trackId: string }>;
}

/** Buffer state for all SourceBuffers. */
export interface BufferState {
  video?: SourceBufferState;
  audio?: SourceBufferState;
}

// ============================================================================
// MESSAGE PROTOCOL
// ============================================================================

/** Track types that have SourceBuffers (video and audio only). */
export type SegmentLoaderTrack = VideoTrack | AudioTrack;

/**
 * Message sent to a SegmentLoaderActor.
 *
 * `range` is optional to distinguish loading modes: - No range: load init segment only (metadata preload mode) - With
 * range: load init + all segments overlapping [start, end]
 *
 * `start` and `end` are raw time values — no segment snapping. The actor maps them onto segment boundaries internally.
 */
export type SegmentLoaderMessage = {
  type: 'load';
  track: SegmentLoaderTrack;
  range?: { start: number; end: number };
};

// ============================================================================
// ACTOR INTERFACE
// ============================================================================

/** Finite states of the actor. */
export type SegmentLoaderActorState = 'idle' | 'loading' | 'destroyed';

/** Non-finite (extended) data managed by the actor. */
export interface SegmentLoaderActorContext {
  /** Track ID of the init segment currently being fetched/appended, or null. */
  inFlightInitTrackId: string | null;
  /**
   * Identity of the segment currently being fetched/appended, or null. Tracks the `trackId` alongside the positional
   * `id` because renditions number segments independently (`segment-N`): an in-flight LOW `segment-0` must not be
   * mistaken for a needed HIGH `segment-0` on a switch (see the loading handler's continue/preempt decision). Mirrors
   * the text-track loader, which already matches its in-flight segment on `(inFlightTrackId, inFlightSegmentId)`.
   */
  inFlightSegment: { id: string; trackId: string } | null;
}

export type SegmentLoaderActor = MessageActor<SegmentLoaderActorState, SegmentLoaderActorContext, SegmentLoaderMessage>;

/**
 * Configuration for `createSegmentLoaderActor`. Each sub-config is spread over the corresponding `DEFAULT_*_CONFIG` so
 * callers can override individual fields.
 */
export interface SegmentLoaderActorConfig {
  /**
   * Forward-buffer tuning. `bufferDuration` controls how far ahead of the playhead segments are loaded (and where
   * forward-flush kicks in). Defaults: see `DEFAULT_FORWARD_BUFFER_CONFIG` (30 seconds). Threaded to segment-loader
   * actors (v/a + text) at construction time and to `loadXSegments` dispatchers for the load-message range.
   */
  forwardBuffer?: Partial<ForwardBufferConfig>;
  /**
   * Back-buffer tuning. `keepSegments` controls how many segments stay behind the playhead before eviction. Defaults:
   * see `DEFAULT_BACK_BUFFER_CONFIG` (2 segments). Threaded to the v/a segment-loader actor only (text tracks don't use
   * back-buffer eviction).
   */
  backBuffer?: Partial<BackBufferConfig>;
  /** Per-message-type step pipelines. Defaults to {@link DEFAULT_MESSAGE_PIPELINES} (`fetch → dispatch`). */
  messagePipelines?: MessagePipelines;
}

// ============================================================================
// LOAD TASK FACTORY
// ============================================================================

interface LoadTaskOptions {
  getContext: () => SegmentLoaderActorContext;
  setContext: (ctx: SegmentLoaderActorContext) => void;
  pipelines: Record<LoadTask['type'], LoadStep[]>;
  deps: StepDeps;
}

/**
 * Wraps a LoadTask descriptor into a Task that runs the op's message pipeline (fetch/discover/stamp/dispatch, per the
 * composition's `messagePipelines`). Updates in-flight context around the async region so the loading handler can make
 * accurate continue/preempt decisions at any point, and checks the abort signal before each step.
 */
function makeLoadTask(op: LoadTask, { getContext, setContext, pipelines, deps }: LoadTaskOptions): Task<void> {
  return new Task(async (taskSignal) => {
    if (taskSignal.aborted) return;

    const frame: Frame = op.type === 'append-segment' ? { op, meta: op.meta } : { op };

    // In-flight bookkeeping brackets the async region; the `finally` resets it
    // even if a step aborts or throws mid-pipeline. Only append ops track it.
    try {
      if (op.type === 'append-init') setContext({ ...getContext(), inFlightInitTrackId: op.meta.trackId });
      else if (op.type === 'append-segment')
        setContext({ ...getContext(), inFlightSegment: { id: op.meta.id, trackId: op.meta.trackId } });

      for (const step of pipelines[op.type]) {
        if (taskSignal.aborted) return;

        await step(frame, taskSignal, deps);
      }
    } finally {
      if (op.type === 'append-init') setContext({ ...getContext(), inFlightInitTrackId: null });
      else if (op.type === 'append-segment') setContext({ ...getContext(), inFlightSegment: null });
    }
  });
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

/**
 * Creates a SegmentLoaderActor for one track type (video or audio).
 *
 * Receives load assignments via `send()` and owns all execution: planning, removes, fetches, and appends. Coordinates
 * with the SourceBufferActor for all physical SourceBuffer operations.
 *
 * Planning (Cases 1–3) happens in the `load` handler on every incoming message, producing an ordered LoadTask list. The
 * runner drains that list sequentially via SerialRunner. When a new message arrives mid-run, the handler replans and
 * either continues the in-flight operation (abortPending + schedule new remainder) or preempts it (abortAll + cancel
 * SourceBuffer if needed + schedule new plan).
 *
 * @param sourceBufferActor - Shared SourceBufferActor reference (not owned)
 * @param fetchBytes - Tracked fetch closure (owns throughput sampling for segments). Accepts an optional `minChunkSize`
 *   in options; init segments pass `Infinity` so the entire body accumulates as one chunk before appending.
 * @param compositionDeps - The composition's `state`/`context`/`config`, threaded opaquely into each step's
 *   {@link StepDeps} (the loader never reads them). Lets injected steps (relocation) read composition signals at call
 *   time. Defaults to empty for standalone / base-pipeline use.
 */
export function createSegmentLoaderActor(
  sourceBufferActor: SourceBufferActor,
  fetchBytes: FetchBytes,
  config: SegmentLoaderActorConfig = {},
  compositionDeps: StepDeps = { state: {}, context: {}, config: {} }
): SegmentLoaderActor {
  type UserState = Exclude<SegmentLoaderActorState, 'destroyed'>;
  type Ctx = HandlerContext<UserState, SegmentLoaderActorContext, () => SerialRunner>;

  const forwardBufferConfig: ForwardBufferConfig = { ...DEFAULT_FORWARD_BUFFER_CONFIG, ...config.forwardBuffer };
  const backBufferConfig: BackBufferConfig = { ...DEFAULT_BACK_BUFFER_CONFIG, ...config.backBuffer };
  // Fold the loader's own wiring into the passthrough `config` (see `stepWiring`) so
  // base steps read it from the uniform `{state,context,config}` — present in both
  // composition and standalone use.
  const deps: StepDeps = {
    state: compositionDeps.state,
    context: compositionDeps.context,
    config: { ...compositionDeps.config, sourceBufferActor, fetch: fetchBytes },
  };
  // Built once per actor (fresh stateful steps per source); default is `fetch → dispatch`.
  const pipelines = (config.messagePipelines ?? DEFAULT_MESSAGE_PIPELINES)();

  const getBufferedSegments = (allSegments: readonly Segment[]): Segment[] => {
    // A candidate segment counts as "already buffered" only when its whole time
    // span is covered by appended content — a TIME question, not a positional-id
    // one. Renditions are numbered independently per playlist (`segment-N`), so
    // matching by id assumes every rung shares the same segment grid. That fails
    // for renditions whose boundaries don't align (e.g. a 30fps rung cuts its
    // first GOP at 7.13s, a 60fps rung at 7.98s): the switched-to rung's segment
    // reuses a buffered id but spans a *later*-ending range, so an id match would
    // skip it and leave its uncovered tail as a gap. Covering by time refetches
    // exactly that straddling segment (MSE overwrites the overlap on append).
    //
    // Exclude partial segments — they are still streaming and must not count as
    // fully buffered for load planning or buffer window calculations.
    //
    // `peek` defensively: `load` handlers run synchronously inside `send()`,
    // which is called from inside the dispatcher reactor's `effects:` body.
    // A tracked `.snapshot.get()` here would leak the source-buffer-actor's
    // snapshot into the dispatcher's dep set, causing the dispatcher to re-
    // fire on every SourceBufferActor state change. Mirrors the fix applied
    // to the text-track loader in `b3f44efe`.
    const appended = peek(sourceBufferActor.snapshot).context.segments.filter((s) => !s.partial);
    const merged = mergeTimeRanges(appended.map((s) => ({ start: s.startTime, end: s.startTime + s.duration })));

    return allSegments.filter((s) => isTimeRangeCovered(s.startTime, s.startTime + s.duration, merged));
  };

  /**
   * Translate a load message into an ordered LoadTask list based on committed actor state. In-flight awareness is
   * handled separately in the load handler.
   *
   * @todo Rename alongside LoadTask (e.g. planOps). Case 1 — Removes: forward and back buffer flush points,
   *   segment-aligned. ABR-style track switches (same content, different bitrate) do not flush: appending new content
   *   overwrites existing buffer ranges, and the actor's time-aligned deduplication keeps the segment model accurate as
   *   new segments arrive. Cross-rendition track switches (audio language change, text language change) do flush: the
   *   buffered content is semantically incompatible with the newly-selected track, so overwrite-on-append would leave
   *   stale content playing until each replacement segment lands. Today's predicate: `actorCtx.initTrackLanguage !==
   *   track.language` — fires for language changes, no-ops for video / same-language audio bitrate switches. Future
   *   stage: pluggable predicate / strategy at actor construction time for codec-change (5.1 surround) and other
   *   cross-rendition shapes. Case 2 — Init: schedule if not yet committed for this track. Case 3 — Segments: all
   *   segments in the load window not yet committed.
   */
  const planTasks = (message: SegmentLoaderMessage): LoadTask[] => {
    const { track, range } = message;
    // `peek` for the same reason as `getBufferedSegments` above — avoid
    // leaking the SourceBufferActor snapshot into the calling dispatcher's
    // tracking scope.
    const actorCtx = peek(sourceBufferActor.snapshot).context;
    const bufferedSegments = getBufferedSegments(track.segments);
    const currentTime = range?.start ?? 0;

    const tasks: LoadTask[] = [];

    // Cross-rendition switch check (mid-stream language change). Fires when
    // (a) an init segment has already been committed for some track,
    // (b) the newly-selected track is a different track, and
    // (c) the languages differ. The buffered range from the current segment
    // boundary forward is treated as stale (new track's same-timestamp
    // segments will overwrite it via MSE append-at-same-timestamp); no
    // explicit `remove` task is emitted for the cross-rendition range.
    // Computed against the currently-buffered segments (stable reference;
    // new track's playlist may not be resolved yet at first load).
    const isCrossRenditionSwitch =
      actorCtx.initTrackId !== undefined &&
      actorCtx.initTrackId !== track.id &&
      actorCtx.initTrackLanguage !== track.language;

    // Two categories of "buffered content that should not gate planning":
    //
    // - `removes` — content that needs an explicit `remove` task (out-of-window
    //   forward content, back-buffer content beyond the keep window). Emitted
    //   as `{ type: 'remove' }` tasks.
    // - `staleRanges` — content that the new appends will overwrite at the
    //   same timestamps (cross-rendition switch). No explicit `remove` —
    //   MSE's overwrite-on-append handles it, which gives a much smaller
    //   perceived audio gap than `remove`-then-fetch-then-append.
    //
    // Both categories affect `effectiveBuffered` so `getSegmentsToLoad`
    // re-plans new-track segments inside them.
    const removes: Array<{ start: number; end: number }> = [];
    const staleRanges: Array<{ start: number; end: number }> = [];

    if (range) {
      if (isCrossRenditionSwitch) {
        // Mark current-segment-start onward as stale. Falls back to the
        // first buffered segment after currentTime when the playhead sits
        // in a buffer gap.
        const currentSeg = actorCtx.segments.find(
          (s) => s.startTime <= currentTime && s.startTime + s.duration > currentTime
        );
        const staleStart = currentSeg?.startTime ?? actorCtx.segments.find((s) => s.startTime > currentTime)?.startTime;

        if (staleStart !== undefined) {
          staleRanges.push({ start: staleStart, end: Infinity });
        }
      }

      const forwardFlushStart = calculateForwardFlushPoint(bufferedSegments, currentTime, forwardBufferConfig);

      if (forwardFlushStart < Infinity) {
        removes.push({ start: forwardFlushStart, end: Infinity });
      }

      const backFlushEnd = calculateBackBufferFlushPoint(bufferedSegments, currentTime, backBufferConfig);

      if (backFlushEnd > 0) {
        removes.push({ start: 0, end: backFlushEnd });
      }

      for (const r of removes) tasks.push({ type: 'remove', start: r.start, end: r.end });
    }

    // Treat any segment overlapping a planned remove OR a stale range as
    // not-buffered. Without this, sibling renditions that share segment IDs
    // and startTimes (audio language variants) would see the new track's
    // same-startTime segments marked "buffered" by the pre-flush snapshot,
    // skip them in `getSegmentsToLoad`, and leave a permanent gap from
    // `currentSegmentStart` to the end of the old buffer window — stalling
    // playback.
    const overlapsStale = (seg: { startTime: number; duration: number }): boolean => {
      const segEnd = seg.startTime + seg.duration;

      return (
        removes.some((r) => seg.startTime < r.end && segEnd > r.start) ||
        staleRanges.some((r) => seg.startTime < r.end && segEnd > r.start)
      );
    };
    const effectiveBuffered =
      removes.length + staleRanges.length > 0 ? bufferedSegments.filter((s) => !overlapsStale(s)) : bufferedSegments;

    // Case 2: Init
    if (actorCtx.initTrackId !== track.id) {
      tasks.push({
        type: 'append-init',
        meta: { trackId: track.id, language: track.language },
        url: track.initialization.url,
        ...(track.initialization.byteRange !== undefined && { byteRange: track.initialization.byteRange }),
      });
    }

    // Case 3: Segments
    if (range) {
      const segmentsToLoad = getSegmentsToLoad(
        track.segments,
        effectiveBuffered,
        currentTime,
        forwardBufferConfig
      ).filter((seg) => {
        // Quality-aware filter: skip segments already covered by equal-or-higher-quality
        // content in the actor context. Preserves buffered high-quality content during
        // ABR downgrades; loads during upgrades and for uncovered positions.
        // Actor entries that overlap a planned remove OR a stale range are treated
        // as nonexistent here — they're about to be flushed or overwritten, so the
        // new-track segment must load regardless of the existing entry's bandwidth.
        const existing = actorCtx.segments.find(
          (s) => !overlapsStale(s) && Math.abs(s.startTime - seg.startTime) < SEGMENT_TIME_EPSILON
        );
        // Partial segments are still streaming — treat as not buffered so they
        // are always re-planned (avoids relying on incomplete data).
        if (existing?.partial) return true;

        if (!existing?.trackBandwidth || !track.bandwidth) return true;

        return track.bandwidth > existing.trackBandwidth;
      });

      for (const segment of segmentsToLoad) {
        tasks.push({
          type: 'append-segment',
          meta: {
            id: segment.id,
            startTime: segment.startTime,
            duration: segment.duration,
            trackId: track.id,
            trackBandwidth: track.bandwidth,
          },
          url: segment.url,
          ...(segment.byteRange !== undefined && { byteRange: segment.byteRange }),
        });
      }
    }

    return tasks;
  };

  const scheduleAll = (tasks: LoadTask[], { getContext, setContext, runner }: Ctx): void => {
    tasks.forEach((op) => {
      runner.schedule(makeLoadTask(op, { getContext, setContext, pipelines, deps })).then(undefined, (e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return;

        // On unexpected fetch/append errors, abort remaining tasks so a failed
        // init doesn't cause segment fetches to proceed with no init segment.
        console.error('Unexpected error in segment loader:', e);
        runner.abortPending();
      });
    });
  };

  return createMachineActor<UserState, SegmentLoaderActorContext, SegmentLoaderMessage, () => SerialRunner>({
    runner: () => new SerialRunner(),
    initial: 'idle',
    context: { inFlightInitTrackId: null, inFlightSegment: null },
    states: {
      idle: {
        on: {
          load: (msg, ctx) => {
            const allTasks = planTasks(msg);
            if (allTasks.length === 0) return;

            ctx.transition('loading');
            scheduleAll(allTasks, ctx);
          },
        },
      },
      loading: {
        onSettled: 'idle',
        on: {
          load: (msg, ctx) => {
            const { context, runner } = ctx;
            const allTasks = planTasks(msg);

            // Determine whether the in-flight operation is still needed. The
            // segment match requires BOTH the positional id AND the trackId:
            // renditions number segments independently, so an in-flight LOW
            // `segment-0` (spanning [0, 7.13]) must NOT be treated as covering a
            // switched-to HIGH `segment-0` (spanning [0, 7.98]). Matching by id
            // alone kept the LOW fetch, skipped HIGH's leading segment, and left
            // its tail as a gap — intermittently, only when the switch beat the
            // in-flight append. A track switch now always preempts (correct: the
            // new rendition's same-slot segment must be (re)fetched).
            const inFlight = context.inFlightSegment;
            const segmentInFlightStillNeeded = (t: LoadTask): boolean =>
              t.type === 'append-segment' &&
              inFlight !== null &&
              t.meta.id === inFlight.id &&
              t.meta.trackId === inFlight.trackId;
            const inFlightStillNeeded =
              (inFlight !== null && allTasks.some(segmentInFlightStillNeeded)) ||
              (context.inFlightInitTrackId !== null &&
                allTasks.some((t) => t.type === 'append-init' && t.meta.trackId === context.inFlightInitTrackId));

            if (inFlightStillNeeded) {
              // Continue: abort only the pending queue, let the in-flight task finish.
              // Schedule everything except the in-flight item — it covers that slot.
              runner.abortPending();
              scheduleAll(
                allTasks.filter(
                  (t) =>
                    !segmentInFlightStillNeeded(t) &&
                    !(t.type === 'append-init' && t.meta.trackId === context.inFlightInitTrackId)
                ),
                ctx
              );
            } else {
              // Preempt: abort everything and replan.
              runner.abortAll();
              // Cancel SourceBufferActor tasks when a segment is in-flight (always
              // discard) or when a track switch is happening (new track's init follows).
              // For a same-track seek with an in-flight init, skip cancel — the task's
              // signal is not aborted (abortAll was called on the runner, but the init
              // task already completed or will complete via its own signal path).
              const cancelSourceBuffer =
                context.inFlightSegment !== null ||
                (context.inFlightInitTrackId !== null &&
                  allTasks.some((t) => t.type === 'append-init' && t.meta.trackId !== context.inFlightInitTrackId));

              if (cancelSourceBuffer) {
                sourceBufferActor.send({ type: 'cancel' });
              }

              scheduleAll(allTasks, ctx);
            }
          },
        },
      },
    },
  });
}
