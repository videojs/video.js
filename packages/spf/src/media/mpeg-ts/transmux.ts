/**
 * MPEG-TS → fMP4 transmuxer: demux a complete TS segment, frame its H.264 access units and AAC frames, and write them
 * back as fMP4 fragments the MSE pipeline already handles. Stateful per track type: it numbers fragments and emits an
 * init segment whenever the codec configuration it last wrote changes (first segment, rendition switch).
 *
 * Timestamps stay native (first DTS in `tfdt`, 90 kHz for video, sample-rate ticks for audio) — relocation onto the
 * presentation timeline is the existing `timestampOffset` machinery's job, exactly as for native fMP4.
 */
import { buildInitSegment, buildMediaFragment, type FragmentSample, type TrackConfig } from '../mp4/mux';
import { AAC_SAMPLES_PER_FRAME, parseAdtsFrames } from './adts';
import { demuxTransportStream } from './demux';
import { parseAvcAccessUnits, parseSps } from './h264';

export const VIDEO_TRACK_ID = 1;
export const AUDIO_TRACK_ID = 2;
const MPEG_TS_TIMESCALE = 90000;

export interface TransmuxOptions {
  /** Carry the video elementary stream (default `true`). A video-only SourceBuffer drops a muxed audio stream. */
  video?: boolean;
  /** Carry the audio elementary stream (default `true`). */
  audio?: boolean;
  /** Coded picture size for the `avc1` entry when known from the manifest (`RESOLUTION`); otherwise read from the SPS. */
  resolution?: { width: number; height: number };
}

/** Per-track output facts the loader pipeline records (the init-segment half of `MediaContainerData`). */
export interface TransmuxedTrack {
  trackId: number;
  timescale: number;
  /** First sample's DTS in track ticks — what the fragment's `tfdt` carries. */
  baseMediaDecodeTime: number;
}

export interface TransmuxResult {
  /** `ftyp` + `moov`, present when the codec configuration is new to this transmuxer. */
  init?: Uint8Array;
  /** The segment's fragments (`moof` + `mdat` per carried track). */
  data: Uint8Array;
  video?: TransmuxedTrack;
  audio?: TransmuxedTrack;
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

/** A transmuxer for one SourceBuffer's stream of segments. */
export function createTransmuxer(): Transmux {
  let sequenceNumber = 0;
  let lastConfigKey: string | undefined;

  return (segment, { video = true, audio = true, resolution } = {}) => {
    const streams = demuxTransportStream(segment);
    const avc = video && streams.video ? parseAvcAccessUnits(streams.video.packets) : undefined;
    const aac = audio && streams.audio ? parseAdtsFrames(streams.audio.packets) : undefined;

    const tracks: TrackConfig[] = [];
    const fragments: Uint8Array[] = [];
    const result: TransmuxResult = { data: new Uint8Array(0) };

    if (avc?.config && avc.samples.length) {
      const { sps, pps } = avc.config;
      const { width, height } = resolution ?? parseSps(sps);

      tracks.push({ type: 'video', id: VIDEO_TRACK_ID, timescale: MPEG_TS_TIMESCALE, width, height, sps, pps });

      // Durations are DTS deltas; the last sample reuses the one before it (or the
      // average for a single-sample fragment). Composition offset is pts − dts.
      const { samples } = avc;
      const rows: FragmentSample[] = samples.map((sample, i) => {
        const next = samples[i + 1];
        const previous = samples[i - 1];
        const duration = next ? next.dts - sample.dts : previous ? sample.dts - previous.dts : MPEG_TS_TIMESCALE / 30;

        return { duration, size: sample.size, key: sample.key, cts: sample.pts - sample.dts };
      });
      const payload = new Uint8Array(rows.reduce((n, r) => n + r.size, 0));
      const view = new DataView(payload.buffer);
      let offset = 0;

      for (const sample of samples) {
        for (const unit of sample.units) {
          view.setUint32(offset, unit.length);
          payload.set(unit, offset + 4);
          offset += 4 + unit.length;
        }
      }

      const baseMediaDecodeTime = samples[0]!.dts;

      fragments.push(buildMediaFragment(VIDEO_TRACK_ID, ++sequenceNumber, baseMediaDecodeTime, rows, payload));
      result.video = { trackId: VIDEO_TRACK_ID, timescale: MPEG_TS_TIMESCALE, baseMediaDecodeTime };
    }

    if (aac?.config && aac.samples.length) {
      const { sampleRate, channels, audioSpecificConfig } = aac.config;

      tracks.push({ type: 'audio', id: AUDIO_TRACK_ID, timescale: sampleRate, channels, audioSpecificConfig });

      const rows: FragmentSample[] = aac.samples.map((sample) => ({
        duration: AAC_SAMPLES_PER_FRAME,
        size: sample.data.length,
        key: true,
        cts: 0,
      }));
      const baseMediaDecodeTime = Math.round((aac.samples[0]!.pts * sampleRate) / MPEG_TS_TIMESCALE);

      fragments.push(
        buildMediaFragment(
          AUDIO_TRACK_ID,
          ++sequenceNumber,
          baseMediaDecodeTime,
          rows,
          concat(aac.samples.map((s) => s.data))
        )
      );
      result.audio = { trackId: AUDIO_TRACK_ID, timescale: sampleRate, baseMediaDecodeTime };
    }

    // The init segment is keyed on everything the `moov` encodes: parameter sets, AAC
    // config, track layout. A rendition switch changes the SPS → a fresh init precedes
    // the first fragment of the new rendition, as a native fMP4 switch would append.
    const configKey = tracks
      .map((t) =>
        t.type === 'video'
          ? `v${t.width}x${t.height}:${t.sps.join()}:${t.pps.join()}`
          : `a${t.timescale}:${t.audioSpecificConfig.join()}`
      )
      .join('|');

    if (tracks.length && configKey !== lastConfigKey) {
      result.init = buildInitSegment(tracks);
      lastConfigKey = configKey;
    }

    result.data = concat(fragments);
    return result;
  };
}
