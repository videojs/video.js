import { CustomMediaElement } from '@videojs/media/dom';
import { buildMixcloudIframeSrc, MixcloudAdapter } from '@videojs/mixcloud-audio';
import { escapeHtml } from '@videojs/utils/string';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

class MixcloudCustomMediaElement extends CustomMediaElement('iframe', MixcloudAdapter) {
  static override getTemplateHTML = (attrs: Record<string, string>): string => {
    const initialSrc = buildMixcloudIframeSrc(attrs.src ?? '');
    const srcAttr = initialSrc ? ` src="${escapeHtml(initialSrc)}"` : '';

    return /*html*/ `
      <style>
        :host {
          display: block;
          position: relative;
          height: 120px;
        }
        iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        /*
         * The widget is Mixcloud's own chrome, so without controls it is a
         * transport and nothing else. Hidden rather than merely inert, and
         * important so a consumer's own display rule cannot put it back on
         * screen. An iframe in a hidden subtree still loads and plays its src.
         */
        :host(:not([controls])) {
          display: none !important;
        }
      </style>
      <iframe
        part="iframe"
        title="Mixcloud audio player"
        ${srcAttr}
        allow="autoplay; encrypted-media"
        frameborder="0"
        width="100%"
        height="100%"
        referrerpolicy="${escapeHtml(attrs.referrerpolicy ?? '')}"
      ></iframe>
    `;
  };
}

export class MixcloudAudio extends MediaAttachMixin(MixcloudCustomMediaElement) {}
