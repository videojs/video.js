import { type MediaOverride, type PlayerTarget, setRemotePlaybackState } from '@videojs/core/dom';
import { resolveMimeType } from '@videojs/media';
import { getMediaElement, type HTMLMediaTargetLike } from '@videojs/media/dom';
import { isUndefined } from '@videojs/utils/predicate';

import type { FCastLoadRequest, FCastMetadata, FCastSender, FCastSnapshot, FCastSubtitle } from './sender';

const EMPTY_SNAPSHOT: FCastSnapshot = {
  availability: 'unsupported',
  connection: 'disconnected',
  playbackState: 'idle',
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
  /** Receiver display metadata; falls back to the media's title and poster. */
  metadata?: FCastMetadata | undefined;
}

/**
 * Routes player playback controls to an application-provided FCast sender while connected. The opt-in HTML or React
 * extension component owns its lifecycle; FCast buttons observe it alongside Google Cast and AirPlay controls.
 *
 * @experimental
 */
export class FCastExtension extends EventTarget implements FCastExtensionProps {
  static readonly defaultProps: FCastExtensionProps = {
    sender: undefined,
    src: undefined,
    contentType: undefined,
    metadata: undefined,
  };

  #sender: FCastSender | undefined;
  #src: string | undefined;
  #contentType: string | undefined;
  #metadata: FCastMetadata | undefined;
  #trackTarget: HTMLMediaElement | null = null;
  #selectedSubtitle: string | null | undefined;
  #syncingTracks = false;
  #awaitingMedia = false;
  #seek: { time: number; timer: ReturnType<typeof setTimeout> } | null = null;
  #media: HTMLMediaTargetLike | null = null;
  #detachedMedia: HTMLMediaTargetLike | null = null;
  #loadedSrc: string | null = null;
  #pendingLoad: Promise<void> | null = null;
  #connected = false;
  #wasPlaying = false;
  #firstLoad = false;
  #replaying = false;
  #lastSnapshot = EMPTY_SNAPSHOT;
  #override: MediaOverride;
  #version = 0;
  #session = 0;
  #unmutedVolume = 1;

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
    this.#bindTracks();

    if (this.#connected && this.enabled) {
      this.#wasPlaying = !target.paused;
      target.pause();
      this.#firstLoad = true;
      this.#loadedSrc = null;
      this.#adoptSession();
    }

