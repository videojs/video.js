import { HlsJsAdapter, type HlsJsAdapterProps, type HlsSource } from '@videojs/hlsjs-video';
import {
  createMuxPosterURL,
  createMuxStoryboardURL,
  createMuxVideoURL,
  type MuxContentData,
  type MuxDrmParams,
  MuxMetadataLoader,
  type MuxSourceBase,
  parseMuxVideoURL,
  toMuxContentData,
} from '@videojs/mux';
import { shallowEqual } from '@videojs/utils/object';

import { createMuxDrmSystems } from './drm';

/**
 * Structured Mux source for the hls.js-backed Media: Mux identity and params from {@link MuxSourceBase}, plus everything
 * the HLS layer takes — `type`, `preferPlayback`, and its `engine` config.
 */
export interface MuxSource extends HlsSource, MuxSourceBase {
  // Redeclared because `HlsSource` and `MuxSourceBase` both name `drm`, and Mux's is the wider of the two. Its
  // documentation is `MuxSourceBase`'s.
  drm?: MuxDrmParams | undefined;
}

export interface MuxVideoAdapterProps {
  src: string;
  source: MuxSource | null;
}

/**
 * @fires sourcechange - Fired when `source` changes, either directly or by parsing a new `src`. Read `source` for the
 *   new value.
 * @fires contentdatachange - Fired when `contentData` changes: the derived URLs with `source`, and the metadata once it
 *   loads. Read `contentData` for the new value.
 */
export class MuxVideoAdapter extends HlsJsAdapter implements MuxVideoAdapterProps {
  static override readonly defaultProps: Omit<HlsJsAdapterProps, 'source'> & MuxVideoAdapterProps = {
    ...HlsJsAdapter.defaultProps,
    src: '',
    source: null,
  };

  #source: MuxSource | null = MuxVideoAdapter.defaultProps.source;
  #contentData: MuxContentData = {};
  #metadata = new MuxMetadataLoader(() => {
    if (this.#refreshContentData()) this.dispatchEvent(new Event('contentdatachange'));
  });

  override destroy() {
    this.#metadata.destroy();
    super.destroy();
  }

  /**
   * Media source URL. Setting a Mux stream URL (`https://stream.mux.com/<playback-id>.m3u8?...`, with or without the
   * `.m3u8` extension) extracts the playback ID and query params into `source`; other URLs are kept as a plain
   * `source.src`.
   *
   * Only playback options carry over. Mux identity comes from the URL, and the signed `poster`, `storyboard`, and `drm`
   * tokens are scoped to a playback ID, so carrying them onto a different source would build rejected URLs.
   */
  get src(): string {
    return super.src;
  }

  set src(value: string) {
    const parsed = parseMuxVideoURL(value);
    // A URL already describing the current source leaves it alone, compared in
    // its canonical `.m3u8` form. `<mux-video>` reflects the derived `src` back to
    // the host, React re-syncs the authored one on every render, and re-deriving
    // would drop the params a Mux URL does not carry, such as `poster`.
    if (super.src === (createMuxVideoURL(parsed) ?? value)) return;

    const { type, preferPlayback, engine, maxAutoResolution, capRenditionToPlayerSize, minAutoResolution } =
      this.#source ?? {};
    const source: MuxSource = {
      ...(type && { type }),
      ...(preferPlayback && { preferPlayback }),
      ...(engine && { engine }),
      ...(maxAutoResolution && { maxAutoResolution }),
      ...(capRenditionToPlayerSize !== undefined && { capRenditionToPlayerSize }),
      ...(minAutoResolution && { minAutoResolution }),
      ...(parsed ?? (value ? { src: value } : null)),
    };

    this.source = Object.keys(source).length > 0 ? source : null;
  }

  /**
   * Structured Mux source. Setting it derives `src` from `playbackId`, `customDomain`, and `playback`, and the license
   * servers from `drm.token`.
   */
  get source(): MuxSource | null {
    return this.#source;
  }

  set source(value: MuxSource | null) {
    const source = value ?? null;
    // Changing anything takes a new object, so handing the same one back costs
    // nothing.
    if (source === this.#source) return;

    this.#source = source;
    this.#metadata.reset(source);

    // Refresh the bag before the base announces `sourcechange`, because
    // listeners read `contentData` from that event. Announcing its own change
    // waits until after, so `src` is in step by the time either event fires.
    const contentDataChanged = this.#refreshContentData();

    // Hand the same source down with `src` and the DRM license servers resolved
    // from the playback ID. The base keeps `src` in step, decides whether
    // playback has to reload, and dispatches `sourcechange`.
    super.source = source && {
      ...source,
      src: createMuxVideoURL(source) ?? source.src ?? '',
      ...withMuxDrm(source),
    };

    if (contentDataChanged) this.dispatchEvent(new Event('contentdatachange'));
  }

  /**
   * What `source` says about its content. `poster` and `storyboard` are the image URLs built from `playbackId` and the
   * `poster` and `storyboard` params. Each is absent when its URL can't be built: no playback ID, or signed playback
   * without a matching image token.
   *
   * `title` is the asset's title from the metadata document Mux publishes for it, or its `video_title` entry when the
   * document names no title. The document's other entries are included under their own keys. They arrive when the
   * document loads, after the media starts loading, and are absent until then, without a playback ID, or when the asset
   * has none.
   *
   * The same object is returned until something in it changes, and `contentdatachange` fires when it does, including
   * when the title arrives. A player uses `title` and `poster` when it sets no title or poster of its own, and the Mux
   * video component adds a thumbnails `<track>` from `storyboard`, except for live streams.
   */
  get contentData(): MuxContentData {
    return this.#contentData;
  }

  override load() {
    const loading = super.load();

    // The metadata goes with the load rather than the assignment: the same
    // playback ID may be assigned several times over without playing, and one
    // small request per source that actually loads is the right cost.
    this.#metadata.load();

    return loading;
  }

  /** Rebuild the bag from `source` and the metadata, reporting whether anything about it changed. */
  #refreshContentData(): boolean {
    const poster = createMuxPosterURL(this.#source);
    const storyboard = createMuxStoryboardURL(this.#source);

    const next: MuxContentData = {
      ...toMuxContentData(this.#metadata.metadata),
      ...(poster && { poster }),
      ...(storyboard && { storyboard }),
    };
    if (shallowEqual(this.#contentData, next)) return false;

    this.#contentData = next;
    return true;
  }
}

/**
 * Resolve Mux's DRM authoring input into the license servers the HLS layer licenses from. Which engine ends up playing
 * is decided later, and both read `drm`, so a signed Mux source plays either way.
 *
 * `token` is Mux's own input and stops here — it names no license server, and a key system is what everything
 * downstream expects to find. Servers the caller named win, key by key, so their own licensing replaces the derived
 * URLs.
 */
function withMuxDrm(source: MuxSource): Pick<HlsSource, 'drm'> {
  const { token: _token, ...systems } = source.drm ?? {};
  const drm = { ...createMuxDrmSystems(source), ...systems };

  return { drm: Object.keys(drm).length > 0 ? drm : undefined };
}
