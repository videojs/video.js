/**
 * The per-codec half of the transmuxer: one module per elementary-stream codec, each knowing how to frame its PES
 * payloads into samples and how to describe itself to MP4 (the sample entry). The transmuxer composes a list of these,
 * so a composition carries only the codecs it needs — an audio-only one never bundles the H.264 framing.
 */
import type { FragmentSample, TrackConfig } from '../../mp4/mux';
import type { PesPacket } from '../demux';

export interface TransmuxCodecOptions {
  /** Coded picture size when known from the manifest (`RESOLUTION`); a video codec may read it from the SPS otherwise. */
  resolution?: { width: number; height: number };
}

/** A framed elementary stream, ready to write as one track of the init segment and one fragment. */
export interface FramedStream {
  track: TrackConfig;
  /** First sample's DTS in track ticks — what the fragment's `tfdt` carries. */
  baseMediaDecodeTime: number;
  samples: FragmentSample[];
  /** The concatenated sample bytes for the `mdat`. */
  payload: Uint8Array;
}

export interface TransmuxCodec {
  /** PMT `stream_type` this codec frames. */
  streamType: number;
  /** RFC 6381 codec family (`avc1`, `mp4a`) matched against a track's declared `CODECS`. */
  family: string;
  /** Frame a stream's PES packets, or `undefined` when nothing usable was found (no parameter sets, no frames). */
  frame(packets: PesPacket[], options: TransmuxCodecOptions): FramedStream | undefined;
}
