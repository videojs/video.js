import { HTMLVideoAdapter } from '@videojs/media/dom';
import type { MuxSourceBase } from '@videojs/mux';
import { HlsVideoMpegTsAdapter } from '@videojs/spf/adapters/hls-video-mpeg-ts';

import { MUX_ALTERNATIVE_MEDIA_SUGGESTION, MuxMixin } from './mixin';
import { type SpfPlaybackProps, type SpfPlaybackSource, SpfPlaybackMixin } from './playback';

/** The SPF Media `SpfVideoAdapter` plays through, with the Mux error copy pointing at the hls.js-backed flavor. */
class SpfVideoDelegate extends HlsVideoMpegTsAdapter {
  static override get alternativeMediaSuggestion(): string | undefined {
    return MUX_ALTERNATIVE_MEDIA_SUGGESTION;
  }
}

/** {@link SpfPlaybackMixin} over the SPF MPEG-TS video engine. */
export class SpfVideoAdapter extends SpfPlaybackMixin<typeof HTMLVideoAdapter, HlsVideoMpegTsAdapter>(
  HTMLVideoAdapter,
  SpfVideoDelegate
) {}

/**
 * Structured Mux source for the SPF-backed Media: Mux identity and params from {@link MuxSourceBase}, plus how to play
 * it — `type` and `preferPlayback`, as on the hls.js-backed flavor. SPF publishes no engine-shaped config, so there is
 * no `engine`.
 */
export interface MuxSource extends MuxSourceBase, Pick<SpfPlaybackSource, 'type' | 'preferPlayback'> {}

export interface MuxVideoAdapterProps {
  src: string;
  source: MuxSource | null;
}

/**
 * The Mux Media over the SPF HLS engine.
 *
 * Mirrors `@videojs/mux-video`'s hls.js-backed `MuxVideoAdapter` — same class shape, same `src`/`source` relationship,
 * same derived `contentData` — over a different engine, though named for the flavor rather than sharing that class's
 * name. Like that flavor, it hands a source to the browser's own HLS support when SPF can't play it: on a browser
 * without Media Source Extensions (iPhone Safari before iOS 17.1), for a source that isn't HLS (a static MP4
 * rendition), or when `source.preferPlayback` is `'native'`.
 *
 * `source.drm` licenses playback: a `drm.token` derives Mux's three license servers, and entries naming servers
 * outright override them. A source carrying neither prunes its encrypted renditions and reports unsupported DRM,
 * exactly as an engine with no EME does.
 *
 * Plus-tier assets and standard-latency live streams are packaged as MPEG-TS; this flavor plays them through
 * `@videojs/spf/adapters/hls-video-mpeg-ts`, where the plain `<hls-video>` refuses them.
 */
export class MuxVideoAdapter extends MuxMixin<typeof SpfVideoAdapter, MuxSource>(SpfVideoAdapter) {
  static override readonly defaultProps: Omit<SpfPlaybackProps, 'src' | 'source'> & MuxVideoAdapterProps = {
    ...SpfVideoAdapter.defaultProps,
    src: '',
    source: null,
  };
}
