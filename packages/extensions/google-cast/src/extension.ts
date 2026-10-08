import type { MediaOverride, PlayerTarget } from '@videojs/core/dom';
import type { MediaStreamType } from '@videojs/media';
import { getMediaElement, type HTMLMediaTargetLike } from '@videojs/media/dom';
import { isUndefined } from '@videojs/utils/predicate';

import { GoogleCastProvider } from './provider';
import { requiresCastFramework } from './utils';

export interface GoogleCastExtensionProps {
  /** Source URL loaded on the Cast receiver. Falls back to the source the media is playing. */
  src?: string | undefined;
  /** MIME type of the Cast source. When unset, the receiver infers it from the URL. */
  contentType?: string | undefined;
  /** Stream type used on the Cast receiver. */
  streamType?: MediaStreamType | undefined;
  /** Cast receiver application ID. Defaults to Google's default media receiver. */
  receiver?: string | undefined;
  /** Custom data sent to the Cast receiver with the load request. */
  customData?: Record<string, unknown> | null | undefined;
}

/**
 * Player extension that adds Google Cast to whatever media the player attaches: a plain `<video>`, a media component,
 * or a media adapter. While a cast session is connected, playback members the player reads route to the receiver;
 * otherwise only `remote` is taken over so the cast button can prompt.
 *
 * Its `PlayerExtension` members are internal: the player drives them, and the element and hook that register it check
 * that it conforms.
 */
export class GoogleCastExtension implements GoogleCastExtensionProps {
  static readonly defaultProps: GoogleCastExtensionProps = {
    src: undefined,
    contentType: undefined,
    streamType: undefined,
    receiver: undefined,
    customData: undefined,
  };

  #src: string | undefined;
  #contentType: string | undefined;
  #streamType: MediaStreamType | undefined;
  #receiver: string | undefined;
  #customData: Record<string, unknown> | null | undefined;
  #media: HTMLMediaTargetLike | null = null;
  #provider: GoogleCastProvider | null = null;
  #override: MediaOverride | null = null;
  #connected = false;

  constructor(props: GoogleCastExtensionProps = {}) {
    Object.assign(this, props);
  }

  /** @internal Player lifecycle; the player calls it. */
  attach({ media }: PlayerTarget) {
    // Every media the player resolves (native element, media component, adapter) exposes this surface.
    const target = media as HTMLMediaTargetLike;
    if (this.#media === target) return;

    this.detach();
    this.#media = target;

    if (requiresCastFramework() && !this.#provider) {
      this.#provider = new GoogleCastProvider(this);
      this.#provider.remote.addEventListener('connect', this.#onStateChange);
      this.#provider.remote.addEventListener('disconnect', this.#onStateChange);
      this.#override = this.#createRemoteOverride();
    }

    this.#bindProvider();
    target.addEventListener('loadstart', this.#onLoadStart);

    // A media swapped in mid-session may have started loading before the player attached it, so its `loadstart` has
    // already fired; follow its source now rather than waiting for one that may never come.
    this.#followSource();
  }

  /** @internal Player lifecycle; the player calls it. */
  detach() {
    this.#media?.removeEventListener('loadstart', this.#onLoadStart);
    this.#media = null;
    this.#provider?.detach();
  }

  destroy() {
    this.detach();
    this.#provider?.destroy();
    this.#provider = null;
    this.#override = null;
    this.#connected = false;
  }

  /** @internal Read by the player to route media members to the receiver. */
  get mediaOverride() {
    return this.#override;
  }

  /**
   * Point the provider at the native element behind the media: its `<track>` children carry the real modes, and events
   * dispatched there already forward through any custom element or adapter to the player's listeners. A custom element
   * or adapter can swap that element (an engine change, for example), so this runs again on every `loadstart`.
   */
  #bindProvider() {
    const provider = this.#provider;
    const media = this.#media;
    if (!provider || !media) return;

    const element = (getMediaElement(media) as HTMLMediaTargetLike | null) ?? media;
    if (provider.target === element) return;

    if (provider.target) provider.detach();

    provider.attach(element);
  }

  #onStateChange = () => {
    if (!this.#provider) return;

    this.#connected = this.#provider.remote.state === 'connected';
    this.#override = this.#connected ? (this.#provider as MediaOverride) : this.#createRemoteOverride();
  };

  /** The media started loading a new source locally. */
  #onLoadStart = () => {
    this.#bindProvider();
    this.#followSource();
  };

  /**
   * While casting, load the media's current source on the receiver unless it is already there. The provider claims the
   * source before it starts loading, so the several `loadstart`s one local load can produce reach the receiver once.
   */
  #followSource() {
    // Read the tracked state, not `provider.remote`: that getter loads the Cast SDK, which attaching must not do.
    const provider = this.#provider;
    if (!provider || !this.#connected) return;

    const { src } = this;
    if (!src || provider.loadedSrc === src) return;

    void provider.load();
  }

  #createRemoteOverride(): MediaOverride {
    const provider = this.#provider!;

    return {
      get remote() {
        return provider.remote;
      },
    };
  }

  /**
   * Source URL loaded on the Cast receiver. Falls back to the source the media is playing: its `src`, else the
   * `<source>` child the browser selected (`currentSrc`), else the first `<source>` child before selection has run. An
   * adapter reports the URL it plays on `src`; a `blob:` `currentSrc` is a MediaSource handle a receiver can't load.
   *
   * An embed (YouTube, Vimeo) has no fallback: its `src` is a provider page, not a stream a receiver can play, so it is
   * cast only when this is set explicitly. Without a source, nothing is loaded on the receiver.
   */
  get src() {
    if (!isUndefined(this.#src)) return this.#src;

    const media = this.#media;
    if (!media || !getMediaElement(media)) return '';

    if (media.src) return media.src;

    if (media.currentSrc && !media.currentSrc.startsWith('blob:')) return media.currentSrc;

    return media.querySelector<HTMLSourceElement>('source')?.src ?? '';
  }

  set src(value: string | undefined) {
    if (this.#src === value) return;

    this.#src = value;
    this.#load();
  }

  /** MIME type of the Cast source. When unset, the receiver infers it from the URL. */
  get contentType() {
    return this.#contentType;
  }

  set contentType(value: string | undefined) {
    if (this.#contentType === value) return;

    this.#contentType = value;
    this.#load();
  }

  /** Stream type used on the Cast receiver. Falls back to the media's `streamType` if it exposes one. */
  get streamType() {
    return this.#streamType ?? this.#media?.streamType;
  }

  set streamType(value: MediaStreamType | undefined) {
    if (this.#streamType === value) return;

    this.#streamType = value;
    this.#load();
  }

  /** Cast receiver application ID. Read on session start; falls back to the layer's default. */
  get receiver() {
    return this.#receiver;
  }

  set receiver(value: string | undefined) {
    if (this.#receiver === value) return;

    this.#receiver = value;
    this.#load();
  }

  /** Custom data sent to the Cast receiver with the load request. */
  get customData() {
    return this.#customData;
  }

  set customData(value: Record<string, unknown> | null | undefined) {
    if (this.#customData === value) return;

    this.#customData = value;
    this.#load();
  }

  #load() {
    if (this.#provider?.remote.state === 'connected') {
      void this.#provider.load();
    }
  }
}
