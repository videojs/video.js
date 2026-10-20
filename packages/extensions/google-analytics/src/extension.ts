import type { ExtensionPlayer, MediaContainer, PlayerExtension, PlayerTarget } from '@videojs/core/dom';
import type { Media } from '@videojs/media';
import { getMediaElement } from '@videojs/media/dom';
import { listen, type WebKitDocument, type WebKitVideoElement } from '@videojs/utils/dom';
import { isFunction, isNil, isNumber, isString } from '@videojs/utils/predicate';

export type GoogleAnalyticsEventName =
  | 'video_start'
  | 'video_progress'
  | 'video_complete'
  | 'play'
  | 'pause'
  | 'resume'
  | 'end'
  | 'seek'
  | 'mute'
  | 'unmute'
  | 'fullscreenEnter'
  | 'fullscreenExit';

export type GoogleAnalyticsParamValue = string | number | boolean;

export interface GoogleAnalyticsEventParams {
  video_current_time: number;
  video_duration: number;
  video_percent: number;
  video_provider: string;
  video_stream_type: 'live' | 'vod' | string;
  video_title: string;
  video_url: string;
  visible?: boolean;
  [key: string]: GoogleAnalyticsParamValue | undefined;
}

export interface GoogleAnalyticsProps {
  /** The name of the dataLayer array on window (default: `'dataLayer'`). */
  dataLayerName?: string;
  /** Explicit title for the video. Falls back to media title or current URL if omitted. */
  videoTitle?: string;
  /** Video provider reported in parameters (default: `'video.js'`). */
  videoProvider?: string;
  /** Stream type reported in parameters (`'live'` or `'vod'`, default: `'vod'`). */
  streamType?: 'live' | 'vod' | undefined;
  /** Whether to track 10%, 25%, 50%, and 75% progress milestones (default: `true`). */
  trackProgress?: boolean;
  /** Whether to log telemetry events to the console (default: `false`). */
  debug?: boolean;
  /** Custom extra parameters to include with every dispatched event. */
  customParams?: Record<string, GoogleAnalyticsParamValue>;
  /** Optional callback to intercept dispatched events. */
  onEvent?: (event: GoogleAnalyticsEventName, params: GoogleAnalyticsEventParams) => void;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MILESTONES = [10, 25, 50, 75] as const;

function isElementFullscreen(container: MediaContainer | null, media: Media | null): boolean {
  if (isNil(media)) return false;

  if (media instanceof HTMLVideoElement) {
    // SAFETY: Probing iOS Safari webkitPresentationMode vendor property on video elements.
    const webkitVideo = media as WebKitVideoElement;
    if (webkitVideo.webkitPresentationMode === 'fullscreen') return true;
  }

  // SAFETY: Probing standard and WebKit vendor fullscreenElement on document.
  const doc = document as WebKitDocument;
  const fsElement = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  if (isNil(fsElement)) return false;

  if (fsElement === container || fsElement === media) return true;

  if (container instanceof Element && container.contains(fsElement)) return true;

  return false;
}

/**
 * Player extension that tracks Google Analytics 4 (GA4) video events and user interactions.
 *
 * Dispatches GA4 enhanced measurement events (`video_start`, `video_progress`, `video_complete`) alongside interaction
 * events (`play`, `pause`, `resume`, `end`, `seek`, `mute`, `unmute`, `fullscreenEnter`, `fullscreenExit`) to
 * `window.dataLayer` (or `window.gtag`).
 */
export class GoogleAnalyticsExtension implements PlayerExtension, GoogleAnalyticsProps {
  static readonly defaultProps: GoogleAnalyticsProps = {
    dataLayerName: 'dataLayer',
    videoTitle: undefined,
    videoProvider: 'video.js',
    streamType: 'vod',
    trackProgress: true,
    debug: false,
    customParams: undefined,
    onEvent: undefined,
  };

