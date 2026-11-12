import { createEngine } from '../../engines/hls-video-mpeg-ts';
import { type CreateEngine, HlsVideoAdapter } from '../hls-video';

/** `HlsVideoAdapter` over the MPEG-TS HLS engine. Its surface is the base's; only the engine differs. */
export class HlsVideoMpegTsAdapter extends HlsVideoAdapter {
  /** Names this engine to analytics such as Mux Data, apart from the container-neutral `spf-hls-video`. */
  static readonly engineName: string = 'spf-hls-video-mpeg-ts';

  static override readonly createEngine: CreateEngine = createEngine;
}
