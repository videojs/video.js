/**
 * MPEG-TS → fMP4 transmuxer: demux a complete TS segment, frame each carried codec's elementary stream, and write the
 * frames back as fMP4 fragments the MSE pipeline already handles. Composed from codec modules (`codecs/`), so a
 * composition bundles only the codecs it carries. Stateful per SourceBuffer: it numbers fragments and emits an init
 * segment whenever the sample entries it last wrote change (first segment, rendition switch).
 *
 * Timestamps stay native (first DTS in `tfdt`, in each track's own timescale) — relocation onto the presentation
 * timeline is the existing `timestampOffset` machinery's job, exactly as for native fMP4.
 */
import { buildInitSegment, buildMediaFragment, type TrackConfig } from '../mp4/mux';
import type { TransmuxCodec, TransmuxCodecOptions } from './codecs/codec';
import { demuxTransportStream } from './demux';

export interface TransmuxOptions extends TransmuxCodecOptions {
  /** The codecs to carry this time, a subset of the transmuxer's; defaults to all of them. */
  codecs?: readonly TransmuxCodec[];
}

/** Per-track output facts the loader pipeline records (the init-segment half of `MediaContainerData`). */
export interface TransmuxedTrack {
  trackId: number;
  timescale: number;
  /** First sample's DTS in track ticks — what the fragment's `tfdt` carries. */
  baseMediaDecodeTime: number;
}

export interface TransmuxResult {
  /** `ftyp` + `moov`, present when the sample entries are new to this transmuxer. */
  init?: Uint8Array;
  /** The segment's fragments (`moof` + `mdat` per carried codec, in codec order). */
  data: Uint8Array;
  /** What was written, by codec family (`avc1`, `mp4a`). */
  tracks: Record<string, TransmuxedTrack>;
}

export type Transmux = (segment: Uint8Array, options?: TransmuxOptions) => TransmuxResult;

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;

  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;
}

/** A transmuxer for one SourceBuffer's stream of segments, carrying the given codecs. */
export function createTransmuxer(codecs: readonly TransmuxCodec[]): Transmux {
  let sequenceNumber = 0;
  let lastInitKey: string | undefined;

  return (segment, { codecs: carried = codecs, ...options } = {}) => {
    const streams = demuxTransportStream(segment, new Set(carried.map((codec) => codec.streamType)));
    const tracks: TrackConfig[] = [];
    const fragments: Uint8Array[] = [];
    const result: TransmuxResult = { data: new Uint8Array(0), tracks: {} };

    for (const codec of carried) {
      const stream = streams.get(codec.streamType);
      const framed = stream && codec.frame(stream.packets, options);
      if (!framed) continue;

      const { track, baseMediaDecodeTime, samples, payload } = framed;

      tracks.push(track);
      fragments.push(buildMediaFragment(track.id, ++sequenceNumber, baseMediaDecodeTime, samples, payload));
      result.tracks[codec.family] = { trackId: track.id, timescale: track.timescale, baseMediaDecodeTime };
    }

    // The init segment is keyed on the sample entries (parameter sets, AAC config, dimensions):
    // a rendition switch changes the SPS → a fresh init precedes the first fragment of the new
    // rendition, as a native fMP4 switch would append.
    const initKey = tracks.map((track) => `${track.id}:${track.sampleEntry.join()}`).join('|');

    if (tracks.length && initKey !== lastInitKey) {
      result.init = buildInitSegment(tracks);
      lastInitKey = initKey;
    }

    result.data = concat(fragments);
    return result;
  };
}
