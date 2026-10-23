import { createEngine } from '../../engines/hls-background-video-mpeg-ts';
import { type CreateEngine, HlsBackgroundVideoAdapter } from '../hls-background-video';

/**
 * `HlsBackgroundVideoAdapter` over the MPEG-TS background-video engine. Its surface is the base's; only the engine
 * differs.
 */
export class HlsBackgroundVideoMpegTsAdapter extends HlsBackgroundVideoAdapter {
  static override readonly createEngine: CreateEngine = createEngine;
}
