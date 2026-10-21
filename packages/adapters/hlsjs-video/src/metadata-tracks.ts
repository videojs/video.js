import type { Constructor } from '@videojs/utils/types';
import Hls from 'hls.js';

import { withReadableCues } from './text-tracks';
import type { HlsEngineHost } from './types';

/**
 * Ensures user-authored metadata and chapters `<track>` elements stay loaded when hls.js is active.
 *
 * Hls.js forcibly clears all cues from text tracks on manifest loads and media attaches. This mixin re-enables those
 * tracks by forcing `mode = 'hidden'` and reloading the track source when cues have been wiped.
 */
export function HlsJsMetadataTracksMixin<Base extends Constructor<HlsEngineHost>>(BaseClass: Base) {
  class HlsJsMetadataTracks extends (BaseClass as Constructor<HlsEngineHost>) {
    constructor(...args: any[]) {
      super(...args);

      // Watch out here, AFTER the manifest is loaded!
      this.engine?.on(Hls.Events.MANIFEST_LOADED, () => this.#forceHiddenTracks());
      this.engine?.on(Hls.Events.MEDIA_ATTACHED, () => this.#forceHiddenTracks());
    }

    #forceHiddenTracks(): void {
      // The hls.js delegate always binds to the real `<video>` element.
      const target = this.target as HTMLVideoElement | null;
      if (!target) return;

      for (const trackEl of target.querySelectorAll('track')) {
        const { track } = trackEl;
        if (!(track.kind === 'metadata' || track.kind === 'chapters')) continue;

        const src = trackEl.getAttribute('src') ?? '';
        const TRACK_LOADED = 2;
        let currentTrackEl = trackEl;

        // Disabled tracks hide their cues; read through hidden mode before
        // deciding hls.js wiped them and the resource needs to load again.
        if (src && trackEl.readyState === TRACK_LOADED && withReadableCues(track, () => !track.cues?.length)) {
          const clonedTrackEl = trackEl.cloneNode() as HTMLTrackElement;

          target.replaceChild(clonedTrackEl, trackEl);
          currentTrackEl = clonedTrackEl;
        }

        // Force mode to 'hidden' for default tracks (independent of replacement).
        if (currentTrackEl.default && currentTrackEl.track.mode !== 'hidden') {
          currentTrackEl.track.mode = 'hidden';
        }
      }
    }
  }

  return HlsJsMetadataTracks as unknown as Base;
}
