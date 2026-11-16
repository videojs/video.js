import { CustomMediaElement } from '@videojs/media/dom';
import { MuxAudioAdapter } from '@videojs/mux-audio/hls-js';

import { MediaAttachMixin } from '../../store/media-attach-mixin';
import { MuxAudioMixin } from './mixin';

const MuxAudioBase = MuxAudioMixin(MediaAttachMixin(CustomMediaElement('audio', MuxAudioAdapter)));

/**
 * `<mux-audio>` over the hls.js-backed Mux Media instead of the default SPF-backed one.
 *
 * Shares its name with the flavor in `./spf` on purpose: the import path picks the engine, and nothing else about the
 * surface moves. Deliberately not exported from this directory's barrel, which is the SPF flavor, so importing the
 * default never pulls hls.js in with it.
 */
export class MuxAudio extends MuxAudioBase {}
