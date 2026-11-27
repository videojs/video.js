import { CustomMediaElement } from '@videojs/media/dom';
import { VidyardAdapter } from '@videojs/vidyard-video';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

// `CustomMediaElement` implements `connectedCallback` but doesn't type it; declared so `super` can reach it.
interface VidyardCustomMediaElement {
  connectedCallback?(): void;
}

// The target is a container the player is built in. `'iframe'` still tells `CustomMediaElement` it hosts an embed: no
// attributes are mirrored onto the target, and the host is marked as a cross-origin frame.
class VidyardCustomMediaElement extends CustomMediaElement('iframe', VidyardAdapter) {
  static override getTemplateHTML = (): string => /*html*/ `
    <style>
      :host {
        display: inline-block;
        position: relative;
        /* Size like a replaced <video>: 300px wide by default, and an author-set width alone keeps the
           ratio. A skin stretches the host over its media box. */
        width: 300px;
        aspect-ratio: 16 / 9;
      }
      ::slotted([slot=media]) {
        position: absolute;
        inset: 0;
      }
      :host(:not([controls])) {
        pointer-events: none;
      }
    </style>
    <slot name="media"></slot>
  `;
}

export class VidyardVideo extends MediaAttachMixin(VidyardCustomMediaElement) {
  constructor() {
    super();

    // Vidyard's own controls can mute the player. Writes to `muted` go through the `muted` attribute, so it follows the
    // player, or a later unmute would find nothing to change. The attribute change sets the same value back, which the
    // adapter ignores.
    this.adapter.addEventListener('volumechange', () => {
      const { muted } = this.adapter;

      if (this.hasAttribute('muted') !== muted) this.toggleAttribute('muted', muted);
    });
  }

  override connectedCallback(): void {
    super.connectedCallback?.();

    // The container is slotted as `media` to become the adapter's target. Added here because a constructor may not add
    // children.
    if (this.querySelector(':scope > [slot=media]')) return;

    const container = document.createElement('div');

    container.slot = 'media';
    this.append(container);
  }
}
