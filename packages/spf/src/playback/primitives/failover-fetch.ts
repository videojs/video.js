import { isFunction, isObject } from '@videojs/utils/predicate';

import { type ReadonlySignal, type Signal, update } from '../../core/signals/primitives';
import type { MaybeResolvedPresentation } from '../../media/types';
import { addFailedCdn, getCdnId as defaultGetCdnId, type GetCdnId } from '../../media/utils/cdn';
import { findTrackById } from '../../media/utils/tracks';
import type { FetchOptions, Resource } from '../../network/fetch';

type SelectedTrackKey = 'selectedVideoTrackId' | 'selectedAudioTrackId' | 'selectedTextTrackId';

/**
 * State a failover-decorated fetch reads: the presentation, the per-type selected-track slot, and the failover
 * monitor's `failedCdns`.
 *
 * `failedCdns` is _optional_ — the failover monitor owns that slot, so a behavior's narrow state is assignable here
 * without the behavior declaring it (and the intersection shares keys, so it isn't a weak type). When no monitor is
 * composed the slot is absent and tracking no-ops.
 */
type FailoverState<K extends SelectedTrackKey> = {
  presentation: ReadonlySignal<MaybeResolvedPresentation | undefined>;
  failedCdns?: Signal<string[] | undefined>;
} & { [P in K]: ReadonlySignal<string | undefined> };

/** Any `Resource`-addressable fetch — both `FetchText` and `FetchBytes` qualify. */
type FailoverableFetch = (addressable: Resource, options?: FetchOptions) => Promise<unknown>;

/**
 * Decorate a fetch so a failed request or body read trips the **selected track's** CDN into `failedCdns`. The decorated
 * fetch's type is preserved, so this wraps both `resolve-track`'s playlist `FetchText` and the segment loaders'
 * `FetchBytes`.
 *
 * The CDN id comes from the selected track's media-playlist URL, never the failed addressable: a segment URL resolves
 * relative to its playlist and, per RFC 3986, drops the playlist's query string (`…/r.m3u8?cdn=fastly` → `…/0.ts`), so
 * a query-keyed `getCdnId` (e.g. Mux's `cdn=`) keyed on it would derive an id that never matches the ones
 * `deriveCdnPriority` / track-switching build from `track.url`. The in-flight fetch belongs to the selected track — a
 * source or track switch aborts it, and aborts don't trip — so the selected track is the right CDN to fail over. For
 * `resolve-track` the resolving track _is_ the selected track, so this is identical to keying on its addressable.
 *
 * No-op when no failover monitor is composed (it owns the signal) or the selected track can't be located.
 */
export function failoverFetch<K extends SelectedTrackKey, Fetch extends FailoverableFetch>(
  baseFetch: Fetch,
  state: FailoverState<K>,
  config: { selectedKey: K; getCdnId?: GetCdnId }
): Fetch {
  const getCdnId = config.getCdnId ?? defaultGetCdnId;

  const trackFailure = (options?: FetchOptions) => {
    if (options?.signal?.aborted || !state.failedCdns) return;

    const presentation = state.presentation.get();
    const trackId = state[config.selectedKey].get();
    const track = presentation && trackId ? findTrackById(presentation, trackId) : undefined;

    if (track) update(state.failedCdns, (cdns) => addFailedCdn(cdns, getCdnId(track.url)));
  };

  // SAFETY: the wrapper preserves fetch arguments and text or byte-iterable results.
  return (async (addressable: Resource, options?: FetchOptions) => {
    try {
      const result = await baseFetch(addressable, options);

      if (!isObject(result) || !(Symbol.asyncIterator in result) || !isFunction(result[Symbol.asyncIterator])) {
        return result;
      }

      // SAFETY: the result has a callable async iterator, as required by AsyncIterable.
      const body = result as AsyncIterable<unknown>;

      return {
        async *[Symbol.asyncIterator]() {
          try {
            yield* body;
          } catch (error) {
            trackFailure(options);
            throw error;
          }
        },
      };
    } catch (error) {
      trackFailure(options);
      throw error;
    }
  }) as Fetch;
}
