import { createMachineActor, type HandlerContext, type MessageActor } from '../../../core/actors/create-machine-actor';
import { SerialRunner, Task } from '../../../core/tasks/task';
import { type AppendData, appendSegment } from '../../../media/dom/mse/append-segment';
import { flushBuffer } from '../../../media/dom/mse/buffer-flusher';
import { SEGMENT_TIME_EPSILON, type Segment, type Track } from '../../../media/types';
import type {
  AppendInitMessage,
  AppendSegmentMessage,
  IndividualSourceBufferMessage,
  RemoveMessage,
} from '../../primitives/source-buffer-messages';

// =============================================================================
// Types
// =============================================================================

export interface BufferedRange {
  start: number;
  end: number;
}

export type { AppendData };

export type BatchMessage = { type: 'batch'; messages: IndividualSourceBufferMessage[] };
export type CancelMessage = { type: 'cancel' };

/** All messages accepted by a SourceBufferActor. */
export type SourceBufferMessage = IndividualSourceBufferMessage | BatchMessage | CancelMessage;

/** Finite states of the actor. */
export type SourceBufferActorState = 'idle' | 'updating' | 'destroyed';

/** Non-finite (extended) data managed by the actor — the XState "context". */
export interface SourceBufferActorContext {
  initTrackId?: string | undefined;
  /**
   * Language of the most recently appended init segment's track (when present on the playlist). Used by the
   * segment-loader's `planTasks` to detect cross-language switches and schedule ahead-buffer flush. Undefined for video
   * and for language-less audio.
   */
  initTrackLanguage?: string | undefined;
  /**
   * Name of the most recently appended init segment's track. Read with `initTrackLanguage` to detect switches between
   * same-language audio tracks with different content (a commentary track, say). Undefined for video.
   */
  initTrackName?: string | undefined;
  segments: Array<
    Pick<Segment, 'id' | 'startTime' | 'duration'> & {
      trackId: Track['id'];
      trackBandwidth?: number;
      /**
       * True while a streaming append is in progress for this segment. The segment's data is partially present in the
       * SourceBuffer. Downstream code must not treat a partial segment as fully buffered.
       */
      partial?: boolean;
    }
  >;
  bufferedRanges: BufferedRange[];
}

/** SourceBuffer actor: queues operations, owns its snapshot. */
export type SourceBufferActor = MessageActor<SourceBufferActorState, SourceBufferActorContext, SourceBufferMessage>;

// =============================================================================
// Helpers
// =============================================================================

function snapshotBuffered(buffered: TimeRanges): BufferedRange[] {
  const ranges: BufferedRange[] = [];

  for (let i = 0; i < buffered.length; i++) {
    ranges.push({ start: buffered.start(i), end: buffered.end(i) });
  }

  return ranges;
}

// =============================================================================
// Message task factories
// =============================================================================

// Context is read lazily via getContext at task execution time — not at creation
// time — so each task always operates on the most recent context regardless of
// when it was scheduled.

interface MessageTaskOptions {
  getContext: () => SourceBufferActorContext;
  sourceBuffer: SourceBuffer;
  setContext: (ctx: SourceBufferActorContext) => void;
}

function appendInitTask(
  message: AppendInitMessage,
  { getContext, sourceBuffer }: MessageTaskOptions
): Task<SourceBufferActorContext> {
  return new Task(async (taskSignal) => {
    const ctx = getContext();

    if (taskSignal.aborted) return ctx;

    await appendSegment(sourceBuffer, message.data);
    // No abort check here: the physical SourceBuffer has been modified, so
    // the model must be updated to match regardless of signal state.
    return {
      ...ctx,
      initTrackId: message.meta.trackId,
      initTrackLanguage: message.meta.language,
      initTrackName: message.meta.name,
    };
  });
}

