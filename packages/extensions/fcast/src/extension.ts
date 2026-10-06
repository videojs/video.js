import type { MediaOverride, PlayerTarget } from '@videojs/core/dom';
import { resolveMimeType } from '@videojs/media';
import { getMediaElement, type HTMLMediaTargetLike } from '@videojs/media/dom';
import { isUndefined } from '@videojs/utils/predicate';

import type { FCastSender, FCastSnapshot } from './sender';

const EMPTY_SNAPSHOT: FCastSnapshot = {
  availability: 'unsupported',
  connection: 'disconnected',
  paused: true,
  currentTime: 0,
  duration: NaN,
  volume: 1,
  muted: false,
  speed: 1,
};

/** @experimental */
export interface FCastExtensionProps {
  /** Native SDK sender or application bridge that discovers and controls FCast receivers. */
  sender?: FCastSender | undefined;
  /** URL loaded by the receiver; defaults to the attached media's playable URL. */
  src?: string | undefined;
  /** MIME type sent to the receiver; inferred from the URL when absent. */
  contentType?: string | undefined;
}

/**
 * Routes player playback controls to an application-provided FCast sender while connected. A separate FCast button can
 * register this extension alongside Google Cast and AirPlay controls; FCast never replaces their Remote Playback API.
 *
 * @experimental
 */
export class FCastExtension extends EventTarget implements FCastExtensionProps {
  static readonly defaultProps: FCastExtensionProps = {
    sender: undefined,
    src: undefined,
    contentType: undefined,
  };

  #sender: FCastSender | undefined;
  #src: string | undefined;
  #contentType: string | undefined;
  #media: HTMLMediaTargetLike | null = null;
  #detachedMedia: HTMLMediaTargetLike | null = null;
  #loadedSrc: string | null = null;
  #pendingLoad: Promise<void> | null = null;
  #connected = false;
  #wasPlaying = false;
  #firstLoad = false;
  #lastSnapshot = EMPTY_SNAPSHOT;
  #override: MediaOverride;
  #version = 0;

  constructor(props: FCastExtensionProps = {}) {
    super();
    this.#override = this.#createOverride();
    Object.assign(this, props);
  }

