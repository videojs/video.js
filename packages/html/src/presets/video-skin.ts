import type { FCastSender } from '@videojs/fcast';

import type { FCastButtonElement } from '../ui/fcast-button/element';
import { SkinElement } from './skin';

/** Shared FCast configuration for packaged video and live-video skins. @internal */
export class FCastVideoSkinElement extends SkinElement {
  /** FCast bridge used by the built-in FCast control. */
  get fcastSender(): FCastSender | undefined {
    return this.#fcastButton?.sender;
  }

  set fcastSender(value: FCastSender | undefined) {
    if (this.#fcastButton) this.#fcastButton.sender = value;
  }

  get fcastSrc(): string | undefined {
    return this.#fcastButton?.src;
  }

  set fcastSrc(value: string | undefined) {
    if (this.#fcastButton) this.#fcastButton.src = value;
  }

  get fcastContentType(): string | undefined {
    return this.#fcastButton?.contentType;
  }

  set fcastContentType(value: string | undefined) {
    if (this.#fcastButton) this.#fcastButton.contentType = value;
  }

  get #fcastButton(): FCastButtonElement | null {
    return this.shadowRoot?.querySelector<FCastButtonElement>('media-fcast-button') ?? null;
  }
}
