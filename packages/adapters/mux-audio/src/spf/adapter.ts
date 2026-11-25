// Only the mixins are used from `@videojs/mux-video/spf`. Its `MuxVideoAdapter` (and the full HLS engine behind it) is
// left for the consumer's bundler to drop, which `sideEffects: false` on that package allows, so this entry stays
// audio-only.
import { HTMLVideoAdapter } from '@videojs/media/dom';
import {
  MUX_ALTERNATIVE_MEDIA_SUGGESTION,
  MuxMixin,
  type MuxSource,
  type MuxVideoAdapterProps,
  SpfPlaybackMixin,
  type SpfPlaybackProps,
} from '@videojs/mux-video/spf';
import { HlsAudioMpegTsAdapter } from '@videojs/spf/adapters/hls-audio-mpeg-ts';

/** The Mux audio flavor's props: the same `src` and structured `source` as the video flavor's. */
export type MuxAudioAdapterProps = MuxVideoAdapterProps;

/** The SPF Media `MuxAudioAdapter` plays through, with the Mux error copy pointing at the hls.js-backed flavor. */
class SpfAudioDelegate extends HlsAudioMpegTsAdapter {
  static override get alternativeMediaSuggestion(): string | undefined {
    return MUX_ALTERNATIVE_MEDIA_SUGGESTION;
  }
}

// Over the video host adapter, as the hls.js-backed `MuxAudioAdapter` is (it
// extends the video Media), so both flavors present one surface. The engine
// underneath is audio-only either way.
const SpfAudioAdapter = SpfPlaybackMixin<typeof HTMLVideoAdapter, HlsAudioMpegTsAdapter>(
  HTMLVideoAdapter,
  SpfAudioDelegate
);

/**
 * The Mux Media over the SPF audio-only HLS engine.
 *
 * Same Mux surface as the video flavor — `src`, the structured `source`, and the derived `contentData` all come from
 * the shared mixin — over the subtractive engine, so only the audio renditions of whatever the playback ID names are
 * fetched. That is the one place this diverges from the hls.js-backed `<mux-audio>`, which runs the full engine and
 * downloads video renditions it never shows.
 *
 * `source.drm` is accepted but inert, unlike on the video flavor: the audio-only engine composes no EME. Mux encrypts
 * video renditions and leaves audio clear, so a protected playback ID still plays here.
 *
 * `contentData` is kept rather than dropped, for the same reason its hls.js counterpart has it: a playback ID played as
 * audio is usually a _video_ asset, whose poster and storyboard exist and which an audio skin may well want. The
 * element ignores it either way. Mux publishes neither for a genuinely audio-only asset, so those URLs 404 — see the
 * known shortcoming on the video flavor, which shares the derivation.
 *
 * Like the video flavor, it hands a source to the browser's own HLS support when SPF can't play it: on a browser
 * without Media Source Extensions (iPhone Safari before iOS 17.1), for a source that isn't HLS (a static audio
 * rendition), or when `source.preferPlayback` is `'native'`.
 *
 * An audio-only playback ID packaged as MPEG-TS plays: the flavor transmuxes it with the audio-only feature (no H.264
 * framing bundled; see `@videojs/spf/adapters/hls-audio-mpeg-ts`). A plus-tier _video_ asset plays too: Mux muxes its
 * audio into the video segments, so this fetches the lowest-bandwidth variant's segments and keeps only their AAC.
 */
export class MuxAudioAdapter extends MuxMixin<typeof SpfAudioAdapter, MuxSource>(SpfAudioAdapter) {
  static override readonly defaultProps: Omit<SpfPlaybackProps, 'src' | 'source'> & MuxAudioAdapterProps = {
    ...SpfAudioAdapter.defaultProps,
    src: '',
    source: null,
  };
}