  /** @internal Player lifecycle. */
  attach({ media }: PlayerTarget): void {
    // SAFETY: the DOM player resolves native elements and HTML media adapters with this shared surface.
    const target = media as HTMLMediaTargetLike;
    if (this.#media === target) return;

    this.detach();
    this.#media = target;
    this.#detachedMedia = null;
    target.addEventListener('loadstart', this.#onLoadStart);

    if (this.#connected) {
      this.#wasPlaying = !target.paused;
      target.pause();
      this.#firstLoad = true;
      this.#loadedSrc = null;
    }

    this.#followSource();
    this.#notify();
  }

  /** @internal Player lifecycle. */
  detach(): void {
    const media = this.#media;

    media?.removeEventListener('loadstart', this.#onLoadStart);
    this.#detachedMedia = media;
    this.#media = null;

    if (media) this.#notify();
  }

  destroy(): void {
    this.disconnect();
    this.detach();
    this.#sender?.removeEventListener('change', this.#onSenderChange);

    this.#sender = undefined;
    this.#connected = false;
    this.#detachedMedia = null;
  }

  /** @internal Player lifecycle. */
  disconnect(): void {
    if (!this.#connected) return;

    this.#connected = false;
    this.#loadedSrc = null;
    this.#restoreLocal(this.#lastSnapshot, this.#media ?? this.#detachedMedia);
    void this.#sender?.disconnect().catch(this.#reportError);
    this.#notify();
  }

  /** @internal Read by the player media facade. */
  get mediaOverride(): MediaOverride | null {
    return this.#connected ? this.#override : null;
  }

  /** Last state published by the supplied sender. */
  get snapshot(): FCastSnapshot {
    return this.#sender?.snapshot ?? EMPTY_SNAPSHOT;
  }

  /** Increments whenever the sender publishes state; suitable for subscribing to this extension. */
  get version(): number {
    return this.#version;
  }

  /** Whether the attached media permits remote playback. */
  get enabled(): boolean {
    return !!this.#media && !this.#media.disableRemotePlayback;
  }

  get sender(): FCastSender | undefined {
    return this.#sender;
  }

  set sender(value: FCastSender | undefined) {
    if (this.#sender === value) return;

    const previous = this.#sender;

    previous?.removeEventListener('change', this.#onSenderChange);

    if (previous && this.#connected) {
      this.#connected = false;
      this.#restoreLocal(this.#lastSnapshot);
      void previous.disconnect().catch(this.#reportError);
    }

    this.#sender = value;
    this.#loadedSrc = null;
    this.#lastSnapshot = EMPTY_SNAPSHOT;
    value?.addEventListener('change', this.#onSenderChange);
    this.#onSenderChange();
  }

  get src(): string {
    if (!isUndefined(this.#src)) return this.#src;

    const media = this.#media;
    if (!media || !getMediaElement(media)) return '';

    if (media.src && !media.src.startsWith('blob:')) return media.src;

    if (media.currentSrc && !media.currentSrc.startsWith('blob:')) return media.currentSrc;

    return media.querySelector<HTMLSourceElement>('source')?.src ?? '';
  }

  set src(value: string | undefined) {
    if (this.#src === value) return;

    this.#src = value;
    this.#followSource();
  }

  get contentType(): string | undefined {
    return this.#contentType;
  }

  set contentType(value: string | undefined) {
    if (this.#contentType === value) return;

    this.#contentType = value;
    this.#loadedSrc = null;
    this.#followSource();
  }

  /** Ask the supplied sender to pick a receiver, or disconnect the current one. */
  async toggle(): Promise<void> {
    const sender = this.#sender;
    if (!sender) throw new DOMException('FCast sender is not configured.', 'NotSupportedError');

    if (!this.enabled) throw new DOMException('Remote playback is disabled.', 'InvalidStateError');

    if (sender.snapshot.connection === 'connected') await sender.disconnect();
    else await sender.prompt();
  }

  /** Load the current media URL on the connected receiver. */
  async load(): Promise<void> {
    const sender = this.#sender;
    const media = this.#media;
    const src = this.src;
    if (!sender || !media || !this.#connected || !src) return;

    if (src === this.#loadedSrc) return this.#pendingLoad ?? undefined;

    const firstLoad = this.#firstLoad;

    this.#firstLoad = false;
    this.#loadedSrc = src;
    const request = {
      url: src,
      contentType: this.#contentType ?? resolveMimeType(src) ?? '',
      time: media.currentTime || 0,
      paused: firstLoad ? !this.#wasPlaying : sender.snapshot.paused,
      volume: media.muted ? 0 : media.volume,
      speed: media.playbackRate,
    };

    const pending = (this.#pendingLoad ?? Promise.resolve())
      .catch(() => {})
      .then(() => sender.load(request))
      .catch((error: unknown) => {
        if (this.#loadedSrc === src) this.#loadedSrc = null;

        throw error;
      });

    this.#pendingLoad = pending;

    try {
      await pending;
    } finally {
      if (this.#pendingLoad === pending) this.#pendingLoad = null;
    }
  }

  #onLoadStart = () => this.#followSource();

  #followSource(): void {
    if (this.#connected && this.src && this.#loadedSrc !== this.src) {
      void this.load().catch(this.#reportError);
    }
  }

  #onSenderChange = (): void => {
    const next = this.snapshot;
    const previous = this.#lastSnapshot;
    const connected = next.connection === 'connected';
    const wasConnected = this.#connected;

    if (connected && !wasConnected) {
      this.#wasPlaying = !this.#media?.paused;
      this.#media?.pause();
      this.#connected = true;
      this.#firstLoad = true;
      this.#loadedSrc = null;
      this.#followSource();
    } else if (!connected && wasConnected) {
      this.#connected = false;
      this.#loadedSrc = null;
      this.#restoreLocal(previous);
    }

    if (connected) {
      if (!wasConnected || next.paused !== previous.paused) {
        this.#media?.dispatchEvent(new Event(next.paused ? 'pause' : 'play'));
      }

      if (!wasConnected || next.currentTime !== previous.currentTime)
        this.#media?.dispatchEvent(new Event('timeupdate'));

      if (!wasConnected || next.duration !== previous.duration) this.#media?.dispatchEvent(new Event('durationchange'));

      if (!wasConnected || next.volume !== previous.volume || next.muted !== previous.muted) {
        this.#media?.dispatchEvent(new Event('volumechange'));
      }

      if (!wasConnected || next.speed !== previous.speed) this.#media?.dispatchEvent(new Event('ratechange'));

      if (next.buffering !== previous.buffering) {
        this.#media?.dispatchEvent(new Event(next.buffering ? 'waiting' : 'playing'));
      }

      if (next.ended && !previous.ended) this.#media?.dispatchEvent(new Event('ended'));
    }

    this.#lastSnapshot = { ...next };
    this.#notify();
  };

  #notify(): void {
    this.#version += 1;
    this.dispatchEvent(new Event('change'));
  }

  #restoreLocal(snapshot: FCastSnapshot, media = this.#media): void {
    if (!media) return;

    if (Number.isFinite(snapshot.currentTime)) media.currentTime = snapshot.currentTime;

    media.volume = snapshot.volume;
    media.muted = snapshot.muted;
    media.playbackRate = snapshot.speed;

    if (!snapshot.paused && !snapshot.ended) void media.play().catch(this.#reportError);
  }

  #createOverride(): MediaOverride {
    const extension = this;

    return {
      get paused() {
        return extension.snapshot.paused;
      },
      get ended() {
        return extension.snapshot.ended ?? false;
      },
      get readyState() {
        return extension.snapshot.buffering ? 2 : 3;
      },
      get currentTime() {
        return extension.snapshot.currentTime;
      },
      set currentTime(value: number) {
        void extension.#sender?.seek(value).catch(extension.#reportError);
      },
      get duration() {
        return extension.snapshot.duration;
      },
      get volume() {
        return extension.snapshot.volume;
      },
      set volume(value: number) {
        void extension.#sender?.setVolume(value).catch(extension.#reportError);
      },
      get muted() {
        return extension.snapshot.muted;
      },
      set muted(value: boolean) {
        void extension.#sender?.setVolume(value ? 0 : (extension.#media?.volume ?? 1)).catch(extension.#reportError);
      },
      get playbackRate() {
        return extension.snapshot.speed;
      },
      set playbackRate(value: number) {
        void extension.#sender?.setSpeed(value).catch(extension.#reportError);
      },
      play() {
        if (extension.snapshot.ended) {
          extension.#loadedSrc = null;
          extension.#firstLoad = true;
          extension.#wasPlaying = true;
          return extension.load();
        }

        return extension.#sender?.play() ?? Promise.resolve();
      },
      pause() {
        void extension.#sender?.pause().catch(extension.#reportError);
      },
      load() {
        void extension.load().catch(extension.#reportError);
      },
    };
  }

  #reportError = (error: unknown): void => {
    if (__DEV__) console.error('[FCast]', error);
  };
}
