import { CustomMediaElement } from '@videojs/media/dom';
import { buildPlayerJsIframeSrc, PlayerJsAdapter, type PlayerJsAdapterProps } from '@videojs/playerjs-video';
import { escapeHtml } from '@videojs/utils/string';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

class PlayerJsCustomMediaElement extends CustomMediaElement('iframe', PlayerJsAdapter) {
  static override getTemplateHTML = (attrs: Record<string, string>): string => {
    const initialSrc = buildPlayerJsIframeSrc(attrs.src ?? '', templateAttrsToEmbedProps(attrs));
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
        /* A cross-origin frame swallows every pointer event, so the skin above it
           never sees the hover that reveals the controls. Not every service lets
           its chrome be hidden, so without controls the frame is kept out of
           hit-testing as well. */
        :host(:not([controls])) {
          pointer-events: none;
        }
      </style>
      <iframe
        part="iframe"
        title="Video player"
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

// The props the embed URL is built from for the services the adapter recognizes. A URL differing from the one the
// adapter builds would have it rebuild the frame on mount.
function templateAttrsToEmbedProps(attrs: Record<string, string>): Partial<PlayerJsAdapterProps> {
  return {
    autoplay: attrs.autoplay !== undefined,
    defaultMuted: attrs.muted !== undefined,
    loop: attrs.loop !== undefined,
    controls: attrs.controls !== undefined,
    preload: (attrs.preload as PlayerJsAdapterProps['preload']) ?? PlayerJsAdapter.defaultProps.preload,
  };
}

export class PlayerJsVideo extends MediaAttachMixin(PlayerJsCustomMediaElement) {}
