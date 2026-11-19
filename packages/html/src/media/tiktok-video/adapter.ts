import { CustomMediaElement } from '@videojs/media/dom';
import { buildTikTokIframeSrc, TikTokAdapter, type TikTokAdapterProps } from '@videojs/tiktok-video';
import { escapeHtml } from '@videojs/utils/string';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

class TikTokCustomMediaElement extends CustomMediaElement('iframe', TikTokAdapter) {
  static override getTemplateHTML = (attrs: Record<string, string>): string => {
    const initialSrc = buildTikTokIframeSrc(attrs.src ?? '', templateAttrsToEmbedProps(attrs));
    const srcAttr = initialSrc ? ` src="${escapeHtml(initialSrc)}"` : '';

    return /*html*/ `
      <style>
        :host {
          display: inline-block;
          /* TikTok videos are portrait, and the player refuses to draw its chrome
             below 325x578, so that is where this host starts rather than the
             300x150 the landscape embeds use. */
          min-width: 325px;
          min-height: 578px;
          position: relative;
        }
        iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        /* A cross-origin frame swallows every pointer event, so the skin above it
           never sees the hover that reveals the controls. */
        :host(:not([controls])) {
          pointer-events: none;
        }
      </style>
      <iframe
        part="iframe"
        title="TikTok video player"
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

// Only the props the embed URL is built from; a URL differing from the host's would have it rebuild the frame on mount.
function templateAttrsToEmbedProps(attrs: Record<string, string>): Partial<TikTokAdapterProps> {
  return {
    autoplay: attrs.autoplay !== undefined,
    defaultMuted: attrs.muted !== undefined,
    loop: attrs.loop !== undefined,
    controls: attrs.controls !== undefined,
  };
}

export class TikTokVideo extends MediaAttachMixin(TikTokCustomMediaElement) {}
