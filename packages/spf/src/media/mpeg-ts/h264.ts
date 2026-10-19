/**
 * H.264 Annex B elementary-stream parsing for the TS transmux path: splits each PES payload into NAL units, groups them
 * into access units (one `VideoSample` per picture, keyed on the access-unit delimiter the packager emits), and reads
 * the SPS for the `avcC` / `avc1` sample entry (profile, level, coded size).
 *
 * Targets spec-valid HLS content: AUD-delimited access units, in-band SPS/PPS, IDR at segment start.
 */
import { concatPes, type PesPacket } from './demux';

/** One access unit in decode order. `units` are raw NAL units (no start codes); `size` is their length-prefixed total. */
export interface VideoSample {
  pts: number;
  dts: number;
  key: boolean;
  units: Uint8Array[];
  size: number;
}

/** What the sample entry needs from the stream's parameter sets. */
export interface AvcConfig {
  sps: Uint8Array;
  pps: Uint8Array;
  width: number;
  height: number;
  /** RFC 6381 string, e.g. `avc1.640020`. */
  codec: string;
}

/** The parsed stream: samples in decode order, and the config once an SPS and PPS have been seen. */
export interface ParsedAvcStream {
  samples: VideoSample[];
  config?: AvcConfig;
}

/** Coded picture size, in luma pixels after cropping. */
export interface PictureSize {
  width: number;
  height: number;
}

const NAL_IDR = 5;
const NAL_SPS = 7;
const NAL_PPS = 8;
const NAL_AUD = 9;

/** `[start, end)` byte ranges of the NAL units in an Annex B stream (start codes excluded). */
export function findNalUnits(data: Uint8Array): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let unitStart = -1;

  const close = (end: number) => {
    // A NAL unit never ends in 0x00 (RBSP stop bit), so zeros before a start code belong to it.
    while (end > unitStart && data[end - 1] === 0) end--;

    ranges.push([unitStart, end]);
  };

  for (let i = 0; i + 2 < data.length;) {
    if (data[i] !== 0 || data[i + 1] !== 0 || data[i + 2] !== 1) {
      i++;
      continue;
    }

    if (unitStart >= 0) close(i);

    i += 3;
    unitStart = i;
  }

  if (unitStart >= 0 && unitStart < data.length) close(data.length);

  return ranges;
}

/** Split an Annex B byte stream into NAL units (no start codes). */
export function splitNalUnits(data: Uint8Array): Uint8Array[] {
  return findNalUnits(data).map(([start, end]) => data.subarray(start, end));
}

/**
 * Group a stream's PES payloads into access units. The payloads are walked as one continuous Annex B stream — PES
 * boundaries need not fall on picture boundaries — and a new sample opens on each access-unit delimiter, timed by the
 * PES in which that delimiter begins. Parameter sets are copied out for the config and also kept in-band in the sample,
 * as decoders accept.
 */
export function parseAvcAccessUnits(packets: PesPacket[]): ParsedAvcStream {
  const { data, boundaries } = concatPes(packets);
  const samples: VideoSample[] = [];
  let current: VideoSample | undefined;
  let sps: Uint8Array | undefined;
  let pps: Uint8Array | undefined;
  let pesIndex = 0;

  /** The PES whose payload holds `position` — boundaries ascend, as do NAL positions, so this only moves forward. */
  const pesAt = (position: number) => {
    while (pesIndex + 1 < boundaries.length && boundaries[pesIndex + 1]!.offset <= position) pesIndex++;

    return boundaries[pesIndex]!;
  };

  const close = () => {
    if (current?.units.length) samples.push(current);

    current = undefined;
  };

  for (const [start, end] of findNalUnits(data)) {
    const unit = data.subarray(start, end);
    const type = unit[0]! & 0x1f;

    if (type === NAL_AUD) close();

    if (type === NAL_SPS) sps = unit;

    if (type === NAL_PPS) pps = unit;

    if (current === undefined) {
      // A PES without timestamps continues the previous picture's timing.
      const { pts, dts } = pesAt(start);
      const previous = samples[samples.length - 1];

      current = { pts: pts ?? previous?.pts ?? 0, dts: dts ?? previous?.dts ?? 0, key: false, units: [], size: 0 };
    }

    if (type === NAL_IDR) current.key = true;

    current.units.push(unit);
    current.size += 4 + unit.length;
  }

  close();

  if (!sps || !pps) return { samples };

  const { width, height } = parseSps(sps);
  const codec = `avc1.${[sps[1]!, sps[2]!, sps[3]!].map((b) => b.toString(16).padStart(2, '0')).join('')}`;

  return { samples, config: { sps, pps, width, height, codec } };
}

