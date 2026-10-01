import type { PropertyDeclarationMap } from '@videojs/element';
import { GoogleCastExtension as GoogleCastExtensionBase, type GoogleCastExtensionProps } from '@videojs/google-cast';

import { PlayerExtensionElement } from '../player-extension-element';

/**
 * Adds the Google Cast extension to the surrounding player.
 *
 * Renders nothing — place it inside the player and it follows whatever media the player attaches, a plain `<video>`
 * included.
 *
 * @example
 *   ```html
 *   <video-player>
 *   <video src="https://example.com/video.mp4"></video>
 *   <google-cast receiver="YOUR_APP_ID"></google-cast>
 *   </video-player>
 *   ```;
 */
export class GoogleCastExtension extends PlayerExtensionElement<GoogleCastExtensionBase> {
  static readonly tagName = 'google-cast';

  static override properties = {
    src: { type: String },
    contentType: { type: String, attribute: 'content-type' },
    streamType: { type: String, attribute: 'stream-type' },
    receiver: { type: String },
    // `customData` takes an object, so it's a property-only prop.
  } satisfies PropertyDeclarationMap<Exclude<keyof GoogleCastExtensionProps, 'customData'>>;

  protected createExtension(): GoogleCastExtensionBase {
    return new GoogleCastExtensionBase();
  }

  /** Source URL loaded on the Cast receiver. Falls back to the source the media is playing. */
  get src(): string {
    return this.extension.src ?? '';
  }

  set src(value: string | null | undefined) {
    this.extension.src = value ?? undefined;
  }

  /** MIME type of the Cast source. When unset, the receiver infers it from the URL. */
  get contentType(): string | undefined {
    return this.extension.contentType;
  }

  set contentType(value: string | null | undefined) {
    this.extension.contentType = value ?? undefined;
  }

  /** Stream type used on the Cast receiver. Falls back to the media's `streamType`. */
  get streamType(): GoogleCastExtensionProps['streamType'] {
    return this.extension.streamType;
  }

  set streamType(value: GoogleCastExtensionProps['streamType'] | null) {
    this.extension.streamType = value ?? undefined;
  }

  /** Cast receiver application ID. Defaults to Google's default media receiver. */
  get receiver(): string | undefined {
    return this.extension.receiver;
  }

  set receiver(value: string | null | undefined) {
    this.extension.receiver = value ?? undefined;
  }

  /** Custom data sent to the Cast receiver with the load request. */
  get customData(): GoogleCastExtensionProps['customData'] {
    return this.extension.customData;
  }

  set customData(value: GoogleCastExtensionProps['customData']) {
    this.extension.customData = value;
  }
}
