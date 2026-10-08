import { loadChaptersTracks } from '@videojs/spf/dom';
import { APPLE_HLS_CHAPTERS_DATA_ID, findSessionDataUri } from '@videojs/spf/hls';
import type { Constructor } from '@videojs/utils/types';

import type { NativeHlsHost } from './errors';
import { fetchPlaylist, isMultivariantPlaylist, looksLikeM3u8 } from './m3u8-utils';

/**
 * Chapters for native HLS playback. The browser never exposes the multivariant playlist's session data, so the playlist
 * is fetched here — once per source, on `loadstart` — and the chapters document it references is loaded with SPF's
 * `loadChaptersTracks`, as SPF and hls.js playback do. One request signal spans both fetches, so the tracks leave with
 * the source (`emptied`) and with the element (`detach`, `destroy`).
 */
export function NativeHlsChaptersMixin<Base extends Constructor<NativeHlsHost>>(BaseClass: Base) {
  class NativeHlsChapters extends (BaseClass as Constructor<NativeHlsHost>) {
    #disconnect: AbortController | null = null;
    #request: AbortController | null = null;
    #currentSrc = '';

    attach(target: HTMLVideoElement) {
      super.attach(target);
      this.#init(target);
    }

    detach() {
      this.#destroy();
      super.detach?.();
    }

    destroy() {
      this.#destroy();
      super.destroy?.();
    }

    #destroy() {
      this.#disconnect?.abort();
      this.#disconnect = null;
      this.#reset();
    }

    #reset() {
      this.#request?.abort();
      this.#request = null;
      this.#currentSrc = '';
    }

    #init(target: HTMLMediaElement) {
      this.#destroy();
      this.#disconnect = new AbortController();

      const { signal } = this.#disconnect;

      target.addEventListener('loadstart', () => this.#refresh(target), { signal });
      target.addEventListener('emptied', () => this.#reset(), { signal });

      if (target.currentSrc || target.src) this.#refresh(target);
    }

    async #refresh(target: HTMLMediaElement) {
      const src = target.currentSrc || target.src;
      if (!src || !looksLikeM3u8(src) || src === this.#currentSrc) return;

      this.#reset();
      this.#currentSrc = src;

      const request = (this.#request = new AbortController());

      try {
        const playlist = await fetchPlaylist(src, { signal: request.signal });
        if (request.signal.aborted || !isMultivariantPlaylist(playlist.text)) return;

        const url = findSessionDataUri(playlist.text, APPLE_HLS_CHAPTERS_DATA_ID, playlist.url);

        if (url) loadChaptersTracks(target, url, request.signal);
      } catch {
        // Network / CORS errors and an unresolvable URI leave the source without chapters.
      }
    }
  }

  return NativeHlsChapters as unknown as Base;
}
