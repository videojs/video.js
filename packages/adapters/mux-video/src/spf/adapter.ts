import { type CreateEngine, HlsVideoAdapter, type HlsVideoAdapterProps } from '@videojs/spf/adapters/hls-video';
import { createEngine } from '@videojs/spf/engines/hls-video-mpeg-ts';

import { type MuxAdapterProps, MuxMixin } from './mixin';

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
 * Plus- and basic-tier playback IDs are packaged as MPEG-TS; this flavor plays them through
 * `@videojs/spf/engines/hls-video-mpeg-ts`, where the plain `<hls-video>` refuses them.
 */
export class MuxVideoAdapter extends MuxMixin(HlsVideoAdapter) {
  static override readonly defaultProps: Omit<HlsVideoAdapterProps, 'src' | 'source'> & MuxAdapterProps = {
    ...HlsVideoAdapter.defaultProps,
    src: '',
    source: null,
  };

  static override readonly createEngine: CreateEngine = createEngine;
}
