/**
 * SourceBuffer sink message protocol — the operations a source-buffer sink accepts (`append-init` / `append-segment` /
 * `remove`). Plain, transport-neutral data: the load pipeline (`segment-load-pipeline`) produces them and the
 * SourceBuffer actor consumes them, so they live at the primitives layer both depend on rather than in either. DOM-free
 * — the segment bytes are the generic {@link SegmentData}, and only the actor that hands them to a real `SourceBuffer`
 * is DOM-bound.
 */
import type { Segment, SegmentData, Track } from '../../media/types';

export type AppendSegmentMeta = Pick<Segment, 'id' | 'startTime' | 'duration'> & {
  trackId: Track['id'];
  /** Declared track bandwidth in bps (from playlist BANDWIDTH attribute). */
  trackBandwidth?: number;
  /**
   * Non-zero-PTS relocation: when present, applied as `SourceBuffer.timestampOffset` before this append so native PTS
   * is relocated onto a 0-based presentation timeline. A relocating composition stamps it (constant per source) onto
   * each media segment's meta; the apply is idempotent-guarded. Absent = no relocation.
   */
  timestampOffset?: number;
};

export type AppendInitMessage = {
  type: 'append-init';
  data: SegmentData;
  /**
   * `language` and `name` are captured alongside `trackId` so downstream loaders can tell whether the newly-selected
   * track is different content from the buffered one and the buffer must be flushed on track switch (see
   * `segment-loader`'s `planTasks`). Both are undefined for video; `language` is also undefined for audio without an
   * explicit `LANGUAGE` attribute.
   */
  meta: { trackId: Track['id']; language?: string; name?: string };
};
export type AppendSegmentMessage = { type: 'append-segment'; data: SegmentData; meta: AppendSegmentMeta };
export type RemoveMessage = { type: 'remove'; start: number; end: number };
export type IndividualSourceBufferMessage = AppendInitMessage | AppendSegmentMessage | RemoveMessage;
