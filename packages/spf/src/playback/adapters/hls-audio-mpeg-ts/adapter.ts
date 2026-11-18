import { createEngine } from '../../engines/hls-audio-mpeg-ts';
import { type CreateEngine, HlsAudioAdapter } from '../hls-audio';

/** `HlsAudioAdapter` over the MPEG-TS audio-only HLS engine. Its surface is the base's; only the engine differs. */
export class HlsAudioMpegTsAdapter extends HlsAudioAdapter {
  /** Names this engine to analytics such as Mux Data, apart from the container-neutral `spf-hls-audio`. */
  static readonly engineName: string = 'spf-hls-audio-mpeg-ts';

  static override readonly createEngine: CreateEngine = createEngine;
}
