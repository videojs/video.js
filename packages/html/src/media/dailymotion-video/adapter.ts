import { DailymotionAdapter } from '@videojs/dailymotion-video';
import { CustomMediaElement } from '@videojs/media/dom';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

// `CustomMediaElement` implements `connectedCallback` but doesn't type it; declared so `super` can reach it.
interface DailymotionCustomMediaElement {
  connectedCallback?(): void;
}

// The target is a container the SDK builds its iframe in. `'iframe'` still tells `CustomMediaElement` it hosts an
// embed: no attributes are mirrored onto the target, and the host is marked as a cross-origin frame.
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
      :host(:not([controls])) {
        pointer-events: none;
      }
    </style>
    <slot name="media"></slot>
  `;
}

export class DailymotionVideo extends MediaAttachMixin(DailymotionCustomMediaElement) {
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