    this.#followSource();
    this.#notify();
  }

  /** @internal Player lifecycle. */
  detach(): void {
    const media = this.#media;

    media?.removeEventListener('loadstart', this.#onLoadStart);
    this.#unbindTracks();

    if (media) setRemotePlaybackState(media, this, 'disconnected');

    this.#detachedMedia = media;
    this.#media = null;
    this.#invalidateLoads();

    if (media) this.#notify();
  }

  destroy(): void {
    this.disconnect();
    this.detach();
    this.#sender?.removeEventListener('change', this.#onSenderChange);
    this.#sender?.removeEventListener('error', this.#onSenderError);

    this.#sender = undefined;
    this.#connected = false;
    this.#detachedMedia = null;
  }

  /** @internal Player lifecycle. */
  disconnect(): void {
    if (!this.#connected && this.snapshot.connection !== 'connecting') return;

    const wasConnected = this.#connected;

    this.#connected = false;
    this.#invalidateLoads();

    if (wasConnected) this.#restoreLocal(this.#lastSnapshot, this.#media ?? this.#detachedMedia);

    void this.#sender?.disconnect().catch(this.#reportError);
    this.#notify();
  }

  /** @internal Read by the player media facade. */
  get mediaOverride(): MediaOverride | null {
    return this.#connected && this.enabled ? this.#override : null;
  }

  /** Last state published by the supplied sender. */
  get snapshot(): FCastSnapshot {
    const snapshot = this.#sender?.snapshot ?? EMPTY_SNAPSHOT;
    const { playbackState } = snapshot;

    return {
      ...snapshot,
      paused: playbackState === 'playing' ? false : playbackState === 'buffering' ? snapshot.paused : true,
      buffering: playbackState === 'buffering',
      ended: playbackState === 'ended',
    };
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
    previous?.removeEventListener('error', this.#onSenderError);

    if (previous && previous.snapshot.connection !== 'disconnected') {
      if (this.#connected) this.#restoreLocal(this.#lastSnapshot, this.#media ?? this.#detachedMedia);

      this.#connected = false;
      void previous.disconnect().catch(this.#reportError);
    }

    this.#invalidateLoads();
    this.#sender = value;
    this.#lastSnapshot = EMPTY_SNAPSHOT;
    value?.addEventListener('change', this.#onSenderChange);
    value?.addEventListener('error', this.#onSenderError);
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

  get metadata(): FCastMetadata | undefined {
    return this.#metadata;
  }

  set metadata(value: FCastMetadata | undefined) {
    if (this.#metadata === value) return;

    this.#metadata = value;
    this.#loadedSrc = null;
    this.#followSource();
  }

  /** Ask the supplied sender to pick a receiver, or disconnect the current one. */
  async toggle(): Promise<void> {
    const sender = this.#sender;
    if (!sender) throw new DOMException('FCast sender is not configured.', 'NotSupportedError');

    if (!this.enabled) throw new DOMException('Remote playback is disabled.', 'InvalidStateError');

    if (sender.snapshot.connection === 'connected') await sender.disconnect();
    else if (sender.snapshot.connection !== 'connecting') await sender.prompt();
  }

  /** Load the current media URL on the connected receiver. */
  async load(): Promise<void> {
    const sender = this.#sender;
    const media = this.#media;
    const src = this.src;
    if (!sender || !media || !this.#connected || !this.enabled || !src) return;

    if (src === this.#loadedSrc) return this.#pendingLoad ?? undefined;

    const firstLoad = this.#firstLoad;
    const session = this.#session;

    this.#finishSeek();

    this.#firstLoad = false;
    this.#loadedSrc = src;
    const snapshot = this.snapshot;
    const request: FCastLoadRequest = {
      url: src,
      contentType: this.#contentType ?? resolveMimeType(src) ?? '',
      time: snapshot.ended
        ? 0
        : !firstLoad && snapshot.mediaUrl === src
          ? snapshot.currentTime
          : media.currentTime || 0,
      paused: this.#replaying ? false : firstLoad ? !this.#wasPlaying : snapshot.paused,
      volume: firstLoad ? (media.muted ? 0 : media.volume) : sender.snapshot.muted ? 0 : sender.snapshot.volume,
      speed: firstLoad ? media.playbackRate : sender.snapshot.speed,
    };

    const element = getMediaElement(media);
    const title = this.#metadata?.title ?? element?.title ?? '';
    const thumbnailUrl = this.#metadata?.thumbnailUrl ?? (element instanceof HTMLVideoElement ? element.poster : '');

    if (title || thumbnailUrl) request.metadata = { title, thumbnailUrl };

    if (sender.setSubtitle) {
      const subtitles = this.#subtitles();

      request.subtitles = subtitles.map(({ subtitle }) => subtitle);
      request.selectedSubtitle = subtitles.find(({ track }) => track.mode === 'showing')?.subtitle.url ?? null;
      this.#selectedSubtitle = request.selectedSubtitle;
    }

    this.#replaying = false;
    this.#awaitingMedia = true;
    media.dispatchEvent(new Event('emptied'));

    const pending = (this.#pendingLoad ?? Promise.resolve())
      .catch(() => {})
      .then(() => {
        if (session !== this.#session || sender !== this.#sender || !this.#connected || !this.enabled) return;

        return sender.load(request);
      })
      .catch((error: unknown) => {
        if (session === this.#session && this.#loadedSrc === src) {
          this.#loadedSrc = null;
          this.#firstLoad = firstLoad;
          this.#awaitingMedia = true;
          this.#media?.dispatchEvent(new Event('emptied'));
        }

        throw error;
      });

    this.#pendingLoad = pending;

    try {
      await pending;
    } finally {
      if (this.#pendingLoad === pending) {
        this.#pendingLoad = null;

        if (this.#loadedSrc === src) this.#onTextTrackChange();
      }
    }
  }

  #invalidateLoads(): void {
    this.#finishSeek();
    this.#session += 1;
    this.#loadedSrc = null;
    this.#pendingLoad = null;
    this.#awaitingMedia = false;
    this.#selectedSubtitle = undefined;
  }

  #onLoadStart = () => {
    this.#bindTracks();

    if (this.#connected && this.enabled) this.#media?.pause();

    this.#followSource();
  };

  #followSource(): void {
    if (this.#connected && this.src && this.#loadedSrc !== this.src) {
      void this.load().catch(this.#reportError);
    }
  }

  #adoptSession(): void {
    const snapshot = this.snapshot;
    if (!this.src || snapshot.mediaUrl !== this.src || snapshot.playbackState === 'idle' || snapshot.ended) return;

    this.#loadedSrc = this.src;
    this.#firstLoad = false;
    this.#awaitingMedia = false;
    this.#syncRemoteSubtitle();
  }

  #startSeek(time: number): void {
    const sender = this.#sender;
    if (!sender || !this.#media || !Number.isFinite(time)) return;

    if (this.#seek) clearTimeout(this.#seek.timer);

    const seek = {
      time,
      timer: setTimeout(() => {
        if (this.#seek !== seek) return;

        this.#finishSeek();
        this.#reportError(new DOMException('FCast receiver did not confirm the seek.', 'TimeoutError'));
      }, 10_000),
    };

    this.#seek = seek;
    this.#media.dispatchEvent(new Event('seeking'));

    if (this.snapshot.currentTime === time) {
      this.#finishSeek();
      return;
    }

    void sender.seek(time).catch((error: unknown) => {
      if (this.#seek !== seek) return;

      this.#finishSeek();
      this.#reportError(error);
    });
  }

  #finishSeek(): void {
    if (!this.#seek) return;

    clearTimeout(this.#seek.timer);
    this.#seek = null;
    const media = this.#media ?? this.#detachedMedia;

    // Player seek actions subscribe after assigning currentTime, including when a bridge answers synchronously.
    queueMicrotask(() => {
      if (!this.#seek) media?.dispatchEvent(new Event('seeked'));
    });
  }

  #bindTracks(): void {
    const element = this.#sender?.setSubtitle ? getMediaElement(this.#media) : null;
    if (element === this.#trackTarget) return;

    this.#unbindTracks();
    this.#trackTarget = element;
    element?.textTracks.addEventListener('change', this.#onTextTrackChange);
  }

  #unbindTracks(): void {
    this.#trackTarget?.textTracks.removeEventListener('change', this.#onTextTrackChange);
    this.#trackTarget = null;
  }

  #subtitles(): { track: TextTrack; subtitle: FCastSubtitle }[] {
    return [...(this.#trackTarget?.querySelectorAll('track') ?? [])].flatMap((element) => {
      if (!element.src || (element.kind !== 'captions' && element.kind !== 'subtitles')) return [];

      return [
        {
          track: element.track,
          subtitle: { url: element.src, label: element.label, language: element.srclang, kind: element.kind },
        },
      ];
    });
  }

  #onTextTrackChange = (): void => {
    const sender = this.#sender;
    if (this.#syncingTracks || this.#pendingLoad || !this.#connected || !this.enabled || !sender?.setSubtitle) return;

    const subtitle = this.#subtitles().find(({ track }) => track.mode === 'showing')?.subtitle ?? null;
    const url = subtitle?.url ?? null;
    if (url === this.#selectedSubtitle) return;

    this.#selectedSubtitle = url;
    const session = this.#session;

    void sender.setSubtitle(subtitle).catch((error: unknown) => {
      if (sender !== this.#sender || session !== this.#session) return;

      this.#selectedSubtitle = undefined;
      this.#reportError(error);
    });
  };

  #syncRemoteSubtitle(): void {
    const selected = this.snapshot.selectedSubtitle;
    if (!this.#sender?.setSubtitle || selected === undefined) return;

    const subtitles = this.#subtitles();
    if (selected !== null && !subtitles.some(({ subtitle }) => subtitle.url === selected)) return;

    this.#selectedSubtitle = selected;
    this.#syncingTracks = true;

    try {
      for (const { track, subtitle } of subtitles) track.mode = subtitle.url === selected ? 'showing' : 'disabled';
    } finally {
      this.#syncingTracks = false;
    }
  }

  #onSenderChange = (): void => {
    this.#bindTracks();
    const next = this.snapshot;
    const previous = this.#lastSnapshot;
    const connected = next.connection === 'connected';
    const wasConnected = this.#connected;

    if (connected && !wasConnected) {
      this.#wasPlaying = !this.#media?.paused;

      if (this.enabled) this.#media?.pause();

      this.#connected = true;
      this.#firstLoad = true;
      this.#loadedSrc = null;
      this.#adoptSession();
      this.#followSource();
    } else if (!connected && wasConnected) {
      this.#connected = false;
      this.#invalidateLoads();
      this.#restoreLocal(previous, this.#media ?? this.#detachedMedia);
    }

    if (next.volume > 0) this.#unmutedVolume = next.volume;

    if (connected && this.enabled) {
      const wasAwaiting = this.#awaitingMedia;

      if (wasConnected && next.playbackState !== 'idle' && (!next.mediaUrl || next.mediaUrl === this.#loadedSrc)) {
        this.#awaitingMedia = false;
      }

      if (wasAwaiting && !this.#awaitingMedia) this.#media?.dispatchEvent(new Event('loadedmetadata'));

      if (next.playbackState === 'idle' && previous.playbackState !== 'idle') {
        this.#finishSeek();
        this.#media?.dispatchEvent(new Event('emptied'));
      }

      if (
        this.#seek &&
        next.currentTime !== previous.currentTime &&
        Math.abs(next.currentTime - this.#seek.time) <= 1
      ) {
        this.#finishSeek();
      }

      if (!this.#awaitingMedia && (!next.mediaUrl || next.mediaUrl === this.#loadedSrc)) this.#syncRemoteSubtitle();

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

      if (next.buffering && !previous.buffering) this.#media?.dispatchEvent(new Event('waiting'));

      if (!next.paused && !next.buffering && (!wasConnected || previous.paused || previous.buffering)) {
        this.#media?.dispatchEvent(new Event('playing'));
      }

      if (next.ended && !previous.ended) this.#media?.dispatchEvent(new Event('ended'));
    }

    this.#lastSnapshot = { ...next };
    this.#notify();
  };

  #notify(): void {
    if (this.#media) {
      const connection = this.snapshot.connection;

      setRemotePlaybackState(
        this.#media,
        this,
        this.enabled && (this.#connected || connection === 'connecting') ? connection : 'disconnected'
      );
    }

    this.#version += 1;
    this.dispatchEvent(new Event('change'));
  }

  #restoreLocal(snapshot: FCastSnapshot, media = this.#media): void {
    if (!media || media.disableRemotePlayback) return;

    if (Number.isFinite(snapshot.currentTime)) media.currentTime = snapshot.currentTime;

    media.volume = snapshot.volume;
    media.muted = snapshot.muted;
    media.playbackRate = snapshot.speed;

    if (!snapshot.paused && !snapshot.ended) void media.play().catch(this.#reportError);
    else media.pause();
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
        if (extension.#awaitingMedia || extension.snapshot.playbackState === 'idle') return 0;

        return extension.snapshot.buffering ? 2 : 3;
      },
      get seeking() {
        return extension.#seek !== null;
      },
      get currentTime() {
        return extension.snapshot.currentTime;
      },
      set currentTime(value: number) {
        extension.#startSeek(value);
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
        void extension.#sender?.setVolume(value ? 0 : extension.#unmutedVolume).catch(extension.#reportError);
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
          extension.#replaying = true;
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

  #onSenderError = (event: Event): void => {
    this.#finishSeek();
    // SAFETY: FCastBridge specifies error events as CustomEvent<unknown>.
    this.#reportError((event as CustomEvent<unknown>).detail);
  };

  #reportError = (error: unknown): void => {
    this.dispatchEvent(new CustomEvent('error', { detail: error }));

    if (__DEV__) console.error('[FCast]', error);
  };
}
