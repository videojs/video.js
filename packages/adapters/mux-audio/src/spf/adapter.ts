// Only the mixin is used from `@videojs/mux-video/spf`. Its `MuxVideoAdapter` (and the full HLS engine behind it) is
// left for the consumer's bundler to drop, which `sideEffects: false` on that package allows, so this entry stays
// audio-only.
import { type MuxAdapterProps, MuxMixin } from '@videojs/mux-video/spf';
import { type CreateEngine, HlsAudioAdapter, type HlsAudioAdapterProps } from '@videojs/spf/adapters/hls-audio';
import { createEngine } from '@videojs/spf/engines/hls-audio-mpeg-ts';

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
 * An audio-only playback ID packaged as MPEG-TS plays: the flavor transmuxes it with the audio-only feature (no H.264
 * framing bundled; see `@videojs/spf/engines/hls-audio-mpeg-ts`). A plus-tier _video_ asset still surfaces no playback
 * here, since Mux muxes its audio into the video segments and declares no audio rendition for this engine to select.
 */
export class MuxAudioAdapter extends MuxMixin(HlsAudioAdapter) {
  static override readonly defaultProps: Omit<HlsAudioAdapterProps, 'src' | 'source'> & MuxAdapterProps = {
    ...HlsAudioAdapter.defaultProps,
    src: '',
    source: null,
  };

  static override readonly createEngine: CreateEngine = createEngine;
}