function appendSegmentTask(
  message: AppendSegmentMessage,
  { getContext, sourceBuffer, setContext }: MessageTaskOptions
): Task<SourceBufferActorContext> {
  return new Task(async (taskSignal) => {
    const ctx = getContext();

    if (taskSignal.aborted) return ctx;

    const { meta } = message;
    // Remove any existing entry at the same start time (same "slot" in the
    // timeline), then record the new segment. Assumes time-aligned segments
    // across playlists. `SEGMENT_TIME_EPSILON` guards against floating-point
    // drift in parsed timestamps (shared with the segment-loader quality
    // filter — single source of truth).
    //
    // Misaligned renditions (e.g. 30fps vs 60fps rungs) break the same-slot
    // assumption: the switched-to segment's differing startTime is kept as a
    // separate overlapping entry rather than truncating the older one to the
    // portion MSE didn't overwrite. Cosmetic today (see #1865 for the
    // most-recent-append-wins model); coverage/flush stay correct.
    const filtered = ctx.segments.filter((s) => Math.abs(s.startTime - meta.startTime) >= SEGMENT_TIME_EPSILON);

    // For streaming data: emit partial state before the first chunk so
    // downstream code can see the in-progress segment and treat it as
    // incomplete. ArrayBuffer appends are atomic so no partial state is
    // needed — context is updated once at task completion.
    if (!(message.data instanceof ArrayBuffer)) {
      setContext({
        ...ctx,
        segments: [
          ...filtered,
          {
            id: meta.id,
            startTime: meta.startTime,
            duration: meta.duration,
            trackId: meta.trackId,
            ...(meta.trackBandwidth !== undefined && { trackBandwidth: meta.trackBandwidth }),
            partial: true,
          },
        ],
        bufferedRanges: ctx.bufferedRanges,
      });
    }

    // Relocation: set the offset before the coded frames are appended. The
    // SerialRunner guarantees the buffer is idle here, so the assignment is safe.
    // Guarded so re-stamping the (constant) offset on later appends is a no-op.
    if (meta.timestampOffset != null && sourceBuffer.timestampOffset !== meta.timestampOffset) {
      sourceBuffer.timestampOffset = meta.timestampOffset;
    }

    await appendSegment(sourceBuffer, message.data, taskSignal);
    // No abort check here: the physical SourceBuffer has been modified, so
    // the model must be updated to match regardless of signal state.
    return {
      ...ctx,
      segments: [
        ...filtered,
        {
          id: meta.id,
          startTime: meta.startTime,
          duration: meta.duration,
          trackId: meta.trackId,
          ...(meta.trackBandwidth !== undefined && { trackBandwidth: meta.trackBandwidth }),
        },
      ],
      bufferedRanges: snapshotBuffered(sourceBuffer.buffered),
    };
  });
}

function removeTask(
  message: RemoveMessage,
  { getContext, sourceBuffer }: MessageTaskOptions
): Task<SourceBufferActorContext> {
  return new Task(async (taskSignal) => {
    const ctx = getContext();

    if (taskSignal.aborted) return ctx;

    await flushBuffer(sourceBuffer, message.start, message.end);
    // No abort check here: the physical SourceBuffer has been modified, so
    // the model must be updated to match regardless of signal state.
    //
    // Use the post-flush buffered ranges as ground truth. A segment is kept
    // in the model only if its midpoint falls within a buffered range.
    // Midpoint-based membership handles flush boundaries that don't align
    // exactly with segment edges without over-removing adjacent segments.
    const bufferedRanges = snapshotBuffered(sourceBuffer.buffered);
    const filtered = ctx.segments.filter((s) => {
      const midpoint = s.startTime + s.duration / 2;

      return bufferedRanges.some((r) => midpoint >= r.start && midpoint < r.end);
    });

    return { ...ctx, segments: filtered, bufferedRanges };
  });
}

type MessageTaskFactory<T extends IndividualSourceBufferMessage> = (
  message: T,
  options: MessageTaskOptions
) => Task<SourceBufferActorContext>;

const messageTaskFactories = {
  'append-init': appendInitTask,
  'append-segment': appendSegmentTask,
  remove: removeTask,
} satisfies {
  [K in IndividualSourceBufferMessage['type']]: MessageTaskFactory<Extract<IndividualSourceBufferMessage, { type: K }>>;
};

function messageToTask(
  message: IndividualSourceBufferMessage,
  options: MessageTaskOptions
): Task<SourceBufferActorContext> {
  const factory = messageTaskFactories[message.type] as MessageTaskFactory<typeof message>;

  return factory(message, options);
}

// =============================================================================
// Implementation
// =============================================================================

export function createSourceBufferActor(
  sourceBuffer: SourceBuffer,
  initialContext?: Partial<SourceBufferActorContext>
): SourceBufferActor {
  type UserState = Exclude<SourceBufferActorState, 'destroyed'>;

  const handleError = (e: unknown): void => {
    if (!(e instanceof Error && e.name === 'AbortError')) {
      console.error('SourceBuffer operation failed:', e);
    }
  };

  type Ctx = HandlerContext<UserState, SourceBufferActorContext, () => SerialRunner>;

  const onMessage = (msg: IndividualSourceBufferMessage, { transition, setContext, getContext, runner }: Ctx): void => {
    transition('updating');
    const task = messageToTask(msg, { getContext, sourceBuffer, setContext });

    runner.schedule(task).then(setContext, handleError);
  };

  return createMachineActor<UserState, SourceBufferActorContext, SourceBufferMessage, () => SerialRunner>({
    runner: () => new SerialRunner(),
    initial: 'idle',
    context: { segments: [], bufferedRanges: [], initTrackId: undefined, ...initialContext },
    states: {
      idle: {
        on: {
          'append-init': onMessage,
          'append-segment': onMessage,
          remove: onMessage,
          batch: (msg, { transition, setContext, getContext, runner }) => {
            const { messages } = msg;
            if (messages.length === 0) return;

            transition('updating');
            messages.forEach((msg) => {
              const task = messageToTask(msg, { getContext, sourceBuffer, setContext });

              runner.schedule(task).then(setContext, handleError);
            });
          },
        },
      },
      updating: {
        // Automatically return to idle once all scheduled tasks settle.
        onSettled: 'idle',
        on: {
          // Abort all in-progress and pending tasks. onSettled handles → 'idle'
          // once the aborted tasks drain.
          cancel: (_, { runner }) => {
            runner.abortAll();
          },
        },
      },
    },
  });
}
