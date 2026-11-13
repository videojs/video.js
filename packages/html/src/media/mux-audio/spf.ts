import { CustomMediaElement } from '@videojs/media/dom';
import { MuxAudioAdapter } from '@videojs/mux-audio/spf';

import { MediaAttachMixin } from '../../store/media-attach-mixin';
import { MuxAudioMixin } from './mixin';

const MuxAudioBase = MuxAudioMixin(MediaAttachMixin(CustomMediaElement('audio', MuxAudioAdapter)));

/**
 * `<mux-audio>` over the SPF audio-only Mux Media — the default flavor, and what this directory's barrel exports.
 *
 * Shares its name with the hls.js-backed flavor in `./hls-js` on purpose: the import path picks the engine, and nothing
 * else about the surface moves. That one stays out of the barrel, so importing one flavor never pulls the other's
 * engine in with it.
 *
 * The engine underneath is the subtractive audio-only one, so only the audio renditions of the playback ID are fetched
 * — unlike the hls.js-backed flavor, which runs the full engine and downloads video renditions it never plays.
 */
export class MuxAudio extends MuxAudioBase {}