  dataLayerName = GoogleAnalyticsExtension.defaultProps.dataLayerName;
  videoTitle = GoogleAnalyticsExtension.defaultProps.videoTitle;
  videoProvider = GoogleAnalyticsExtension.defaultProps.videoProvider;
  streamType: 'live' | 'vod' = 'vod';
  trackProgress = GoogleAnalyticsExtension.defaultProps.trackProgress;
  debug = GoogleAnalyticsExtension.defaultProps.debug;
  customParams = GoogleAnalyticsExtension.defaultProps.customParams;
  onEvent = GoogleAnalyticsExtension.defaultProps.onEvent;

  #media: Media | null = null;
  #container: MediaContainer | null = null;
  #unlisten: (() => void) | null = null;
  #hasStarted = false;
  #hasEnded = false;
  #hasPlayedOnce = false;
  #lastMuted: boolean | undefined = undefined;
  #isFullscreen = false;
  #firedMilestones = new Set<number>();

  constructor(props: Partial<GoogleAnalyticsProps> = {}) {
    Object.assign(this, props);
  }

  /** @internal Player lifecycle; called when connected to a player. */
  connect(_player: ExtensionPlayer): void {}

  /** @internal Player lifecycle; called when disconnected from a player. */
  disconnect(): void {
    this.detach();
  }

