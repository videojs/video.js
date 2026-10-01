/**
 * MediaSource duration helpers.
 *
 * Predicates and async primitives for propagating a presentation's duration to `mediaSource.duration` under the MSE
 * spec's constraints:
 *
 * - `duration` cannot be set while any attached SourceBuffer is `updating`.
 * - `duration` cannot be less than any buffered range's end time.
 *
 * The buffer-set helpers take a `SourceBufferList` (or any iterable of `SourceBuffer`) — they operate uniformly across
 * whatever buffers are attached, so callers in audio-only, video-only, and mixed configurations compose them without
 * per-type plumbing. `mediaSource.sourceBuffers` is the canonical aggregate.
 *
 * Consumed by `updateMediaSourceDuration` (DOM behavior) — kept here so the layering stays clean: the predicates and
 * wait helper are pure DOM/MSE primitives with no `core/` reactivity.
 */

import type { MaybeResolvedPresentation } from '../../types';
import { hasPresentationDuration } from '../../types';

type SourceBufferIterable = SourceBufferList | Iterable<SourceBuffer>;

/**
 * Check if we have the basics to update MediaSource duration: a `mediaSource` and a `presentation` with a numeric
 * duration.
 */
function canUpdateDuration(
  presentation: MaybeResolvedPresentation | undefined,
  mediaSource: MediaSource | undefined
): boolean {
  return !!(mediaSource && presentation && hasPresentationDuration(presentation));
}

export function getBufferedEnd(
  buffers: SourceBufferIterable,
  isEndMatch: (next: number, current: number) => boolean
): number {
  return (
    ([...buffers].reduce((endMatch: number | undefined, buffer) => {
      const { buffered } = buffer;
      if (!buffered.length) return endMatch;

      const end = buffered.end(buffered.length - 1);

      if (!endMatch) return end;

      return isEndMatch(end, endMatch) ? end : endMatch;
    }, undefined) as number) ?? 0
  );
}

const isGreaterThan = (x: number, y: number) => x > y;
const isLessThan = (x: number, y: number) => x < y;

/**
 * Get the maximum buffered end time across an iterable of SourceBuffers (typically `mediaSource.sourceBuffers`).
 * Returns `0` when the collection is empty or no buffer has any buffered ranges.
 */
export function getMaxBufferedEnd(buffers: SourceBufferIterable): number {
  return getBufferedEnd(buffers, isGreaterThan);
}

/**
 * Get the reachable buffered end across an iterable of SourceBuffers (typically `mediaSource.sourceBuffers`): the `min`
 * of each buffer's last buffered-range end — the furthest point every track can play to (the intersection end). Buffers
 * with no buffered ranges are skipped. Returns `0` when the collection is empty or no buffer has any buffered ranges.
 *
 * Counterpart to {@link getMaxBufferedEnd}: `max` bounds the overall presentation end (e.g. for setting `duration`),
 * `min` bounds where playback can actually reach when tracks end at slightly different times (e.g. skewed A/V near
 * end-of-stream).
 */
export function getMinBufferedEnd(buffers: SourceBufferIterable): number {
  return getBufferedEnd(buffers, isLessThan);
}

/**
 * Check if the preconditions are met to _attempt_ a `mediaSource.duration` write: a `mediaSource` is in scope and the
 * presentation has a valid positive duration (or `Infinity` for live).
 *
 * Does **not** check `mediaSource.readyState` or `mediaSource.duration` — those are DOM properties the caller resolves
 * at write time (e.g., by `await`ing `waitForMediaSourceOpen` and re-checking `readyState` after, and guarding on the
 * existing `mediaSource.duration` for idempotency). Keeping these off the signal-driven predicate lets callers use this
 * inside reactor state derivation without smuggling non-reactive DOM reads into `computed(...)`.
 *
 * `Infinity` is allowed — per the MSE spec, `mediaSource.duration = +Infinity` is how live playback signals an
 * indefinite duration.
 */
export function shouldUpdateDuration(
  presentation: MaybeResolvedPresentation | undefined,
  mediaSource: MediaSource | undefined
): boolean {
  if (!canUpdateDuration(presentation, mediaSource)) return false;

  const duration = presentation!.duration!;
  if (Number.isNaN(duration) || duration <= 0) return false;

  return true;
}

/**
 * Wait for all currently-updating SourceBuffers in `buffers` to finish, or until `signal` aborts — whichever fires
 * first.
 *
 * The MSE spec forbids setting `MediaSource.duration` while any attached SourceBuffer has `updating === true`. This
 * defers until all are idle. Listeners are registered with `{ signal }` so an abort tears them down up-front rather
 * than leaving them dangling until the next `updateend`.
 */
export function waitForSourceBuffersReady(buffers: SourceBufferIterable, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();

  const updating: SourceBuffer[] = [];

  for (const buf of buffers) {
    if (buf.updating) updating.push(buf);
  }

  if (updating.length === 0) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let remaining = updating.length;
    const onUpdateEnd = () => {
      remaining--;

      if (remaining === 0) resolve();
    };

    for (const buf of updating) {
      buf.addEventListener('updateend', onUpdateEnd, { once: true, signal });
    }

    signal.addEventListener('abort', () => resolve(), { once: true });
  });
}
