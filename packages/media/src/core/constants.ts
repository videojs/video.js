import type { RemotePlaybackLike, TextTrackListLike, TimeRangeLike } from './types';

/**
 * Brand on the shared empty placeholders below. `Symbol.for` so a page carrying two copies of the packages (CDN plus
 * npm, duplicate installs) still recognizes either copy's placeholders, which identity checks can't do.
 */
const EMPTY_PLACEHOLDER: unique symbol = Symbol.for('@videojs/media/empty');

function brandEmpty<T extends object>(value: T): T {
  return Object.defineProperty(value, EMPTY_PLACEHOLDER, { value: true });
}

/**
 * Whether `value` is one of the shared empty placeholders, from this or any other copy of the package.
 *
 * @internal
 */
export function isEmptyPlaceholder(value: unknown): boolean {
  return (value as { [EMPTY_PLACEHOLDER]?: true } | null | undefined)?.[EMPTY_PLACEHOLDER] === true;
}

/**
 * A frozen, empty `TimeRanges`-like value for hosts with no ranges.
 *
 * @internal
 */
export const EMPTY_TIME_RANGES: TimeRangeLike = Object.freeze(
  brandEmpty({
    length: 0,
    start: () => 0,
    end: () => 0,
  })
);

/**
 * A frozen, empty `TextTrackList`-like value for hosts with no text tracks.
 *
 * @internal
 */
export const EMPTY_TEXT_TRACKS: TextTrackListLike = brandEmpty(
  Object.assign(new EventTarget(), {
    length: 0,
    *[Symbol.iterator]() {},
    getTrackById: () => null,
  })
) as unknown as TextTrackListLike;

/** @internal */
export const EMPTY_REMOTE = brandEmpty(new EventTarget()) as unknown as RemotePlaybackLike;
