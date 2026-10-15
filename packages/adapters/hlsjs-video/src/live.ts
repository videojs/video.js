import { MediaStreamTypes } from '@videojs/media';
import type { Constructor } from '@videojs/utils/types';
import type { LevelLoadedData } from 'hls.js';
import Hls from 'hls.js';

import type { HlsEngineHost, HlsPlaylistTypes } from './types';

export function HlsJsLiveMixin<Base extends Constructor<HlsEngineHost>>(BaseClass: Base) {
  class HlsJsLive extends (BaseClass as Constructor<HlsEngineHost>) {
    #targetLiveWindow = Number.NaN;
    #seekToLiveAbort: AbortController | null = null;
    #seekToLivePending = false;

    constructor(...args: any[]) {
      super(...args);

      const { engine } = this;

      engine?.on(Hls.Events.MANIFEST_LOADING, () => {
        this.#reset();
        this.#armSeekToLive();
      });
      engine?.on(Hls.Events.MEDIA_ATTACHED, () => this.#armSeekToLive());
      engine?.on(Hls.Events.MEDIA_DETACHED, () => this.#disarmSeekToLive());
      engine?.on(Hls.Events.DESTROYING, () => {
        this.#reset();
        this.#disarmSeekToLive();
      });
      engine?.on(Hls.Events.LEVEL_LOADED, (_event: string, data: LevelLoadedData) => {
        this.#derive(data.details);

        // For `preload="none"`/`"metadata"` the manifest only loads after the
        // first play, so retry the seek once `liveEdgeStart` becomes finite.
        if (this.#seekToLivePending) this.#trySeekToLive();
      });
    }

    get targetLiveWindow() {
      return this.#targetLiveWindow;
    }

    // Read from hls.js at read time. No cached state, no event. hls.js applies the playlist hold-back, the
    // `liveSyncDuration` / `liveSyncDurationCount` config and `lowLatencyMode`, so this is where hls.js itself plays.
    get liveEdgeStart() {
      if (Number.isNaN(this.#targetLiveWindow)) return Number.NaN;

      // Keep `NaN` until the media has a seekable range, so the first-play seek does not run before the media can seek.
      const { target } = this;
      if (!target?.seekable.length) return Number.NaN;

      return this.engine?.liveSyncPosition ?? Number.NaN;
    }

    #derive(details: LevelLoadedData['details']) {
      if (!details.live) return this.#reset();

      const info = getStreamInfoFromHlsjsLevelDetails(details);

      this.#updateConfig(info);
      this.#setTargetLiveWindow(info.targetLiveWindow);
    }

    #reset() {
      this.#setTargetLiveWindow(Number.NaN);
    }

    #updateConfig({ streamType, lowLatency }: StreamInfo) {
      if (streamType === MediaStreamTypes.LIVE) {
        // Update hls.js config for live/ll-live
        const hls = this.engine;
        if (!hls) return;

        if (lowLatency) {
          hls.config.backBufferLength = hls.userConfig.backBufferLength ?? 4;
          hls.config.maxFragLookUpTolerance = hls.userConfig.maxFragLookUpTolerance ?? 0.001;
          // For ll-hls, ensure that up switches are weighted the same as down switches to mitigate
          // cases of getting stuck at lower bitrates.
          hls.config.abrBandWidthUpFactor = hls.userConfig.abrBandWidthUpFactor ?? hls.config.abrBandWidthFactor;
        } else {
          hls.config.backBufferLength = hls.userConfig.backBufferLength ?? 8;
        }
      }
    }

    #setTargetLiveWindow(value: number) {
      if (Object.is(this.#targetLiveWindow, value)) return;

      this.#targetLiveWindow = value;
      this.dispatchEvent(new Event('targetlivewindowchange'));
    }

    /**
     * Arm a one-shot seek-to-live on the first user-initiated `play`. Skipped when `autoplay` is set, since hls.js
     * positions at the live edge during its own startup sequence and a programmatic seek would race that.
     */
    #armSeekToLive() {
      this.#disarmSeekToLive();

      const target = this.target as HTMLVideoElement | null;
      if (!target || target.autoplay) return;

      this.#seekToLiveAbort = new AbortController();
      target.addEventListener(
        'play',
        () => {
          this.#seekToLivePending = true;
          this.#trySeekToLive();
        },
        { signal: this.#seekToLiveAbort.signal, once: true }
      );
    }

    #disarmSeekToLive() {
      this.#seekToLiveAbort?.abort();
      this.#seekToLiveAbort = null;
      this.#seekToLivePending = false;
    }

    #trySeekToLive() {
      const target = this.target as HTMLVideoElement | null;
      if (!target) return;

      const { liveEdgeStart } = this;
      if (!Number.isFinite(liveEdgeStart)) return;

      if (target.currentTime < liveEdgeStart) {
        target.currentTime = liveEdgeStart;
      }

      this.#seekToLivePending = false;
    }
  }

  return HlsJsLive as unknown as Base &
    Constructor<{ readonly liveEdgeStart: number; readonly targetLiveWindow: number }>;
}

type StreamInfo = ReturnType<typeof getStreamInfoFromHlsjsLevelDetails>;

const getStreamInfoFromHlsjsLevelDetails = (levelDetails: LevelLoadedData['details']) => {
  const playlistType: HlsPlaylistTypes = levelDetails.type as HlsPlaylistTypes;
  const streamType = toStreamTypeFromPlaylistType(playlistType);
  const targetLiveWindow = toTargetLiveWindowFromPlaylistType(playlistType);
  const lowLatency = !!levelDetails.partList?.length;

  return {
    streamType,
    targetLiveWindow,
    lowLatency,
  };
};

const toStreamTypeFromPlaylistType = (playlistType: HlsPlaylistTypes) => {
  return playlistType === 'VOD' ? MediaStreamTypes.ON_DEMAND : MediaStreamTypes.LIVE;
};

const toTargetLiveWindowFromPlaylistType = (playlistType: HlsPlaylistTypes) => {
  if (playlistType === 'EVENT') return Number.POSITIVE_INFINITY;

  if (playlistType === 'VOD') return Number.NaN;

  return 0;
};
