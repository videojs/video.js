import type { ExtensionPlayer, MediaContainer, PlayerExtension, PlayerTarget } from '@videojs/core/dom';
import {
  isMediaContentDataCapable,
  isMediaMutedCapable,
  isMediaPauseCapable,
  isMediaSeekCapable,
  isMediaSourceCapable,
  isMediaStreamTypeCapable,
  isMediaVolumeCapable,
  type Media,
  type MediaFullscreenCapability,
} from '@videojs/media';
import { listen, type WebKitDocument, type WebKitVideoElement } from '@videojs/utils/dom';
import { isFunction, isNil, isNumber } from '@videojs/utils/predicate';

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

/**
 * The player enters fullscreen on its container, so that is what counts here, along with whatever the media reports for
 * itself (native video fullscreen, iOS presentation mode). The container is only known if it existed when the media
 * attached, so a media in the DOM is also matched by containment.
 */
function isPlayerFullscreen(media: Media | null, container: MediaContainer | null): boolean {
  if (isNil(media)) return false;

  // SAFETY: `isFullscreen` and iOS `webkitPresentationMode` are optional members a media may report.
  const fullscreenMedia = media as Partial<MediaFullscreenCapability> &
    Pick<WebKitVideoElement, 'webkitPresentationMode'>;
  if (fullscreenMedia.isFullscreen === true || fullscreenMedia.webkitPresentationMode === 'fullscreen') return true;

  // SAFETY: Probing standard and WebKit vendor fullscreenElement on document.
  const doc = document as WebKitDocument;
  const fsElement = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  if (isNil(fsElement)) return false;

  if (container && fsElement.contains(container)) return true;

  return media instanceof Node && fsElement.contains(media);
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
  #container: MediaContainer | null = null;
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
  attach({ media, container }: PlayerTarget): void {
    if (this.#media === media) return;

    this.detach();
    this.#media = media;
    this.#container = container;
    this.#resetSession();
    this.#lastMuted = this.#isMediaMutedOrSilent;

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
    };
  }

  /** @internal Player lifecycle; called when media detaches. */
  detach(): void {
    this.#unlisten?.();
    this.#unlisten = null;
    this.#media = null;
    this.#container = null;
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
    if (!this.#mediaLoop) return false;

    const duration = this.#mediaDuration;
    if (duration <= 0) return false;

    const currentTime = this.#mediaCurrentTime;
    const isNearEnd = this.#maxTime >= duration * 0.7;
    const isRestartAtStart = currentTime <= Math.max(1, duration * 0.05);

    if (isNearEnd && isRestartAtStart) {
      this.#hasEnded = false;
      this.#firedMilestones.clear();
      this.#maxTime = currentTime;
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
      this.#sendEvent('resume', this.#percentAtCurrentTime());
    }

    if (!this.#hasStarted) {
      this.#hasStarted = true;
      this.#sendEvent('video_start', 0);
    }
  };

  #handleTimeUpdate = (): void => {
    if (isNil(this.#media)) return;

    const duration = this.#mediaDuration;
    const currentTime = this.#mediaCurrentTime;

    if (currentTime > this.#maxTime) {
      this.#maxTime = currentTime;
    }

    if (!this.#hasStarted && currentTime > 0) {
      this.#hasStarted = true;
      this.#sendEvent('video_start', 0);
    }

    if (this.#effectiveStreamType === 'live') return;

    if (this.disableProgress || duration <= 0) return;

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

    if (isNil(this.#media)) return;

    if (this.#mediaEnded || this.#mediaSeeking) return;

    this.#sendEvent('pause', this.#percentAtCurrentTime());
  };

  #handleEnded = (): void => {
    if (this.#hasEnded) return;

    this.#hasEnded = true;
    this.#sendEvent('end', 100);
    this.#sendEvent('video_complete', 100);
  };

  #handleSeeked = (): void => {
    if (isNil(this.#media)) return;

    if (this.#checkLoopRestart()) {
      this.#sendEvent('video_complete', 100);
      this.#sendEvent('video_start', 0);
      return;
    }

    const currentTime = this.#mediaCurrentTime;

    if (currentTime > this.#maxTime) {
      this.#maxTime = currentTime;
    }

    this.#sendEvent('seek', this.#percentAtCurrentTime());
  };

  #handleVolumeChange = (): void => {
    if (isNil(this.#media)) return;

    const isMuted = this.#isMediaMutedOrSilent;

    if (this.#lastMuted === undefined) {
      this.#lastMuted = isMuted;
      return;
    }

    if (isMuted !== this.#lastMuted) {
      this.#lastMuted = isMuted;

      if (isMuted) {
        this.#sendEvent('mute', this.#percentAtCurrentTime());
      } else {
        this.#sendEvent('unmute', this.#percentAtCurrentTime());
      }
    }
  };

  #handleFullscreenChange = (): void => {
    const isFs = isPlayerFullscreen(this.#media, this.#container);
    if (isFs === this.#isFullscreen) return;

    this.#isFullscreen = isFs;

    if (isFs) {
      this.#sendEvent('fullscreenEnter', this.#percentAtCurrentTime());
    } else {
      this.#sendEvent('fullscreenExit', this.#percentAtCurrentTime());
    }
  };

  get #mediaDuration(): number {
    const media = this.#media;
    if (!isMediaSeekCapable(media)) return 0;

    return isNumber(media.duration) && !Number.isNaN(media.duration) ? media.duration : 0;
  }

  get #mediaCurrentTime(): number {
    const media = this.#media;

    return isMediaSeekCapable(media) && isNumber(media.currentTime) ? media.currentTime : 0;
  }

  get #isMediaMutedOrSilent(): boolean {
    const media = this.#media;
    const muted = isMediaMutedCapable(media) && media.muted;

    return muted || (isMediaVolumeCapable(media) && media.volume === 0);
  }

  get #mediaEnded(): boolean {
    const media = this.#media;

    return isMediaPauseCapable(media) && media.ended;
  }

  get #mediaSeeking(): boolean {
    const media = this.#media;

    return isMediaSeekCapable(media) && media.seeking;
  }

  get #mediaLoop(): boolean {
    const media = this.#media;

    return isMediaSeekCapable(media) && media.loop;
  }

  #percentAtCurrentTime(): number {
    const duration = this.#mediaDuration;
    const currentTime = this.#mediaCurrentTime;

    return duration > 0 ? Math.floor((currentTime / duration) * 100) : 0;
  }

  get #effectiveStreamType(): 'live' | 'on-demand' | string {
    if (this.metadata?.video_stream_type) return this.metadata.video_stream_type;

    const media = this.#media;

    return isMediaStreamTypeCapable(media) && media.streamType === 'live' ? 'live' : 'on-demand';
  }

  #resolveTitle(videoTitle = this.metadata?.video_title): string {
    if (videoTitle) return videoTitle;

    const media = this.#media;
    const title = isMediaContentDataCapable(media) ? media.contentData?.title : null;

    return title || this.#resolveUrl() || 'Untitled Video';
  }

  #resolveUrl(videoUrl = this.metadata?.video_url): string {
    if (videoUrl) return videoUrl;

    const media = this.#media;

    return isMediaSourceCapable(media) ? media.currentSrc || media.src || '' : '';
  }

  #sendEvent(event: GoogleAnalyticsEventName, percent: number): void {
    const duration = Math.round(this.#mediaDuration);
    const currentTime = Math.round(this.#mediaCurrentTime);

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
