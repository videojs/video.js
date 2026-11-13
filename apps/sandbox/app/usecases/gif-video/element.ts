import { MediaAttachMixin } from '@videojs/html';
import { CustomMediaElement } from '@videojs/media/dom';

import { GifAdapter } from './adapter';

/** The `<video>` template's CSS custom properties, so skins style the canvas the way they style a video. */
const BORDER_RADIUS_VAR = '--media-video-border-radius';
const OBJECT_FIT_VAR = '--media-object-fit';
const OBJECT_POSITION_VAR = '--media-object-position';

class GifCustomMediaElement extends CustomMediaElement('canvas', GifAdapter) {
  static override getTemplateHTML = (): string => {
    return /*html*/ `
      <style>
        :host {
          display: contents;
        }

        canvas {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: var(${BORDER_RADIUS_VAR});
          object-fit: var(${OBJECT_FIT_VAR}, contain);
          object-position: var(${OBJECT_POSITION_VAR}, center);
        }
      </style>
      <slot name="media">
        <canvas part="canvas" role="img" aria-label="Animated GIF"></canvas>
      </slot>
      <slot></slot>
    `;
  };
}

/**
 * `<gif-video>`: an animated GIF that behaves like a video inside a Video.js player. Registers itself as the player's
 * media when connected.
 */
export class GifVideoElement extends MediaAttachMixin(GifCustomMediaElement) {
  static readonly tagName = 'gif-video';
}

if (!customElements.get(GifVideoElement.tagName)) {
  customElements.define(GifVideoElement.tagName, GifVideoElement);
}

declare global {
  interface HTMLElementTagNameMap {
    [GifVideoElement.tagName]: GifVideoElement;
  }
}
