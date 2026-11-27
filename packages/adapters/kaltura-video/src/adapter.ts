import { HlsJsAdapter, type HlsJsAdapterProps, type HlsSource } from '@videojs/hlsjs-video';
import type { MediaContentData, MediaError } from '@videojs/media';
import { shallowEqual } from '@videojs/utils/object';

import { KalturaEntryLoader } from './loader';
import { createKalturaPosterURL } from './playback';
import { type KalturaSource, readKalturaSourceFields, toKalturaEntryRequest } from './source';

export interface KalturaVideoAdapterProps {
  src: string;
  source: KalturaSource | null;
}

/**
 * @fires sourcechange - Fired when `source` changes, either directly or by parsing a new `src`, and again when the
 *   entry it names resolves to a stream. Read `source` for the new value.
 * @fires contentdatachange - Fired when `contentData` changes: the poster with `source`, and the title once the entry
 *   resolves. Read `contentData` for the new value.
 * @fires error - Fired when the entry cannot play: Kaltura does not know it, access control blocks it, moderation holds
 *   it back, a live entry is not broadcasting, or it has no unprotected HLS stream. Read `error` for the details.
 */
export class KalturaVideoAdapter extends HlsJsAdapter implements KalturaVideoAdapterProps {
  static override readonly defaultProps: Omit<HlsJsAdapterProps, 'source'> & KalturaVideoAdapterProps = {
    ...HlsJsAdapter.defaultProps,
    src: '',
    source: null,
  };

  #source: KalturaSource | null = KalturaVideoAdapter.defaultProps.source;
  #contentData: MediaContentData = {};
  #entry = new KalturaEntryLoader(() => this.#onEntrySettled());

  override destroy() {
    this.#entry.destroy();
    super.destroy();
  }

  /**
   * Media source URL: a Kaltura URL or `kaltura/<partnerId>/<entryId>` shorthand. Setting one reads the partner, entry,
   * player configuration, and any Kaltura Session it carries into `source`; any other URL is kept as a plain HLS
   * `source.src`.
   *
   * Reads back as written. The stream a Kaltura entry resolves to is an implementation detail, and it carries the
   * session, so it is never reflected here.
   *
   * Only playback options carry over, along with `referrer`. The entry, its session, and its deployment come from the
   * URL.
   */
  get src(): string {
    return this.#source?.src ?? '';
  }

  set src(value: string) {
    if (value === this.src) return;

    const { type, preferPlayback, engine, maxAutoResolution, capRenditionToPlayerSize, minAutoResolution, referrer } =
      this.#source ?? {};
    const source: KalturaSource = {
      ...(type && { type }),
      ...(preferPlayback && { preferPlayback }),
      ...(engine && { engine }),
      ...(maxAutoResolution && { maxAutoResolution }),
      ...(capRenditionToPlayerSize !== undefined && { capRenditionToPlayerSize }),
      ...(minAutoResolution && { minAutoResolution }),
      ...(referrer !== undefined && { referrer }),
      ...(value && { src: value, ...readKalturaSourceFields(value) }),
    };

    this.source = Object.keys(source).length > 0 ? source : null;
  }

  /**
   * Structured Kaltura source. Naming a `partnerId` and an `entryId`, directly or through `src`, resolves the entry
   * with one Kaltura API request when the media loads, then plays its HLS stream through hls.js. A `playManifest` HLS
   * URL plays as written, and the request only fills in `contentData`.
   *
   * Sources are compared by the entry they resolve, so assigning an equal one keeps the stream already resolved.
   */
  get source(): KalturaSource | null {
    return this.#source;
  }

  set source(value: KalturaSource | null) {
    const source = value ?? null;
    if (source === this.#source) return;

    const failed = this.#entry.error;

    this.#source = source;

    // An element that failed has nothing left to empty, so the browser would not
    // announce the next source the way it does after a failed load.
    if (this.#entry.reset(toKalturaEntryRequest(source)) && failed) this.dispatchEvent(new Event('emptied'));

    // Refresh the bag before the base announces `sourcechange`, because
    // listeners read `contentData` from that event.
    const contentDataChanged = this.#refreshContentData();

    super.source = this.#toHlsSource();

    if (contentDataChanged) this.dispatchEvent(new Event('contentdatachange'));
  }

  /**
   * Why the entry cannot play, or the engine's error once it plays. Errors from Kaltura carry its error code in
   * `context`, such as `ENTRY_ID_NOT_FOUND`, `INVALID_KS`, or an access-control code such as `COUNTRY_RESTRICTED`, and
   * a blocked entry carries the publisher's message.
   */
  override get error(): MediaError | null {
    return this.#entry.error ?? super.error;
  }

  /**
   * What `source` says about its content: a `poster` from Kaltura's thumbnail API as soon as the source names an entry,
   * and the entry's `title` once it resolves. The same object is handed back until something in it changes, and
   * `contentdatachange` announces it when it does.
   */
  get contentData(): MediaContentData {
    return this.#contentData;
  }

  /**
   * Identifies this playback to Kaltura, sent as `playSessionId` with every stream request. A new one is generated for
   * each entry. `undefined` while the source names no Kaltura entry.
   */
  get playSessionId(): string | undefined {
    return this.#entry.playSessionId;
  }

  override load() {
    const failed = this.#entry.error;

    // Resolving goes with the load rather than the assignment: one request per
    // entry that actually loads.
    this.#entry.load();

    if (failed && !this.#entry.error) this.dispatchEvent(new Event('emptied'));

    return super.load();
  }

  /** The HLS half of `source`, with `src` swapped for the stream to play, empty until the entry resolves to one. */
  #toHlsSource(): HlsSource | null {
    const source = this.#source;
    if (!source) return null;

    const {
      src,
      partnerId: _partnerId,
      entryId: _entryId,
      ks: _ks,
      uiConfId: _uiConfId,
      serviceUrl: _serviceUrl,
      referrer: _referrer,
      deliveryProfileId: _deliveryProfileId,
      ...hls
    } = source;
    const stream = this.#entry.request ? this.#entry.url : src;

    return { ...hls, ...(stream && { src: stream }) };
  }

  #onEntrySettled() {
    const contentDataChanged = this.#refreshContentData();

    if (this.#entry.error) {
      this.dispatchEvent(new ErrorEvent('error', { error: this.#entry.error, message: this.#entry.error.message }));
    } else {
      super.source = this.#toHlsSource();
    }

    if (contentDataChanged) this.dispatchEvent(new Event('contentdatachange'));
  }

  /** Rebuild the bag from the entry, reporting whether anything about it changed. */
  #refreshContentData(): boolean {
    const request = this.#entry.request;
    const title = this.#entry.entry?.name;
    const next: MediaContentData = request
      ? {
          poster: createKalturaPosterURL(request.serviceUrl, request.partnerId, request.entryId),
          ...(title && { title }),
        }
      : {};
    if (shallowEqual(this.#contentData, next)) return false;

    this.#contentData = next;
    return true;
  }
}
