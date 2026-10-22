import type { PropertyDeclarationMap } from '@videojs/element';
import {
  GoogleAnalyticsExtension as GoogleAnalyticsExtensionBase,
  type GoogleAnalyticsProps,
} from '@videojs/google-analytics';

import { PlayerExtensionElement } from '../player-extension-element';

/**
 * Adds the Google Analytics 4 (GA4) telemetry extension to the surrounding player.
 *
 * Renders nothing — place it inside the player and it monitors whichever media the player attaches, dispatching
 * standard GA4 video events and interaction events (`play`, `pause`, `resume`, `end`, `seek`, `mute`, `unmute`,
 * `fullscreenEnter`, `fullscreenExit`) to `window.dataLayer`.
 *
 * @example
 *   ```html
 *   <video-player>
 *     <video src="https://example.com/video.mp4"></video>
 *     <google-analytics video-title="My Video"></google-analytics>
 *   </video-player>
 *   ```;
 */
export class GoogleAnalyticsExtension extends PlayerExtensionElement<GoogleAnalyticsExtensionBase> {
  static readonly tagName = 'google-analytics';

  static override properties = {
    dataLayerName: { type: String, attribute: 'data-layer-name' },
    videoTitle: { type: String, attribute: 'video-title' },
    videoProvider: { type: String, attribute: 'video-provider' },
    streamType: { type: String, attribute: 'stream-type' },
    disableProgress: { type: Boolean, attribute: 'disable-progress' },
    debug: { type: Boolean },
  } satisfies PropertyDeclarationMap<
    Exclude<keyof GoogleAnalyticsProps, 'customParams' | 'onEvent' | 'trackProgress'> | 'disableProgress'
  >;

  protected createExtension(): GoogleAnalyticsExtensionBase {
    return new GoogleAnalyticsExtensionBase();
  }

  get dataLayerName(): string | undefined {
    return this.extension.dataLayerName;
  }

  set dataLayerName(value: string | null | undefined) {
    this.extension.dataLayerName = value ?? undefined;
  }

  get videoTitle(): string | undefined {
    return this.extension.videoTitle;
  }

  set videoTitle(value: string | null | undefined) {
    this.extension.videoTitle = value ?? undefined;
  }

  get videoProvider(): string | undefined {
    return this.extension.videoProvider;
  }

  set videoProvider(value: string | null | undefined) {
    this.extension.videoProvider = value ?? undefined;
  }

  get streamType(): 'live' | 'vod' | undefined {
    return this.extension.streamType;
  }

  set streamType(value: 'live' | 'vod' | null | undefined) {
    this.extension.streamType = value ?? 'vod';
  }

  get disableProgress(): boolean {
    return !this.trackProgress;
  }

  set disableProgress(value: boolean) {
    this.trackProgress = !value;
  }

  get trackProgress(): boolean {
    return this.extension.trackProgress ?? true;
  }

  set trackProgress(value: boolean) {
    this.extension.trackProgress = value;
  }

  get debug(): boolean {
    return this.extension.debug ?? false;
  }

  set debug(value: boolean) {
    this.extension.debug = value;
  }
}
