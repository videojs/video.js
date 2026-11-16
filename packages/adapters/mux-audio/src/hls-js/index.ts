/**
 * The Mux audio Media over hls.js — the explicit engine choice. The default at `@videojs/mux-audio` is the SPF-backed
 * audio-only Media; see `@videojs/mux-video/hls-js` for what this flavor covers that the default does not.
 */
import { MuxVideoAdapter } from '@videojs/mux-video/hls-js';

export type { MuxSource, MuxVideoAdapterProps as MuxAudioAdapterProps } from '@videojs/mux-video/hls-js';

// TODO(mux): audio extending video is upside down. The hls.js-backed Mux behavior should move to a shared base that a
// video and an audio adapter both extend; until then this class exists so audio installs by the media it plays and has
// a home for audio-only behavior.
export class MuxAudioAdapter extends MuxVideoAdapter {}
