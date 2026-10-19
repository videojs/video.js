import {
  HlsVideoAdapter,
  type HlsVideoAdapterOptions,
  type HlsVideoAdapterProps,
} from '@videojs/spf/adapters/hls-video';
import { defaultConfig as mpegTsTransmuxConfig } from '@videojs/spf/features/mpeg-ts-transmux';

import { type MuxAdapterProps, MuxMixin } from './mixin';

/**
 * The engine config the Mux flavors lay under a consumer's: `mpegTsTransmuxFeature`'s defaults, so the MPEG-TS that Mux
 * packages at the plus and basic tiers plays by transmuxing to fMP4 on the client. A feature with no behaviors is only
 * config, which is why the Media can compose it this way without rebuilding the engine. A consumer's own `config` keys
 * win, so overriding the probe or a pipeline stays possible.
 *
 * Mux-only on purpose: the transmuxer covers what Mux packages (one program, H.264 + AAC-LC, unencrypted), not every
 * MPEG-TS a general HLS source might carry, so the plain `<hls-video>` keeps its unsupported-format verdict.
 */
export function withMpegTsTransmux<Options extends { config?: object | undefined }>(options?: Options): Options {
  // SAFETY: the merge only adds keys the engine config declares optional; the
  // consumer's own keys are kept as given, so the result is still an `Options`.
  return { ...options, config: { ...mpegTsTransmuxConfig, ...options?.config } } as Options;
}

/**
 * The Mux Media over the SPF HLS engine.
 *
 * Mirrors `@videojs/mux-video`'s hls.js-backed `MuxVideoAdapter` — same class shape, same `src`/`source` relationship,
 * same derived `contentData` — over a different engine, though named for the flavor rather than sharing that class's
 * name. It carries no `engine` or `preferPlayback`: SPF publishes no engine-shaped config for a consumer to pass, so
 * the source is Mux identity and nothing else.
 *
 * `source.drm` licenses playback: a `drm.token` derives Mux's three license servers, and entries naming servers
 * outright override them. A source carrying neither prunes its encrypted renditions and reports unsupported DRM,
 * exactly as an engine with no EME does.
 *
 * Plus- and basic-tier playback IDs are packaged as MPEG-TS; this flavor transmuxes them (see
 * {@link withMpegTsTransmux}), where the plain `<hls-video>` refuses them.
 */
export class MuxVideoAdapter extends MuxMixin(HlsVideoAdapter) {
  static override readonly defaultProps: Omit<HlsVideoAdapterProps, 'src' | 'source'> & MuxAdapterProps = {
    ...HlsVideoAdapter.defaultProps,
    src: '',
    source: null,
  };

  constructor(options?: HlsVideoAdapterOptions) {
    super(withMpegTsTransmux(options));
  }
}
