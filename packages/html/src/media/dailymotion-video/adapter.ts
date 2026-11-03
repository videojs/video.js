import { DailymotionAdapter } from '@videojs/dailymotion-video';
import { CustomMediaElement } from '@videojs/media/dom';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

// `CustomMediaElement` implements `connectedCallback` but doesn't type it; declared so `super` can reach it.
interface DailymotionCustomMediaElement {
  connectedCallback?(): void;
}

// The target is a container the SDK builds its iframe in. `'iframe'` still tells `CustomMediaElement` it hosts an
// embed: no attributes are mirrored onto the target, and the host is marked as a cross-origin frame. Unlike the other
// embed hosts, it never keeps the player out of hit-testing: Dailymotion's terms forbid blocking any part of its player.
class DailymotionCustomMediaElement extends CustomMediaElement('iframe', DailymotionAdapter) {
  static override getTemplateHTML = (): string => /*html*/ `
    <style>
      :host {
        display: inline-block;
        min-width: 300px;
        min-height: 150px;
        position: relative;
      }
      ::slotted([slot=media]) {
        position: absolute;
        inset: 0;
      }
    </style>
    <slot name="media"></slot>
  `;
}

export class DailymotionVideo extends MediaAttachMixin(DailymotionCustomMediaElement) {
  constructor() {
    super();

    // Dailymotion can mute the player on its own (a browser's muted autoplay, a click on its own mute button). Writes
    // to `muted` go through the `muted` attribute, so it follows the player, or a later unmute would find nothing to
    // change. The attribute change sets the same value back, which the adapter ignores.
    this.adapter.addEventListener('volumechange', () => {
      const { muted } = this.adapter;

      if (this.hasAttribute('muted') !== muted) this.toggleAttribute('muted', muted);
    });
  }

  override connectedCallback(): void {
    super.connectedCallback?.();

    // The SDK finds the container by id from the document, so it lives in the light DOM, slotted as `media` to become
    // the adapter's target. Added here because a constructor may not add children.
    const existing = this.querySelector(':scope > [slot=media]');

    if (existing) {
      // Attached before the host was in the page, the container stayed empty; load the source now.
      if (this.adapter.src && !existing.hasChildNodes() && !this.adapter.error) this.adapter.load();

      return;
    }

    const container = document.createElement('div');

    container.slot = 'media';
    this.append(container);
  }
}
