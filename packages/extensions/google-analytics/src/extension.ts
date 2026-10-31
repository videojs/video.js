import type { ExtensionPlayer, PlayerExtension, PlayerTarget } from '@videojs/core/dom';
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
  video_stream_type: 'live' | 'on-demand' | string;
  video_title: string;
  video_url: string;
  visible?: boolean;
  [key: string]: GoogleAnalyticsParamValue | undefined;
}

export interface GoogleAnalyticsMetadata {
  // GA4 official (overrides; otherwise derived)
  video_title?: string;
  video_provider?: string;
  video_url?: string;

  // Mux Data names (GA4 custom dimensions)
  video_id?: string;
  video_series?: string;
  video_producer?: string;
  video_content_type?: string;
  video_language_code?: string;
  video_variant_id?: string;
  video_variant_name?: string;
  video_stream_type?: 'on-demand' | 'live'; // default: media.streamType
  video_cdn?: string;
  video_brand?: string;
  video_affiliate?: string;
  sub_property_id?: string;
  experiment_name?: string;
  page_type?: string;
  player_name?: string;
  custom_1?: string; // ...

  [key: string]: string | number | boolean | undefined;
}

export type GoogleAnalyticsProps = {
  /** The name of the dataLayer array on window (default: `'dataLayer'`). */
  dataLayerName?: string | undefined;
  /** Video metadata and custom dimensions reported with GA4 events. */
  metadata?: GoogleAnalyticsMetadata | undefined;
  /** Whether to disable tracking 10%, 25%, 50%, and 75% progress milestones (default: `false`). */
  disableProgress?: boolean | undefined;
  /** Whether to log telemetry events to the console (default: `false`). */
  debug?: boolean | undefined;
  /** Optional callback to intercept dispatched events. */
  onEvent?: ((event: GoogleAnalyticsEventName, params: GoogleAnalyticsEventParams) => void) | undefined;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MILESTONES = [10, 25, 50, 75] as const;

function isElementFullscreen(
  media: Media | null,
  target: HTMLMediaElement | null = media ? getMediaElement(media) : null
): boolean {
  if (isNil(media)) return false;

  // SAFETY: Probing iOS Safari webkitPresentationMode vendor property on video elements.
  const candidate = (target ?? media) as WebKitVideoElement;
  if ('webkitPresentationMode' in candidate && candidate.webkitPresentationMode === 'fullscreen') return true;

  // SAFETY: Probing standard and WebKit vendor fullscreenElement on document.
  const doc = document as WebKitDocument;
  const fsElement = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  if (isNil(fsElement)) return false;

  const el = target ?? (media instanceof Element ? media : null);
  if (isNil(el)) return false;

  return fsElement === el || (el instanceof Element && fsElement.contains(el));
}

/**
 * Player extension that tracks Google Analytics 4 (GA4) video events and user interactions.
 *
 * Dispatches GA4 enhanced measurement events (`video_start`, `video_progress`, `video_complete`) alongside interaction
 * events (`play`, `pause`, `resume`, `end`, `seek`, `mute`, `unmute`, `fullscreenEnter`, `fullscreenExit`) to
 * `window.dataLayer` (or `window.gtag`).
 *
 * @internal
 */
export class GoogleAnalyticsExtension implements PlayerExtension, GoogleAnalyticsProps {
  static readonly defaultProps: GoogleAnalyticsProps = {
    dataLayerName: 'dataLayer',
    metadata: undefined,
    disableProgress: false,
    debug: false,
    onEvent: undefined,
  };

  dataLayerName: string | undefined = GoogleAnalyticsExtension.defaultProps.dataLayerName;
  metadata: GoogleAnalyticsMetadata | undefined = GoogleAnalyticsExtension.defaultProps.metadata;
  disableProgress: boolean | undefined = GoogleAnalyticsExtension.defaultProps.disableProgress;
  debug: boolean | undefined = GoogleAnalyticsExtension.defaultProps.debug;
  onEvent: ((event: GoogleAnalyticsEventName, params: GoogleAnalyticsEventParams) => void) | undefined =
    GoogleAnalyticsExtension.defaultProps.onEvent;

  #media: Media | null = null;
  #unlisten: (() => void) | null = null;
  #hasStarted = false;
  #hasEnded = false;
  #hasPlayedOnce = false;
  #lastMuted: boolean | undefined = undefined;
  #isFullscreen = false;
  #firedMilestones = new Set<number>();
  #maxTime = 0;

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
  attach({ media }: PlayerTarget): void {
    if (this.#media === media) return;

    this.detach();
    this.#media = media;
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
    const offPresentationMode = listen(media, 'webkitpresentationmodechanged', this.#handleFullscreenChange);
    const offTargetPresentationMode =
      target && target !== media ? listen(target, 'webkitpresentationmodechanged', this.#handleFullscreenChange) : null;

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
      offPresentationMode();
      offTargetPresentationMode?.();
    };
  }

  /** @internal Player lifecycle; called when media detaches. */
  detach(): void {
    this.#unlisten?.();
    this.#unlisten = null;
    this.#media = null;
    this.#isFullscreen = false;
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
    this.#maxTime = 0;
  };

  #checkLoopRestart = (): boolean => {
    const el = this.#targetElement;
    if (isNil(el)) return false;

    // SAFETY: Probing loop property on custom media element host.
    const isLoop = Boolean(
      el.loop || (this.#media && 'loop' in this.#media && (this.#media as { loop?: boolean }).loop)
    );
    if (!isLoop) return false;

    const duration = el.duration;
    if (!isNumber(duration) || duration <= 0) return false;

    const isNearEnd = this.#maxTime >= duration * 0.7;
    const isRestartAtStart = el.currentTime <= Math.max(1, duration * 0.05);

    if (isNearEnd && isRestartAtStart) {
      this.#hasEnded = false;
      this.#firedMilestones.clear();
      this.#maxTime = el.currentTime;
      return true;
    }

    return false;
  };

  #handlePlay = (): void => {
    if (this.#hasEnded) {
      this.#hasEnded = false;
      this.#firedMilestones.clear();
      this.#maxTime = 0;
    }

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

    if (currentTime > this.#maxTime) {
      this.#maxTime = currentTime;
    }

    if (!this.#hasStarted && currentTime > 0) {
      this.#hasStarted = true;
      this.#sendEvent('video_start', 0);
    }

    if (this.#effectiveStreamType === 'live') return;

    if (this.disableProgress || !isNumber(duration) || duration <= 0) return;

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
    if (isNil(el)) return;

    if (el.ended || el.seeking) return;

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

    if (this.#checkLoopRestart()) {
      this.#sendEvent('video_complete', 100);
      this.#sendEvent('video_start', 0);
      return;
    }

    if (el.currentTime > this.#maxTime) {
      this.#maxTime = el.currentTime;
    }

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
    const isFs = isElementFullscreen(this.#media, this.#targetElement);
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

  get #effectiveStreamType(): 'live' | 'on-demand' | string {
    if (this.metadata?.video_stream_type) return this.metadata.video_stream_type;

    // SAFETY: Probing streamType property on media capability or custom element host.
    if (this.#media && 'streamType' in this.#media && (this.#media as { streamType?: string }).streamType === 'live') {
      return 'live';
    }

    // SAFETY: Probing streamType property on target element host.
    if (
      this.#targetElement &&
      'streamType' in this.#targetElement &&
      (this.#targetElement as { streamType?: string }).streamType === 'live'
    ) {
      return 'live';
    }

    return 'on-demand';
  }

  #resolveTitle(videoTitle = this.metadata?.video_title): string {
    if (videoTitle) return videoTitle;

    const el = this.#targetElement;
    if (!isNil(el) && el.title) return el.title;

    return this.#resolveUrl() || 'Untitled Video';
  }

  #resolveUrl(videoUrl = this.metadata?.video_url): string {
    if (videoUrl) return videoUrl;

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

    const { video_title, video_provider, video_url, video_stream_type, ...customDimensions } = this.metadata ?? {};

    const params: GoogleAnalyticsEventParams = {
      video_current_time: currentTime,
      video_duration: duration,
      video_percent: percent,
      video_provider: video_provider ?? 'video.js',
      video_stream_type: video_stream_type ?? this.#effectiveStreamType,
      video_title: this.#resolveTitle(video_title),
      video_url: this.#resolveUrl(video_url),
      visible: !document.hidden,
      ...customDimensions,
    };

    if (this.debug) {
      console.log(`[GoogleAnalyticsExtension] Event: "${event}"`, params);
    }

    this.onEvent?.(event, params);

    const dataLayerKey = this.dataLayerName ?? 'dataLayer';
    // SAFETY: Accessing configurable dataLayer array on window.
    const win = window as unknown as Record<string, unknown[] | undefined>;
    const targetLayer = win[dataLayerKey];

    if (Array.isArray(targetLayer)) {
      targetLayer.push({ event, ...params });
    } else {
      win[dataLayerKey] = [{ event, ...params }];
    }

    if (isFunction(window.gtag)) {
      window.gtag('event', event, params);
    }
  }
}
