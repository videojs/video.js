/**
 * MPEG-TS → fMP4 transmuxer: demux a complete TS segment, frame each carried codec's elementary stream, and write the
 * frames back as fMP4 fragments the MSE pipeline already handles. Composed from codec modules (`codecs/`), so a
 * composition bundles only the codecs it carries. Stateful per SourceBuffer: it numbers fragments and keeps each
 * codec's last sample entry, so a segment missing one track's data still describes every track. It builds an init
 * segment whenever the sample entries differ from the ones the caller last delivered (first segment, rendition switch).
 * The caller tracks delivery because only it knows whether the append carrying an init completed.
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
  /** The `initKey` of the init segment the SourceBuffer last received. A segment whose key differs gets an `init`. */
  deliveredInitKey?: string | undefined;
}

/** Per-track output facts the loader pipeline records (the init-segment half of `MediaContainerData`). */
export interface TransmuxedTrack {
  trackId: number;
  timescale: number;
  /** First sample's DTS in track ticks — what the fragment's `tfdt` carries. */
  baseMediaDecodeTime: number;
}

export interface TransmuxResult {
  /** `ftyp` + `moov`, present when the sample entries differ from `deliveredInitKey`'s. */
  init?: Uint8Array;
  /** Identifies the sample entries the fragments use. Pass it back as `deliveredInitKey` once `init` is appended. */
  initKey?: string;
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
  // The last sample entry each codec wrote. MSE rejects a later init segment whose track count differs from the first,
  // so a codec with no data in a segment keeps its place in the init rather than dropping out of it.
  const configs = new Map<string, TrackConfig>();

  return (segment, { codecs: carried = codecs, deliveredInitKey, ...options } = {}) => {
    const streams = demuxTransportStream(segment, new Set(carried.map((codec) => codec.streamType)));
    const fragments: Uint8Array[] = [];
    const result: TransmuxResult = { data: new Uint8Array(0), tracks: {} };

    for (const codec of carried) {
      const stream = streams.get(codec.streamType);
      const framed = stream && codec.frame(stream.packets, options);
      if (!framed) continue;

      const { track, baseMediaDecodeTime, samples, payload } = framed;

      configs.set(codec.family, track);
      fragments.push(buildMediaFragment(track.id, ++sequenceNumber, baseMediaDecodeTime, samples, payload));
      result.tracks[codec.family] = { trackId: track.id, timescale: track.timescale, baseMediaDecodeTime };
    }

    // The init segment is keyed on the sample entries (parameter sets, AAC config, dimensions):
    // a rendition switch changes the SPS → a fresh init precedes the first fragment of the new
    // rendition, as a native fMP4 switch would append.
    const tracks = carried.flatMap((codec) => configs.get(codec.family) ?? []);
    const initKey = tracks.map((track) => `${track.id}:${track.sampleEntry.join()}`).join('|');

    if (tracks.length) {
      result.initKey = initKey;

      if (initKey !== deliveredInitKey) result.init = buildInitSegment(tracks);
    }

    result.data = concat(fragments);
    return result;
  };
}
