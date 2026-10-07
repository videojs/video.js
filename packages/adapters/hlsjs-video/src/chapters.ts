import { loadChaptersTracks } from '@videojs/spf/dom';
import { APPLE_HLS_CHAPTERS_DATA_ID } from '@videojs/spf/hls';
import { isString } from '@videojs/utils/predicate';
import type { Constructor } from '@videojs/utils/types';
import type { ManifestLoadedData } from 'hls.js';
import Hls from 'hls.js';

import { isCredentialed } from './request-credentials';
import type { HlsEngineHost } from './types';

/**
 * Chapters for hls.js playback: the Apple JSON chapters document the multivariant playlist references
 * (`#EXT-X-SESSION-DATA:DATA-ID="com.apple.hls.chapters"`), loaded as hidden `<track kind="chapters">` elements by
 * SPF's `loadChaptersTracks`, as SPF and native HLS playback do. The track in hls.js's `subtitlePreference` language
 * leads, as SPF's leads in its `preferredSubtitleLanguage`.
 *
 * Read from hls.js's own `sessionData`, which keeps one entry per `DATA-ID` — the last. SPF and native HLS read the
 * first entry with a `URI`, so the paths differ only for a playlist naming several chapters documents.
 *
 * Read on `MANIFEST_LOADED`, whose `url` is the response URL, so a relative `URI` resolves past redirects. The tracks
 * go with the source (`MANIFEST_LOADING`) and the element (`MEDIA_DETACHED`, `DESTROYING`); a manifest that loaded
 * before media was attached loads once it is. The document request sends cookies under `crossorigin="use-credentials"`,
 * as hls.js's own requests do.
 */
export function HlsJsChaptersMixin<Base extends Constructor<HlsEngineHost>>(BaseClass: Base) {
  class HlsJsChapters extends (BaseClass as Constructor<HlsEngineHost>) {
    #chaptersUrl: string | null = null;
    #chapters: AbortController | null = null;

    constructor(...args: any[]) {
      super(...args);

      const { engine } = this;
      if (!engine) return;

      engine.on(Hls.Events.MANIFEST_LOADING, () => this.#reset());
      engine.on(Hls.Events.MANIFEST_LOADED, (_event: string, data: ManifestLoadedData) => {
        const uri = data.sessionData?.[APPLE_HLS_CHAPTERS_DATA_ID]?.URI;

        this.#reset();
        this.#chaptersUrl = isString(uri) && uri ? resolveUrl(uri, data.url) : null;
        this.#load();
      });
      engine.on(Hls.Events.MEDIA_ATTACHED, () => this.#load());
      engine.on(Hls.Events.MEDIA_DETACHED, () => this.#stop());
      engine.on(Hls.Events.DESTROYING, () => this.#reset());
    }

    #load(): void {
      // The hls.js delegate always binds to the real `<video>` element.
      const target = this.target as HTMLVideoElement | null;
      if (!target || !this.#chaptersUrl || this.#chapters) return;

      this.#chapters = new AbortController();
      loadChaptersTracks(target, this.#chaptersUrl, this.#chapters.signal, {
        preferredLanguage: this.engine?.config.subtitlePreference?.lang,
        credentials: isCredentialed(target.crossOrigin) ? 'include' : undefined,
      });
    }

    #stop(): void {
      this.#chapters?.abort();
      this.#chapters = null;
    }

    #reset(): void {
      this.#chaptersUrl = null;
      this.#stop();
    }
  }

  return HlsJsChapters as unknown as Base;
}

function resolveUrl(uri: string, baseUrl: string): string | null {
  try {
    return new URL(uri, baseUrl).href;
  } catch {
    return null;
  }
}
