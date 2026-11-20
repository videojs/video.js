/**
 * Mock mixin-chain media element — mirrors MuxVideo / NativeHlsVideo.
 *
 * Exercises: standard composition where the host is a mixin chain, plus an
 * element mixin that adds an attribute of its own (mirrors MuxVideoMixin's
 * `poster-time`).
 */
import { CustomMediaElement } from '../../../../media/src/dom/custom-media-element';
import { MixinHost } from '../../../../media/src/dom/mixin';

// Stub — the builder parses the AST, it doesn't run the code.
function MediaAttachMixin(base: any) {
  return base;
}

function PosterFrameMixin<Base extends new (...args: any[]) => HTMLElement>(BaseClass: Base): Base {
  class PosterFrameElement extends BaseClass {
    /**
     * @attr {number} poster-frame - The time, in seconds, of the frame to show as the poster.
     * See [Add a poster](https://videojs.org/docs/guides/poster).
     */
    static get observedAttributes(): string[] {
      return [...((BaseClass as any).observedAttributes ?? []), 'poster-frame'];
    }
  }

  return PosterFrameElement;
}

export class MixinVideo extends PosterFrameMixin(MediaAttachMixin(CustomMediaElement('video', MixinHost))) {}
