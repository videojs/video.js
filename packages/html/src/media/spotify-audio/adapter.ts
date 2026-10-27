import { CustomMediaElement } from '@videojs/media/dom';
import { buildSpotifyIframeSrc, SpotifyAdapter, shouldDeferSpotifyEmbed } from '@videojs/spotify-audio';
import { escapeHtml } from '@videojs/utils/string';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

class SpotifyCustomMediaElement extends CustomMediaElement('iframe', SpotifyAdapter) {
  static override getTemplateHTML = (attrs: Record<string, string>): string => {
    const props = templateAttrsToEmbedProps(attrs);
    // A deferred embed renders an empty frame; the media builds it when playback is requested.
    const initialSrc = shouldDeferSpotifyEmbed(props) ? '' : buildSpotifyIframeSrc(attrs.src ?? '', props);
    const srcAttr = initialSrc ? ` src="${escapeHtml(initialSrc)}"` : '';

    return /*html*/ `
      <style>
        :host {
          display: block;
          min-width: 160px;
          min-height: 80px;
          position: relative;
        }
        iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
        /*
         * Without Spotify's own chrome the embed is a transport and nothing else:
         * its player UI would otherwise show through whatever skin is drawn over
         * it. Hidden rather than merely inert, and important so a consumer's own
         * display rule cannot put it back on screen. An iframe in a hidden subtree
         * still loads and plays its src.
         */
        :host(:not([controls])) {
          display: none !important;
        }
      </style>
      <iframe
        part="iframe"
        ${srcAttr}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
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
    loop: attrs.loop !== undefined,
    controls: attrs.controls !== undefined,
    playsInline: attrs.playsinline !== undefined,
    preload: (attrs.preload as 'none' | 'metadata' | 'auto' | undefined) ?? 'metadata',
  };
}

export class SpotifyAudio extends MediaAttachMixin(SpotifyCustomMediaElement) {}
