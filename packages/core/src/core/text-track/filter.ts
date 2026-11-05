import type { MediaTextTrack, TextTrackFilter } from '@videojs/media';
import { isFunction, isString, isUndefined } from '@videojs/utils/predicate';

/**
 * Whether a text track matches a filter. Each field the filter gives must match, and a kind list matches any kind in
 * it.
 *
 * @internal
 */
export function matchTextTrack(track: MediaTextTrack, filter: TextTrackFilter): boolean {
  if (isFunction(filter)) return filter(track);

  const { kind, label, language } = filter;
  if (!isUndefined(kind) && !(isString(kind) ? kind === track.kind : kind.includes(track.kind))) return false;

  if (!isUndefined(label) && label !== track.label) return false;

  if (!isUndefined(language) && language !== track.language) return false;

  return true;
}
