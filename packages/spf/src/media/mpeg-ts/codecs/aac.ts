/** AAC in MPEG-TS: ADTS frames stripped to raw AAC `mp4a` samples, timescale = sample rate so each frame is 1024 ticks. */
import { box, fullBox, type TrackConfig, u16, u32, zeros } from '../../mp4/mux';
import { AAC_SAMPLES_PER_FRAME, parseAdtsFrames } from '../adts';
import type { FramedStream, TransmuxCodec } from './codec';

export const AAC_TRACK_ID = 2;
const MPEG_TS_TIMESCALE = 90000;

function mp4a(sampleRate: number, channels: number, asc: Uint8Array): Uint8Array {
  const esds = fullBox(
    'esds',
    0,
    0,
    Uint8Array.from([
      0x03,
      23 + asc.length,
      0x00,
      0x01,
      0x00, // ES_Descriptor: ES_ID 1, no flags
      0x04,
      15 + asc.length,
      0x40 /* MPEG-4 audio */,
      0x15 /* audio stream */,
      0x00,
      0x00,
      0x00, // DecoderConfig
      0x00,
      0x00,
      0x00,
      0x00, // maxBitrate
      0x00,
      0x00,
      0x00,
      0x00, // avgBitrate
      0x05,
      asc.length, // DecoderSpecificInfo
    ]),
    asc,
    Uint8Array.from([0x06, 0x01, 0x02]) // SLConfigDescriptor
  );

  return box(
    'mp4a',
    zeros(6), // reserved
    u16(1), // data_reference_index
    zeros(8), // reserved
    u16(channels),
    u16(16), // samplesize
    zeros(4), // pre_defined, reserved
    u32(sampleRate << 16), // samplerate (16.16)
    esds
  );
}

export const aacCodec: TransmuxCodec = {
  streamType: 0x0f,
  family: 'mp4a',
  frame(packets): FramedStream | undefined {
    const { samples, config } = parseAdtsFrames(packets);
    if (!config || samples.length === 0) return undefined;

    const { sampleRate, channels, audioSpecificConfig } = config;
    const track: TrackConfig = {
      id: AAC_TRACK_ID,
      handler: 'soun',
      timescale: sampleRate,
      sampleEntry: mp4a(sampleRate, channels, audioSpecificConfig),
    };
    const payload = new Uint8Array(samples.reduce((n, s) => n + s.data.length, 0));
    let offset = 0;

    for (const sample of samples) {
      payload.set(sample.data, offset);
      offset += sample.data.length;
    }

    return {
      track,
      baseMediaDecodeTime: Math.round((samples[0]!.pts * sampleRate) / MPEG_TS_TIMESCALE),
      samples: samples.map((sample) => ({
        duration: AAC_SAMPLES_PER_FRAME,
        size: sample.data.length,
        key: true,
        cts: 0,
      })),
      payload,
    };
  },
};
