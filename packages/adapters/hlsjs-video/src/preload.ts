import type { Constructor } from '@videojs/utils/types';
import Hls from 'hls.js';

import type { HlsEngineHost } from './types';

export type PreloadType = '' | 'none' | 'metadata' | 'auto';

/**
 * Manages HLS preload behavior by mapping the media element's `preload` attribute to hls.js `startLoad` / buffer-limit
 * configuration.
 *
 * - `'auto'`, `autoplay`, or already playing → full buffer limits, immediate start.
 * - `'metadata'` → minimal buffer (1 byte / 1 second), limits raised on play.
 * - `'none'` / `''` → no start, deferred load on play.
 *
 * `autoplay` overrides `preload`, as it does for a native `<video>`: the browser only starts it once enough has loaded,
 * so a load deferred until `play` would never begin.
 *
 * Loading is started at most once per source. Widening the limits afterwards is a plain config write, never a second
 * `startLoad()`.
 */
export function HlsJsPreloadMixin<Base extends Constructor<HlsEngineHost>>(BaseClass: Base) {
  class HlsJsPreload extends (BaseClass as Constructor<HlsEngineHost>) {
    #preloadAbort: AbortController | null = null;
    #preload: PreloadType = 'metadata';
    #defaultMaxBufferLength: number | undefined;
    #defaultMaxBufferSize: number | undefined;
    #loadStarted = false;

    constructor(...args: any[]) {
      super(...args);

      this.engine?.on(Hls.Events.MANIFEST_LOADING, () => {
        // `loadSource()` stops loading before announcing the manifest, so the
        // next start for this source has to be a real `startLoad()` again.
        this.#loadStarted = false;
        this.#init();
      });
      this.engine?.on(Hls.Events.MEDIA_ATTACHED, () => this.#init());
      this.engine?.on(Hls.Events.MEDIA_DETACHED, () => this.#destroy());
      this.engine?.on(Hls.Events.DESTROYING, () => this.#destroy());
    }

    get preload(): PreloadType {
      return this.#preload;
    }

    set preload(value: PreloadType) {
      this.#preload = value;
      this.#init();
    }

    override get autoplay(): boolean {
      return super.autoplay;
    }

    // Set after the source as often as before it, so turning it on starts a load that `preload` deferred.
    override set autoplay(value: boolean) {
      super.autoplay = value;
      this.#init();
    }

    #destroy(): void {
      this.#preloadAbort?.abort();
      this.#preloadAbort = null;
      this.#loadStarted = false;
    }

    #init(): void {
      this.#preloadAbort?.abort();

      const target = this.target as HTMLVideoElement | null;
      if (!target) return;

      // Sync stored preload to the native element (may have been set before attach)
      if (target.preload !== this.preload) {
        target.preload = this.preload;
      }

      const { engine } = this;
      if (!engine) return;

      this.#defaultMaxBufferLength ??= engine.config.maxBufferLength;
      this.#defaultMaxBufferSize ??= engine.config.maxBufferSize;

      const defaultLength = this.#defaultMaxBufferLength;
      const defaultSize = this.#defaultMaxBufferSize;

      /**
       * Applies buffer limits, and starts loading only if this source has not been started yet.
       *
       * Once loading is under way, writing the limits is enough: hls.js reads both off `config` on every tick and its
       * ticker is already armed. A second `startLoad()` would open with hls.js's own `stopLoad()`, which aborts the
       * in-flight segment — and that abort resets the controller to IDLE a task later, so the next tick re-requests and
       * re-aborts, forever.
       */
      const load = (length?: number, size?: number) => {
        const { engine } = this;
        if (!engine) return;

        engine.config.maxBufferLength = length ?? defaultLength;
        engine.config.maxBufferSize = size ?? defaultSize;

        if (this.#loadStarted) {
          // No-op unless something paused buffering; ManagedMediaSource does,
          // on `endstreaming`.
          engine.resumeBuffering?.();
          return;
        }

        this.#loadStarted = true;
        engine.startLoad();
      };

      if (this.preload === 'auto' || target.autoplay || !target.paused) {
        load();
        return;
      }

      if (this.preload === 'metadata') {
        load(1, 1);
      }

      this.#preloadAbort = new AbortController();
      target.addEventListener('play', () => load(), {
        signal: this.#preloadAbort.signal,
        once: true,
      });
    }
  }

  return HlsJsPreload as unknown as Base & Constructor<{ preload: PreloadType }>;
}
