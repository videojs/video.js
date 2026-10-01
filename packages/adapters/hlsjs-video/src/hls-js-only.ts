import type {
  EngineAdapter,
  MediaError,
  MediaLiveCapability,
  MediaResolution,
  MediaSourceCapability,
  MediaStreamTypeCapability,
} from '@videojs/media';
import { HTMLVideoAdapter } from '@videojs/media/dom';
import { MediaTracksMixin, type WithMediaTracks } from '@videojs/media/media-tracks';
import type { MixinReturn } from '@videojs/utils/types';
import Hls, { type HlsConfig } from 'hls.js';

import { HlsJsAirPlayMixin } from './airplay-bridge';
import { createCapLevelController, DEFAULT_MIN_AUTO_RESOLUTION, type RenditionCapPolicy } from './cap-level';
import { setupDrm } from './drm';
import { HlsJsErrorsMixin } from './errors';
import { HlsJsLiveMixin } from './live';
import { HlsJsMediaTracksMixin } from './media-tracks';
import { HlsJsMetadataTracksMixin } from './metadata-tracks';
import { HlsJsPreloadMixin } from './preload';
import { HlsJsStreamTypeMixin } from './stream-type';
import { HlsJsTextTracksMixin, withPreservedTextTracks } from './text-tracks';

const defaultHlsConfig: Partial<HlsConfig> = {
  backBufferLength: 30,
  renderTextTracksNatively: false,
  liveDurationInfinity: true,
  // Runs hls.js's capping loop, which every rendition cap is evaluated on, not
  // only the one named after it. `capRenditionToPlayerSize` is the live switch.
  capLevelToPlayerSize: true,
  capLevelOnFPSDrop: true,
  autoStartLoad: false,
};

export interface HlsJsOnlyMediaParams {
  /** Options forwarded to the hls.js constructor, merged over {@link defaultHlsConfig}. */
  config: Partial<HlsConfig>;
}

class HlsJsOnlyAdapterCore extends HTMLVideoAdapter implements EngineAdapter<Hls, HTMLVideoElement> {
  #engine: Hls | null = null;
  #capPolicy: RenditionCapPolicy = {
    maxAutoResolution: undefined,
    capToPlayerSize: true,
    minAutoResolution: DEFAULT_MIN_AUTO_RESOLUTION,
  };

  constructor(params: HlsJsOnlyMediaParams) {
    super();
    const config = { ...defaultHlsConfig, ...params.config };

    this.#engine = new Hls({
      ...config,
      // Layered over whatever controller the config already names, so a
      // `capLevelController` passed through `source.engine` keeps working.
      capLevelController: createCapLevelController(this.#capPolicy, config.capLevelController),
    });

    setupDrm(this.#engine);
  }

  get engine() {
    return this.#engine;
  }

  /** Ceiling on automatic rendition selection. See `HlsSource.maxAutoResolution`. */
  get maxAutoResolution(): MediaResolution | undefined {
    return this.#capPolicy.maxAutoResolution;
  }

  set maxAutoResolution(value: MediaResolution | undefined) {
    if (this.#capPolicy.maxAutoResolution === value) return;

    this.#capPolicy.maxAutoResolution = value;
    this.#capPolicy.controller?.apply();
  }

  /** Whether the rendered size caps selection. See `HlsSource.capRenditionToPlayerSize`. */
  get capRenditionToPlayerSize(): boolean {
    return this.#capPolicy.capToPlayerSize;
  }

  set capRenditionToPlayerSize(value: boolean | undefined) {
    // Defaults resolve here rather than in the caller, so the getters report the
    // cap that is actually in force instead of what a source happened to name.
    const next = value ?? true;
    if (this.#capPolicy.capToPlayerSize === next) return;

    this.#capPolicy.capToPlayerSize = next;
    this.#capPolicy.controller?.apply();
  }

  /** Floor on the player-size cap. See `HlsSource.minAutoResolution`. */
  get minAutoResolution(): MediaResolution {
    return this.#capPolicy.minAutoResolution ?? DEFAULT_MIN_AUTO_RESOLUTION;
  }

  set minAutoResolution(value: MediaResolution | undefined) {
    const next = value ?? DEFAULT_MIN_AUTO_RESOLUTION;
    if (this.#capPolicy.minAutoResolution === next) return;

    this.#capPolicy.minAutoResolution = next;
    this.#capPolicy.controller?.apply();
  }

  get src() {
    return this.#engine?.url ?? '';
  }

  set src(src: string) {
    // Attaching, detaching, and loading a source each reset every text track on
    // the element, sideloaded ones included. See `withPreservedTextTracks`.
    withPreservedTextTracks(this.target as HTMLVideoElement | null, () => this.#engine?.loadSource(src));
  }

  attach(target: HTMLVideoElement) {
    super.attach(target);
    withPreservedTextTracks(target, () => this.#engine?.attachMedia(target));
  }

  detach() {
    withPreservedTextTracks(this.target as HTMLVideoElement | null, () => this.#engine?.detachMedia());
    super.detach();
  }

  destroy() {
    this.detach();
    this.#engine?.destroy();
    this.#engine = null;
  }
}

interface HlsJsMediaCapabilities
  extends MediaStreamTypeCapability, MediaLiveCapability, Pick<MediaSourceCapability, 'preload'> {
  readonly error: MediaError | null;
}

const HlsJsOnlyAdapterComposed = HlsJsAirPlayMixin(
  HlsJsPreloadMixin(
    HlsJsLiveMixin(
      HlsJsStreamTypeMixin(
        HlsJsMediaTracksMixin(
          HlsJsMetadataTracksMixin(HlsJsTextTracksMixin(HlsJsErrorsMixin(MediaTracksMixin(HlsJsOnlyAdapterCore))))
        )
      )
    )
  )
) as unknown as MixinReturn<WithMediaTracks<typeof HlsJsOnlyAdapterCore>, HlsJsMediaCapabilities>;

export class HlsJsOnlyAdapter extends HlsJsOnlyAdapterComposed {}
