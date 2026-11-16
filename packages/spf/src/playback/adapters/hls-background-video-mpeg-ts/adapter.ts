import { createEngine } from '../../engines/hls-background-video-mpeg-ts';
import { type CreateEngine, HlsBackgroundVideoAdapter } from '../hls-background-video';

/**
 * `HlsBackgroundVideoAdapter` over the MPEG-TS background-video engine. Its surface is the base's; only the engine
 * differs.
 */
export class HlsBackgroundVideoMpegTsAdapter extends HlsBackgroundVideoAdapter {
  /** Names this engine to analytics such as Mux Data, apart from the container-neutral `spf-hls-background-video`. */
  static readonly engineName: string = 'spf-hls-background-video-mpeg-ts';

  static override readonly createEngine: CreateEngine = createEngine;
}
