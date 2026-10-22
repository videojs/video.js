/**
 * H.264 in MPEG-TS: AUD-delimited access units framed into `avc1` samples, 90 kHz timescale, in-band SPS/PPS copied to
 * `avcC`.
 */
import { box, type FragmentSample, type TrackConfig, u16, u32, zeros } from '../../mp4/mux';
import { parseAvcAccessUnits, parseSps, type VideoSample } from '../h264';
import type { FramedStream, TransmuxCodec } from './codec';

export const AVC_TRACK_ID = 1;
const MPEG_TS_TIMESCALE = 90000;

function avc1(sps: Uint8Array, pps: Uint8Array, width: number, height: number): Uint8Array {
  const avcC = box(
    'avcC',
    Uint8Array.from([1, sps[1]!, sps[2]!, sps[3]!, 0xff /* 4-byte NAL lengths */, 0xe1 /* 1 SPS */]),
    u16(sps.length),
    sps,
    Uint8Array.from([1]), // 1 PPS
    u16(pps.length),
    pps
  );

  return box(
    'avc1',
    zeros(6), // reserved
    u16(1), // data_reference_index
    zeros(16), // pre_defined, reserved, pre_defined
    u16(width),
    u16(height),
    u32(0x00480000), // horizresolution 72 dpi
    u32(0x00480000), // vertresolution
    zeros(4), // reserved
    u16(1), // frame_count
    zeros(32), // compressorname
    u16(0x0018), // depth
    u16(0xffff), // pre_defined = -1
    avcC
  );
}

/** Durations are DTS deltas; the last sample reuses the one before it. Composition offset is `pts − dts`. */
function toFragmentSamples(samples: VideoSample[]): FragmentSample[] {
  return samples.map((sample, i) => {
    const next = samples[i + 1];
    const previous = samples[i - 1];
    const duration = next ? next.dts - sample.dts : previous ? sample.dts - previous.dts : MPEG_TS_TIMESCALE / 30;

    return { duration, size: sample.size, key: sample.key, cts: sample.pts - sample.dts };
  });
}

/** Length-prefixed NAL units, as `avc1` samples carry them. */
function toPayload(samples: VideoSample[]): Uint8Array {
  const payload = new Uint8Array(samples.reduce((n, s) => n + s.size, 0));
  const view = new DataView(payload.buffer);
  let offset = 0;

  for (const sample of samples) {
    for (const unit of sample.units) {
      view.setUint32(offset, unit.length);
      payload.set(unit, offset + 4);
      offset += 4 + unit.length;
    }
  }

  return payload;
}

export const avcCodec: TransmuxCodec = {
  streamType: 0x1b,
  family: 'avc1',
  frame(packets, { resolution }): FramedStream | undefined {
    const { samples, config } = parseAvcAccessUnits(packets);
    if (!config || samples.length === 0) return undefined;

    const { width, height } = resolution ?? parseSps(config.sps);
    const track: TrackConfig = {
      id: AVC_TRACK_ID,
      handler: 'vide',
      timescale: MPEG_TS_TIMESCALE,
      width,
      height,
      sampleEntry: avc1(config.sps, config.pps, width, height),
    };

    return {
      track,
      baseMediaDecodeTime: samples[0]!.dts,
      samples: toFragmentSamples(samples),
      payload: toPayload(samples),
    };
  },
};
