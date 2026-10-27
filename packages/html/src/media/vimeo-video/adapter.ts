import { CustomMediaElement } from '@videojs/media/dom';
import { escapeHtml } from '@videojs/utils/string';
import { buildVimeoIframeSrc, shouldDeferVimeoEmbed, VimeoAdapter } from '@videojs/vimeo-video';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

class VimeoCustomMediaElement extends CustomMediaElement('iframe', VimeoAdapter) {
  static override getTemplateHTML = (attrs: Record<string, string>): string => {
    const props = templateAttrsToEmbedProps(attrs);
    // A deferred embed renders an empty frame; the media builds it when playback is requested.
    const initialSrc = shouldDeferVimeoEmbed(props) ? '' : buildVimeoIframeSrc(attrs.src ?? '', props);
    const srcAttr = initialSrc ? ` src="${escapeHtml(initialSrc)}"` : '';

    return /*html*/ `
      <style>
        :host {
          display: inline-block;
          min-width: 300px;
          min-height: 150px;
          position: relative;
        }
        iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        :host(:not([controls])) {
          pointer-events: none;
        }
      </style>
      <iframe
        part="iframe"
        ${srcAttr}
        allow="accelerometer; fullscreen; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        frameborder="0"
        width="100%"
        height="100%"
        referrerpolicy="${escapeHtml(attrs.referrerpolicy ?? '')}"
      ></iframe>
    `;
  };
}

function templateAttrsToEmbedProps(attrs: Record<string, string>) {
  return {
    autoplay: attrs.autoplay !== undefined,
    defaultMuted: attrs.muted !== undefined,
    loop: attrs.loop !== undefined,
    controls: attrs.controls !== undefined,
    playsInline: attrs.playsinline !== undefined,
    preload: (attrs.preload as 'none' | 'metadata' | 'auto' | undefined) ?? 'metadata',
  };
}

export class VimeoVideo extends MediaAttachMixin(VimeoCustomMediaElement) {}
