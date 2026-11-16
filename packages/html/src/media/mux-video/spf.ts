import { CustomMediaElement } from '@videojs/media/dom';
import { MuxVideoAdapter } from '@videojs/mux-video/spf';

import { MediaAttachMixin } from '../../store/media-attach-mixin';
import { MuxVideoMixin } from './mixin';

const MuxVideoBase = MuxVideoMixin(MediaAttachMixin(CustomMediaElement('video', MuxVideoAdapter)));

/**
 * `<mux-video>` over the SPF-backed Mux Media — the default flavor, and what this directory's barrel exports.
 *
 * Shares its name with the hls.js-backed flavor in `./hls-js` on purpose: the import path picks the engine, and nothing
 * else about the surface moves. That one stays out of the barrel, so importing one flavor never pulls the other's
 * engine in with it.
 */
export class MuxVideo extends MuxVideoBase {}
