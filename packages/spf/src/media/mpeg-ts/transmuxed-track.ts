import { MPEG_TS_MIME } from '../hls/parse-media-playlist';
import { buildMimeCodec } from '../utils/tracks';

/** A TS rendition as the fMP4 it becomes: the container MIME the transmuxer outputs for the track's type. */
export function asTransmuxed<T extends { mimeType?: string; type?: string }>(track: T): T {
  if (track.mimeType !== MPEG_TS_MIME) return track;

  return { ...track, mimeType: track.type === 'audio' ? 'audio/mp4' : 'video/mp4' };
}

/** The fMP4 MIME codec string the SourceBuffer receives for a (possibly TS) track. */
export function transmuxedSourceBufferMimeCodec(track: { mimeType: string; codecs?: string[]; type?: string }): string {
  return buildMimeCodec(asTransmuxed(track));
}
