import { MediaError } from '@videojs/media';
import { deepEqual } from '@videojs/utils/object';
import { isAbortError } from '@videojs/utils/predicate';

import { type KalturaEntry, requestKalturaEntry } from './api';
import {
  createKalturaPlaybackURL,
  createPlaySessionId,
  KALTURA_CLIENT_TAG,
  resolveKalturaReferrer,
  selectKalturaPlaybackSource,
} from './playback';
import type { KalturaEntryRequest } from './source';

/**
 * One Kaltura entry, across the API request that resolves it to a stream.
 *
 * Keyed by the request, so a source assignment that names the same entry the same way keeps the result, and one that
 * moves anything drops it along with a request in flight. A `playManifest` URL the source names plays as written, right
 * away, and the request only fills in the entry's metadata. A Media owns one of these next to its `source`, and hands
 * `url` to its engine when `onChange` says the entry settled.
 */
export class KalturaEntryLoader {
  #request: KalturaEntryRequest | null = null;
  #playSessionId: string | undefined;
  #url: string | undefined;
  #entry: KalturaEntry | undefined;
  #error: MediaError | null = null;
  #inFlight: AbortController | null = null;
  #settled = false;
  readonly #onChange: () => void;

  constructor(onChange: () => void) {
    this.#onChange = onChange;
  }

  /** The entry this loader resolves, or `null` for a source that names none. */
  get request(): KalturaEntryRequest | null {
    return this.#request;
  }

  /** The stream to play, once known. */
  get url(): string | undefined {
    return this.#url;
  }

  /** The entry's metadata, once the request settles. */
  get entry(): KalturaEntry | undefined {
    return this.#entry;
  }

  /** Why the entry cannot play, once the request settles. */
  get error(): MediaError | null {
    return this.#error;
  }

  /** Identifies this playback to Kaltura. A new one is generated for each entry. */
  get playSessionId(): string | undefined {
    return this.#playSessionId;
  }

  /**
   * Re-key to `request`, reporting whether it named something else. An equal request leaves everything alone; any other
   * drops the result and aborts a request in flight. Quiet either way: the owner reads the new state right after.
   */
  reset(request: KalturaEntryRequest | null): boolean {
    if (deepEqual(request, this.#request)) return false;

    this.#abort();
    this.#request = request;
    this.#entry = undefined;
    this.#error = null;
    this.#settled = false;
    this.#playSessionId = request ? createPlaySessionId() : undefined;
    this.#url = request?.manifestUrl && this.#createPlaybackURL(request, request.manifestUrl);

    return true;
  }

  /**
   * Resolve the current entry. Ignored without one, and while a request is on its way or after it succeeded, so
   * repeated loads of one entry cost one request. A failed entry is asked for again.
   */
  load(): void {
    const request = this.#request;
    if (!request || this.#inFlight || (this.#settled && !this.#error)) return;

    const controller = (this.#inFlight = new AbortController());

    this.#error = null;

    void requestKalturaEntry({
      serviceUrl: request.serviceUrl,
      partnerId: request.partnerId,
      entryId: request.entryId,
      ks: request.ks,
      clientTag: KALTURA_CLIENT_TAG,
      referrer: resolveKalturaReferrer(request.referrer),
      signal: controller.signal,
    }).then(
      (response) => {
        if (controller.signal.aborted) return;

        this.#entry = response.entry;

        if (!request.manifestUrl) {
          const source = selectKalturaPlaybackSource(response, request.deliveryProfileId);

          if (source instanceof MediaError) this.#error = source;
          else this.#url = this.#createPlaybackURL(request, source.url);
        }

        this.#settle();
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;

        // The metadata a manifest URL waits for is optional; the URL plays either way.
        if (!request.manifestUrl) {
          this.#error =
            error instanceof MediaError ? error : new MediaError(undefined, MediaError.MEDIA_ERR_NETWORK, true);
        }

        this.#settle();
      }
    );
  }

  destroy(): void {
    this.#abort();
  }

  #settle(): void {
    this.#inFlight = null;
    this.#settled = true;
    this.#onChange();
  }

  #createPlaybackURL(request: KalturaEntryRequest, url: string): string {
    return createKalturaPlaybackURL(url, {
      ks: request.ks,
      uiConfId: request.uiConfId,
      playSessionId: this.#playSessionId!,
      referrer: resolveKalturaReferrer(request.referrer),
    });
  }

  #abort(): void {
    this.#inFlight?.abort();
    this.#inFlight = null;
  }
}
