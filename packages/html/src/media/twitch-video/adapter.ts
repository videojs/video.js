import { CustomMediaElement } from '@videojs/media/dom';
import { buildTwitchIframeSrc, TwitchAdapter } from '@videojs/twitch-video';
import { escapeHtml } from '@videojs/utils/string';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

class TwitchCustomMediaElement extends CustomMediaElement('iframe', TwitchAdapter) {
  static override getTemplateHTML = (attrs: Record<string, string>): string => {
    const initialSrc = buildTwitchIframeSrc(attrs.src ?? '', templateAttrsToEmbedProps(attrs));
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
        allow="accelerometer; fullscreen; autoplay; encrypted-media; picture-in-picture;"
        sandbox="allow-modals allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        scrolling="no"
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

export class TwitchVideo extends MediaAttachMixin(TwitchCustomMediaElement) {}
