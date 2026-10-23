import { createEngine } from '../../engines/hls-audio-mpeg-ts';
import { type CreateEngine, HlsAudioAdapter } from '../hls-audio';

/** `HlsAudioAdapter` over the MPEG-TS audio-only HLS engine. Its surface is the base's; only the engine differs. */
export class HlsAudioMpegTsAdapter extends HlsAudioAdapter {
  static override readonly createEngine: CreateEngine = createEngine;
}
