/**
 * ADTS AAC elementary-stream parsing for the TS transmux path: walks the ADTS frames across a stream's PES payloads,
 * strips each 7/9-byte header to the raw AAC frame MP4 carries, and derives the `AudioSpecificConfig` for `esds`.
 *
 * Frame timing re-anchors on each PES that opens on a frame boundary (its PTS); frames that follow inside the same PES
 * advance by one AAC frame (1024 samples) each.
 */
import { concatPes, type PesPacket } from './demux';

/** One raw AAC frame (ADTS header removed), in 90 kHz PTS. */
export interface AudioSample {
  pts: number;
  data: Uint8Array;
}

/** What the `mp4a` sample entry needs. */
export interface AacConfig {
  sampleRate: number;
  channels: number;
  /** 2-byte `AudioSpecificConfig` (object type, sampling index, channel configuration). */
  audioSpecificConfig: Uint8Array;
  /** RFC 6381 string, e.g. `mp4a.40.2`. */
  codec: string;
}

const SAMPLE_RATES = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];

/** The parsed stream: frames in order, and the config once a frame header has been read. */
export interface ParsedAacStream {
  samples: AudioSample[];
  config?: AacConfig;
}

export const AAC_SAMPLES_PER_FRAME = 1024;
const MPEG_TS_TIMESCALE = 90000;

function isSyncWord(data: Uint8Array, offset: number): boolean {
  return data[offset] === 0xff && (data[offset + 1]! & 0xf6) === 0xf0;
}

function readConfig(data: Uint8Array, offset: number): AacConfig {
  const objectType = ((data[offset + 2]! >> 6) & 3) + 1;
  const samplingIndex = (data[offset + 2]! >> 2) & 0xf;
  const channels = ((data[offset + 2]! & 1) << 2) | ((data[offset + 3]! >> 6) & 3);

  return {
    sampleRate: SAMPLE_RATES[samplingIndex] ?? 48000,
    channels,
    audioSpecificConfig: Uint8Array.from([
      (objectType << 3) | (samplingIndex >> 1),
      ((samplingIndex & 1) << 7) | (channels << 3),
    ]),
    codec: `mp4a.40.${objectType}`,
  };
}

/** Split a stream's PES payloads into raw AAC frames with PTS. A frame cut off by the segment end is dropped. */
export function parseAdtsFrames(packets: PesPacket[]): ParsedAacStream {
  const { data, boundaries } = concatPes(packets);
  const ptsAtOffset = new Map(boundaries.filter((b) => b.pts !== undefined).map((b) => [b.offset, b.pts!]));

  const samples: AudioSample[] = [];
  let config: AacConfig | undefined;
  let pts = 0;
  let frameDuration = 0;

  for (let offset = 0; offset + 7 <= data.length;) {
    if (!isSyncWord(data, offset)) {
      offset++;
      continue;
    }

    const headerLength = data[offset + 1]! & 1 ? 7 : 9;
    const frameLength = ((data[offset + 3]! & 3) << 11) | (data[offset + 4]! << 3) | (data[offset + 5]! >> 5);
    if (frameLength < headerLength || offset + frameLength > data.length) break;

    if (!config) {
      config = readConfig(data, offset);
      frameDuration = (AAC_SAMPLES_PER_FRAME * MPEG_TS_TIMESCALE) / config.sampleRate;
    }

    pts = ptsAtOffset.get(offset) ?? pts + frameDuration;
    samples.push({ pts, data: data.subarray(offset + headerLength, offset + frameLength) });
    offset += frameLength;
  }

  return config ? { samples, config } : { samples };
}
