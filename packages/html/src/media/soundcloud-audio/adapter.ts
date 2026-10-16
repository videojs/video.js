import { CustomMediaElement } from '@videojs/media/dom';
import { buildSoundCloudIframeSrc, SoundCloudAdapter } from '@videojs/soundcloud-audio';
import { escapeHtml } from '@videojs/utils/string';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

class SoundCloudCustomMediaElement extends CustomMediaElement('iframe', SoundCloudAdapter) {
  static override getTemplateHTML = (attrs: Record<string, string>): string => {
    const initialSrc = buildSoundCloudIframeSrc(attrs.src ?? '');
    const srcAttr = initialSrc ? ` src="${escapeHtml(initialSrc)}"` : '';

    return /*html*/ `
      <style>
        /*
         * The widget stays on screen and takes input whether or not there are
         * controls: it is what credits the uploader and links back to
         * SoundCloud, and the skin does not cover it.
         */
        :host {
          display: block;
          position: relative;
          height: 166px;
        }
        iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }
      </style>
      <iframe
        part="iframe"
        title="SoundCloud audio player"
        ${srcAttr}
        allow="autoplay; encrypted-media"
        scrolling="no"
        frameborder="0"
        width="100%"
        height="100%"
        referrerpolicy="${escapeHtml(attrs.referrerpolicy ?? '')}"
      ></iframe>
    `;
  };
}

export class SoundCloudAudio extends MediaAttachMixin(SoundCloudCustomMediaElement) {}
