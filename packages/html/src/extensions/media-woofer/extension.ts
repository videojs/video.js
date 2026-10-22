import type { PropertyDeclarationMap } from '@videojs/element';
import {
  MediaWooferExtension as MediaWooferExtensionBase,
  type MediaWooferExtensionProps,
} from '@videojs/media-woofer';

import { PlayerExtensionElement } from '../player-extension-element';

/**
 * Adds the media woofer extension to the surrounding player: the media shakes along with the bass, and phones that
 * support vibration vibrate with it.
 *
 * Renders nothing — place it inside the player and it follows whatever media the player attaches. Cross-origin media
 * needs `crossorigin` (and CORS headers) for its sound to be read.
 *
 * @example
 *   ```html
 *   <video-player>
 *   <video src="https://example.com/video.mp4" crossorigin></video>
 *   <media-woofer></media-woofer>
 *   </video-player>
 *   ```;
 *
 * @experimental
 */
export class MediaWooferExtension extends PlayerExtensionElement<MediaWooferExtensionBase> {
  static readonly tagName = 'media-woofer';

  static override properties = {
    threshold: { type: Number },
    vibration: { type: Number },
  } satisfies PropertyDeclarationMap<keyof MediaWooferExtensionProps>;

  protected createExtension(): MediaWooferExtensionBase {
    return new MediaWooferExtensionBase();
  }

  /** Level, from 0 to 255, the lowest frequency bands must pass to count as bass. Lower values shake more often. */
  get threshold(): number {
    return this.extension.threshold;
  }

  set threshold(value: number | null | undefined) {
    this.extension.threshold = value ?? MediaWooferExtensionBase.defaultProps.threshold;
  }

  /** Milliseconds a phone vibrates on each hit of bass. `0` turns vibration off. */
  get vibration(): number {
    return this.extension.vibration;
  }

  set vibration(value: number | null | undefined) {
    this.extension.vibration = value ?? MediaWooferExtensionBase.defaultProps.vibration;
  }
}
