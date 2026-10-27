import { CustomMediaElement } from '@videojs/media/dom';
import { buildSoundCloudIframeSrc, SoundCloudAdapter, shouldDeferSoundCloudWidget } from '@videojs/soundcloud-audio';
import { escapeHtml } from '@videojs/utils/string';

import { MediaAttachMixin } from '../../store/media-attach-mixin';

class SoundCloudCustomMediaElement extends CustomMediaElement('iframe', SoundCloudAdapter) {
  static override getTemplateHTML = (attrs: Record<string, string>): string => {
    const props = {
      src: attrs.src ?? '',
      // SAFETY: only `'none'` is compared, so any other value reads as not deferring, as it would for the media.
      preload: (attrs.preload as 'none' | 'metadata' | 'auto' | undefined) ?? 'metadata',
      autoplay: attrs.autoplay !== undefined,
      controls: attrs.controls !== undefined,
    };
    // A deferred widget renders an empty frame; the media loads it when playback is requested.
    const initialSrc = shouldDeferSoundCloudWidget(props) ? '' : buildSoundCloudIframeSrc(props.src);
    const srcAttr = initialSrc ? ` src="${escapeHtml(initialSrc)}"` : '';

    return /*html*/ `
      <style>
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
        /*
         * The widget is SoundCloud's own chrome, so without controls it is a
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
