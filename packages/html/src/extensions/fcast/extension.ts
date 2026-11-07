import type { PropertyDeclarationMap } from '@videojs/element';
import { FCastExtension as FCastExtensionBase, type FCastExtensionProps } from '@videojs/fcast';

import { PlayerExtensionElement } from '../player-extension-element';

/**
 * Adds FCast to the surrounding player and follows its media. Renders nothing. Assign an application-provided sender to
 * the `sender` property for discovery, selection, and transport.
 *
 * @example
 *   ```html
 *   <video-player>
 *   <video src="https://example.com/video.mp4"></video>
 *   <fcast-extension></fcast-extension>
 *   <video-skin></video-skin>
 *   </video-player>
 *   ```;
 *
 * @experimental
 */
export class FCastExtension extends PlayerExtensionElement<FCastExtensionBase> {
  static readonly tagName = 'fcast-extension';

  static override properties = {
    src: { type: String },
    contentType: { type: String, attribute: 'content-type' },
    // Object inputs are assigned as properties only.
  } satisfies PropertyDeclarationMap<Exclude<keyof FCastExtensionProps, 'sender' | 'metadata'>>;

  protected createExtension(): FCastExtensionBase {
    return new FCastExtensionBase();
  }

  /** Application-provided FCast sender responsible for receiver selection and transport. */
  get sender(): FCastExtensionProps['sender'] {
    return this.extension.sender;
  }

  set sender(value: FCastExtensionProps['sender']) {
    this.extension.sender = value;
  }

  /** Receiver title and thumbnail overrides. Defaults to the media's title and poster. */
  get metadata(): FCastExtensionProps['metadata'] {
    return this.extension.metadata;
  }

  set metadata(value: FCastExtensionProps['metadata']) {
    this.extension.metadata = value;
  }

  /** Receiver URL. Falls back to the attached media's playable URL. */
  get src(): string {
    return this.extension.src;
  }

  set src(value: string | null | undefined) {
    this.extension.src = value ?? undefined;
  }

  /** MIME type sent to the receiver. Inferred from the URL when unset. */
  get contentType(): string | undefined {
    return this.extension.contentType;
  }

  set contentType(value: string | null | undefined) {
    this.extension.contentType = value ?? undefined;
  }
}