// ============================================================================
// SPS
// ============================================================================

/** Strip emulation-prevention bytes (`00 00 03` → `00 00`) to recover the RBSP. */
function toRbsp(nal: Uint8Array): Uint8Array {
  const out: number[] = [];

  for (let i = 0, zeros = 0; i < nal.length; i++) {
    const byte = nal[i]!;

    if (zeros === 2 && byte === 3) {
      zeros = 0;
      continue;
    }

    out.push(byte);
    zeros = byte === 0 ? zeros + 1 : 0;
  }

  return Uint8Array.from(out);
}

/** MSB-first bit reader with the Exp-Golomb codes SPS parsing needs. */
class BitReader {
  private position = 0;

  constructor(private readonly data: Uint8Array) {}

  readBits(count: number): number {
    let value = 0;

    for (let i = 0; i < count; i++, this.position++) {
      value = value * 2 + ((this.data[this.position >> 3]! >> (7 - (this.position & 7))) & 1);
    }

    return value;
  }

  readUe(): number {
    let zeros = 0;

    while (this.readBits(1) === 0 && zeros < 32) zeros++;

    return zeros === 0 ? 0 : 2 ** zeros - 1 + this.readBits(zeros);
  }

  readSe(): number {
    const value = this.readUe();

    return value & 1 ? (value + 1) / 2 : -value / 2;
  }
}

const HIGH_PROFILES = new Set([100, 110, 122, 244, 44, 83, 86, 118, 128, 138, 139, 134, 135]);

function skipScalingList(reader: BitReader, size: number): void {
  let lastScale = 8;
  let nextScale = 8;

  for (let i = 0; i < size; i++) {
    if (nextScale !== 0) nextScale = (lastScale + reader.readSe() + 256) % 256;

    lastScale = nextScale === 0 ? lastScale : nextScale;
  }
}

/** Coded picture size from a sequence parameter set (ITU-T H.264 §7.3.2.1.1), 4:2:0 crop units. */
export function parseSps(nal: Uint8Array): PictureSize {
  const reader = new BitReader(toRbsp(nal.subarray(1)));
  const profileIdc = reader.readBits(8);

  reader.readBits(16); // constraint flags + level_idc
  reader.readUe(); // seq_parameter_set_id

  let chromaFormatIdc = 1;

  if (HIGH_PROFILES.has(profileIdc)) {
    chromaFormatIdc = reader.readUe();

    if (chromaFormatIdc === 3) reader.readBits(1); // separate_colour_plane_flag

    reader.readUe(); // bit_depth_luma_minus8
    reader.readUe(); // bit_depth_chroma_minus8
    reader.readBits(1); // qpprime_y_zero_transform_bypass_flag

    if (reader.readBits(1)) {
      // seq_scaling_matrix_present_flag
      for (let i = 0; i < (chromaFormatIdc !== 3 ? 8 : 12); i++) {
        if (reader.readBits(1)) skipScalingList(reader, i < 6 ? 16 : 64);
      }
    }
  }

  reader.readUe(); // log2_max_frame_num_minus4

  const picOrderCntType = reader.readUe();

  if (picOrderCntType === 0) {
    reader.readUe(); // log2_max_pic_order_cnt_lsb_minus4
  } else if (picOrderCntType === 1) {
    reader.readBits(1); // delta_pic_order_always_zero_flag
    reader.readSe(); // offset_for_non_ref_pic
    reader.readSe(); // offset_for_top_to_bottom_field

    const cycleLength = reader.readUe();

    for (let i = 0; i < cycleLength; i++) reader.readSe(); // offset_for_ref_frame[i]
  }

  reader.readUe(); // max_num_ref_frames
  reader.readBits(1); // gaps_in_frame_num_value_allowed_flag

  const picWidthInMbs = reader.readUe() + 1;
  const picHeightInMapUnits = reader.readUe() + 1;
  const frameMbsOnly = reader.readBits(1);

  if (!frameMbsOnly) reader.readBits(1); // mb_adaptive_frame_field_flag

  reader.readBits(1); // direct_8x8_inference_flag

  let cropLeft = 0;
  let cropRight = 0;
  let cropTop = 0;
  let cropBottom = 0;

  if (reader.readBits(1)) {
    // frame_cropping_flag
    cropLeft = reader.readUe();
    cropRight = reader.readUe();
    cropTop = reader.readUe();
    cropBottom = reader.readUe();
  }

  return {
    width: picWidthInMbs * 16 - (cropLeft + cropRight) * 2,
    height: (2 - frameMbsOnly) * picHeightInMapUnits * 16 - (frameMbsOnly ? 2 : 4) * (cropTop + cropBottom),
  };
}
