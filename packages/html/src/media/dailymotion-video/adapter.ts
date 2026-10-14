import { DailymotionAdapter } from '@videojs/dailymotion-video';
import { CustomMediaElement } from '@videojs/media/dom';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

// `CustomMediaElement` is typed without the lifecycle callbacks it implements, so its `connectedCallback` isn't visible
// for `super` to reach. Declared here, with method syntax so a subclass can override it.
interface DailymotionCustomMediaElement {
  connectedCallback?(): void;
}

// The SDK builds its own iframe, so the host is an embed without one of its own. `'iframe'` is what tells
// `CustomMediaElement` it hosts an embed, though the target is a container: no attributes are mirrored onto it, and the
// host is marked as a cross-origin frame like the other embeds.
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
      /* A cross-origin frame swallows every pointer event, so the skin above it
         never sees the hover that reveals the controls. Only the player
         configuration can hide Dailymotion's chrome, so without controls the
         player is kept out of hit-testing as well. */
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

    // The SDK finds the element it builds the player in by id from the document, which cannot see into the shadow
    // root, so the container is light DOM. Slotting it as `media` is what makes it the adapter's target. Created here
    // rather than in the constructor, which may not add children to the element.
    const existing = this.querySelector(':scope > [slot=media]');

    if (existing) {
      // A container given before the host was in the page was attached while the SDK could not find it, which left
      // it empty; a source set by then loads now.
      if (this.adapter.src && !existing.hasChildNodes() && !this.adapter.error) this.adapter.load();

      return;
    }

    const container = document.createElement('div');

    container.slot = 'media';
    this.append(container);
  }
}