  /** @internal Player lifecycle; called when media attaches or changes. */
  attach({ media, container }: PlayerTarget): void {
    if (this.#media === media && this.#container === container) return;

    this.detach();
    this.#media = media;
    this.#container = container;
    this.#resetSession();

    const target = this.#targetElement;

    if (target) {
      this.#lastMuted = target.muted || target.volume === 0;
    }

    const offPlay = listen(media, 'play', this.#handlePlay);
    const offTimeUpdate = listen(media, 'timeupdate', this.#handleTimeUpdate);
    const offPause = listen(media, 'pause', this.#handlePause);
    const offEnded = listen(media, 'ended', this.#handleEnded);
    const offSeeked = listen(media, 'seeked', this.#handleSeeked);
    const offVolumeChange = listen(media, 'volumechange', this.#handleVolumeChange);
    const offLoadStart = listen(media, 'loadstart', this.#resetSession);

    const offFs = listen(document, 'fullscreenchange', this.#handleFullscreenChange);
    const offWebkitFs = listen(document, 'webkitfullscreenchange', this.#handleFullscreenChange);

    this.#unlisten = () => {
      offPlay();
      offTimeUpdate();
      offPause();
      offEnded();
      offSeeked();
      offVolumeChange();
      offLoadStart();
      offFs();
      offWebkitFs();
    };
  }

  /** @internal Player lifecycle; called when media detaches. */
  detach(): void {
    this.#unlisten?.();
    this.#unlisten = null;
    this.#media = null;
    this.#container = null;
    this.#resetSession();
  }

  destroy(): void {
    this.disconnect();
  }

  #resetSession = (): void => {
    this.#hasStarted = false;
    this.#hasEnded = false;
    this.#hasPlayedOnce = false;
    this.#firedMilestones.clear();
  };

  #handlePlay = (): void => {
    if (!this.#hasPlayedOnce) {
      this.#hasPlayedOnce = true;
      this.#sendEvent('play', 0);
    } else {
      const el = this.#targetElement;
      const duration = el?.duration ?? 0;
      const percent = duration > 0 && el ? Math.floor((el.currentTime / duration) * 100) : 0;

      this.#sendEvent('resume', percent);
    }

    if (!this.#hasStarted) {
      this.#hasStarted = true;
      this.#sendEvent('video_start', 0);
    }
  };

  #handleTimeUpdate = (): void => {
    const el = this.#targetElement;
    if (isNil(el)) return;

    const duration = el.duration;
    const currentTime = el.currentTime;

    if (!this.#hasStarted && currentTime > 0) {
      this.#hasStarted = true;
      this.#sendEvent('video_start', 0);
    }

    if (!this.trackProgress || !isNumber(duration) || duration <= 0) return;

    const percent = Math.floor((currentTime / duration) * 100);

    for (const milestone of MILESTONES) {
      if (percent >= milestone && !this.#firedMilestones.has(milestone)) {
        this.#firedMilestones.add(milestone);
        this.#sendEvent('video_progress', milestone);
      }
    }
  };

  #handlePause = (): void => {
    if (this.#hasEnded) return;

    const el = this.#targetElement;
    if (isNil(el) || el.seeking) return;

    const duration = el.duration || 0;
    const percent = duration > 0 ? Math.floor((el.currentTime / duration) * 100) : 0;

    this.#sendEvent('pause', percent);
  };

  #handleEnded = (): void => {
    if (this.#hasEnded) return;

    this.#hasEnded = true;
    this.#sendEvent('end', 100);
    this.#sendEvent('video_complete', 100);
  };

  #handleSeeked = (): void => {
    const el = this.#targetElement;
    if (isNil(el)) return;

    const duration = el.duration || 0;
    const percent = duration > 0 ? Math.floor((el.currentTime / duration) * 100) : 0;

    this.#sendEvent('seek', percent);
  };

  #handleVolumeChange = (): void => {
    const el = this.#targetElement;
    if (isNil(el)) return;

    const isMuted = el.muted || el.volume === 0;

    if (this.#lastMuted === undefined) {
      this.#lastMuted = isMuted;
      return;
    }

    if (isMuted !== this.#lastMuted) {
      this.#lastMuted = isMuted;
      const duration = el.duration || 0;
      const percent = duration > 0 ? Math.floor((el.currentTime / duration) * 100) : 0;

      if (isMuted) {
        this.#sendEvent('mute', percent);
      } else {
        this.#sendEvent('unmute', percent);
      }
    }
  };

  #handleFullscreenChange = (): void => {
    const isFs = isElementFullscreen(this.#container, this.#media);
    if (isFs === this.#isFullscreen) return;

    this.#isFullscreen = isFs;
    const el = this.#targetElement;
    const duration = el?.duration || 0;
    const percent = duration > 0 && el ? Math.floor((el.currentTime / duration) * 100) : 0;

    if (isFs) {
      this.#sendEvent('fullscreenEnter', percent);
    } else {
      this.#sendEvent('fullscreenExit', percent);
    }
  };

  get #targetElement(): HTMLMediaElement | null {
    return this.#media ? getMediaElement(this.#media) : null;
  }

  #resolveTitle(): string {
    if (this.videoTitle) return this.videoTitle;

    const el = this.#targetElement;
    if (!isNil(el) && el.title) return el.title;

    return this.#resolveUrl() || 'Untitled Video';
  }

  #resolveUrl(): string {
    const media = this.#media;
    if (isNil(media)) return '';

    if ('src' in media && isString(media.src) && media.src) {
      return media.src;
    }

    const el = this.#targetElement;
    if (!isNil(el)) return el.currentSrc || el.src || '';

    return '';
  }

  #sendEvent(event: GoogleAnalyticsEventName, percent: number): void {
    const el = this.#targetElement;
    const duration = el && isNumber(el.duration) && !Number.isNaN(el.duration) ? Math.round(el.duration) : 0;
    const currentTime = el && isNumber(el.currentTime) ? Math.round(el.currentTime) : 0;

    const params: GoogleAnalyticsEventParams = {
      video_current_time: currentTime,
      video_duration: duration,
      video_percent: percent,
      video_provider: this.videoProvider ?? 'video.js',
      video_stream_type: this.streamType ?? 'vod',
      video_title: this.#resolveTitle(),
      video_url: this.#resolveUrl(),
      visible: !document.hidden,
      ...this.customParams,
    };

    if (this.debug) {
      console.log(`[GoogleAnalyticsExtension] Event: "${event}"`, params);
    }

    this.onEvent?.(event, params);

    const dataLayerKey = this.dataLayerName ?? 'dataLayer';
    // SAFETY: Accessing configurable dataLayer array on window.
    const win = window as { [key: string]: unknown[] | undefined };
    const targetLayer = win[dataLayerKey];

    if (Array.isArray(targetLayer)) {
      targetLayer.push({ event, ...params });
    } else {
      const newLayer: unknown[] = [{ event, ...params }];

      win[dataLayerKey] = newLayer;
    }

    if (isFunction(window.gtag)) {
      window.gtag('event', event, params);
    }
  }
}
