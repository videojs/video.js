// Its own module on purpose: `@videojs/mux-audio/spf` imports this beside `MuxMixin` and must not drag
// `MuxVideoAdapter` — whose `MuxMixin(HlsVideoAdapter)` class expression is not droppable — and the
// full video engine behind it into the audio-only bundle.
import { defaultConfig as mpegTsTransmuxConfig } from '@videojs/spf/features/mpeg-ts-transmux';

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
