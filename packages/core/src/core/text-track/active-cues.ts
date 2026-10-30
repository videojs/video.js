import type { MediaTextCue } from '@videojs/media';

/**
 * How long a point, a cue whose end is its start, stays active.
 *
 * @internal
 */
export const POINT_CUE_DURATION = 1;

/**
 * Whether a cue is active at a time. A range is active from its start up to its end; a point is active for
 * {@link POINT_CUE_DURATION} from where it sits, so a seek far past it never activates it.
 *
 * @internal
 */
export function isCueActive(cue: Pick<MediaTextCue, 'startTime' | 'endTime'>, time: number): boolean {
  const end = cue.endTime > cue.startTime ? cue.endTime : cue.startTime + POINT_CUE_DURATION;

  return time >= cue.startTime && time < end;
}

/**
 * The cues active at a time, in list order.
 *
 * Time updates come a few times a second, so playback at a high rate, or after a stall, can pass a point or a short cue
 * between two of them. Given `since`, the time of the last update, a cue that started after it counts as active even
 * when it's already over. Leave it out after a seek, so a seek never activates the cues it jumps over.
 *
 * @internal
 */
export function findActiveCues<Cue extends Pick<MediaTextCue, 'startTime' | 'endTime'>>(
  cues: readonly Cue[],
  time: number,
  since = Number.NaN
): Cue[] {
  if (!Number.isFinite(time)) return [];

  const played = Number.isFinite(since) && since < time;

  return cues.filter((cue) => isCueActive(cue, time) || (played && cue.startTime > since && cue.startTime <= time));
}
