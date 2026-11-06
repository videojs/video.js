import { CustomMediaElement, VideoCSSVars } from '@videojs/media/dom';
import { RelayVideoAdapter } from '@videojs/relay-video';
import { serializeAttributes } from '@videojs/utils/dom';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

class RelayCustomMediaElement extends CustomMediaElement('canvas', RelayVideoAdapter) {
  // The host generates no box and the canvas takes the video template's styling hooks, so a skin sizes and shapes it as
  // it would a `<video>`. A zero-sized bitmap reads as no video until the first frame is drawn.
  static override getTemplateHTML = (attrs: Record<string, string>): string => /*html*/ `
    <style>
      :host {
        display: contents;
      }

      canvas {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: var(${VideoCSSVars.borderRadius});
        object-fit: var(${VideoCSSVars.objectFit}, contain);
        object-position: var(${VideoCSSVars.objectPosition}, center);
      }
    </style>
    <canvas${serializeAttributes(attrs)} width="0" height="0"></canvas>
  `;
}

export class RelayVideo extends MediaAttachMixin(RelayCustomMediaElement) {}
