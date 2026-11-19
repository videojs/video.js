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
 *     <google-analytics metadata-video-title="My Video"></google-analytics>
 *   </video-player>
 *   ```;
 *
 * @internal
 */
export class GoogleAnalyticsExtension extends PlayerExtensionElement<GoogleAnalyticsExtensionBase> {
  static readonly tagName = 'google-analytics';

  static override properties = {
    dataLayerName: { type: String, attribute: 'data-layer-name' },
    disableProgress: { type: Boolean, attribute: 'disable-progress' },
    debug: { type: Boolean },
    // `metadata` takes an object, so it's a property-only prop.
  } satisfies PropertyDeclarationMap<Exclude<keyof GoogleAnalyticsProps, 'metadata' | 'onEvent'>>;

  protected createExtension(): GoogleAnalyticsExtensionBase {
    return new GoogleAnalyticsExtensionBase();
  }

  get dataLayerName(): string | undefined {
    return this.extension.dataLayerName;
  }

  set dataLayerName(value: string | null | undefined) {
    this.extension.dataLayerName = value ?? undefined;
  }

  get disableProgress(): boolean {
    return this.extension.disableProgress ?? false;
  }

  set disableProgress(value: boolean) {
    this.extension.disableProgress = value;
  }

  get debug(): boolean {
    return this.extension.debug ?? false;
  }

  set debug(value: boolean) {
    this.extension.debug = value;
  }

  /**
   * Video metadata and custom dimensions reported with GA4 events. Set `metadata-*` attributes for markup-only values;
   * the property overrides attribute keys with the same name.
   */
  get metadata(): GoogleAnalyticsProps['metadata'] {
    // SAFETY: Attribute keys are merged into the same metadata record shape the extension already accepts.
    return this.getResolvedMetadata() as GoogleAnalyticsProps['metadata'];
  }

  set metadata(value: GoogleAnalyticsProps['metadata']) {
    this.setMetadataFromProperty(value);
  }

  /** Optional callback to intercept dispatched events. */
  get onEvent(): GoogleAnalyticsProps['onEvent'] {
    return this.extension.onEvent;
  }

  set onEvent(value: GoogleAnalyticsProps['onEvent']) {
    this.extension.onEvent = value;
  }
}
