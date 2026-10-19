/**
 * Minimal fragmented-MP4 writer: an init segment (`ftyp` + `moov` + `mvex`, with the sample entries the codec modules
 * build) and per-track media fragments (`moof` + `mdat`). The output half of the TS transmux path — the layouts are the
 * ISO BMFF ones MSE's fMP4 byte-stream format accepts (`default-base-is-moof`, v1 `tfdt`, v1 `trun` with signed
 * composition offsets), nothing more.
 *
 * The reading half (`box.ts`, `timestamp-origin.ts`) reads what this writes, so a transmuxed segment flows through the
 * same relocation steps as a native fMP4 one.
 */

/**
 * One track of the init segment. The codec-specific part is the finished sample entry (`avc1`, `mp4a`, …), built by the
 * codec module that framed the samples; everything else here is container plumbing keyed on the handler type.
 */
export interface TrackConfig {
  id: number;
  handler: 'vide' | 'soun';
  timescale: number;
  /** Coded picture size for a video track; audio leaves both 0. */
  width?: number;
  height?: number;
  /** The complete sample-entry box for the `stsd`. */
  sampleEntry: Uint8Array;
}

/** One `trun` row. `cts` is `pts − dts` in track ticks (signed); `size` is the sample's byte length in the `mdat`. */
export interface FragmentSample {
  duration: number;
  size: number;
  key: boolean;
  cts: number;
}

// ============================================================================
// Byte helpers
// ============================================================================

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;

  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;
}

export function u16(value: number): Uint8Array {
  return Uint8Array.from([(value >> 8) & 0xff, value & 0xff]);
}

export function u32(value: number): Uint8Array {
  return Uint8Array.from([(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff]);
}

function u64(value: number): Uint8Array {
  return concat([u32(Math.floor(value / 2 ** 32)), u32(value % 2 ** 32)]);
}

function fourcc(type: string): Uint8Array {
  return Uint8Array.from(type, (c) => c.charCodeAt(0));
}

export const zeros = (count: number) => new Uint8Array(count);

/** `[u32 size][4cc type][payload…]` */
export function box(type: string, ...payload: Uint8Array[]): Uint8Array {
  const body = concat(payload);
  const out = new Uint8Array(8 + body.length);

  out.set(u32(out.length), 0);
  out.set(fourcc(type), 4);
  out.set(body, 8);
  return out;
}

export function fullBox(type: string, version: number, flags: number, ...payload: Uint8Array[]): Uint8Array {
  return box(type, Uint8Array.from([version, (flags >> 16) & 0xff, (flags >> 8) & 0xff, flags & 0xff]), ...payload);
}

// ============================================================================
// Init segment
// ============================================================================

const UNITY_MATRIX = concat([u32(0x10000), zeros(12), u32(0x10000), zeros(12), u32(0x40000000)]);

function tkhd(track: TrackConfig): Uint8Array {
  const { width = 0, height = 0 } = track;

  return fullBox(
    'tkhd',
    0,
    7,
    zeros(8), // creation_time, modification_time
    u32(track.id),
    zeros(4), // reserved
    zeros(4), // duration (unknown — fragments carry timing)
    zeros(8), // reserved
    zeros(4), // layer, alternate_group
    u16(track.handler === 'soun' ? 0x0100 : 0),
    zeros(2), // reserved
    UNITY_MATRIX,
    u32(width << 16),
    u32(height << 16)
  );
}

function mdhd(timescale: number): Uint8Array {
  return fullBox('mdhd', 0, 0, zeros(8), u32(timescale), zeros(4), u16(0x55c4) /* 'und' */, zeros(2));
}

function hdlr(track: TrackConfig): Uint8Array {
  return fullBox(
    'hdlr',
    0,
    0,
    zeros(4),
    fourcc(track.handler),
    zeros(12),
    fourcc(track.handler === 'vide' ? 'VideoHandler' : 'SoundHandler'),
    zeros(1)
  );
}

const DINF = box('dinf', fullBox('dref', 0, 0, u32(1), fullBox('url ', 0, 1)));
const EMPTY_TABLES = concat([
  fullBox('stts', 0, 0, u32(0)),
  fullBox('stsc', 0, 0, u32(0)),
  fullBox('stsz', 0, 0, u32(0), u32(0)),
  fullBox('stco', 0, 0, u32(0)),
]);

function trak(track: TrackConfig): Uint8Array {
  const mediaHeader = track.handler === 'vide' ? fullBox('vmhd', 0, 1, zeros(8)) : fullBox('smhd', 0, 0, zeros(4));

  return box(
    'trak',
    tkhd(track),
    box(
      'mdia',
      mdhd(track.timescale),
      hdlr(track),
      box('minf', mediaHeader, DINF, box('stbl', fullBox('stsd', 0, 0, u32(1), track.sampleEntry), EMPTY_TABLES))
    )
  );
}

function trex(track: TrackConfig): Uint8Array {
  return fullBox('trex', 0, 0, u32(track.id), u32(1), u32(0), u32(0), u32(0x00010001));
}

const FTYP = box('ftyp', fourcc('isom'), u32(1), fourcc('isom'), fourcc('avc1'));

/** `ftyp` + `moov` for the given tracks. Movie timescale is the first track's; durations are left to the fragments. */
export function buildInitSegment(tracks: TrackConfig[]): Uint8Array {
  const mvhd = fullBox(
    'mvhd',
    0,
    0,
    zeros(8), // creation_time, modification_time
    u32(tracks[0]?.timescale ?? 90000),
    zeros(4), // duration
    u32(0x00010000), // rate 1.0
    u16(0x0100), // volume 1.0
    zeros(10), // reserved
    UNITY_MATRIX,
    zeros(24), // pre_defined
    u32(0xffffffff) // next_track_ID
  );

  return concat([FTYP, box('moov', mvhd, ...tracks.map(trak), box('mvex', ...tracks.map(trex)))]);
}

// ============================================================================
// Media fragment
// ============================================================================

const SAMPLE_FLAGS_KEY = 0x02000000; // depends_on = 2 (no), is_non_sync = 0
const SAMPLE_FLAGS_NON_KEY = 0x01010000; // depends_on = 1 (yes), is_non_sync = 1
const TRUN_FLAGS = 0x000f01; // data-offset + per-sample duration, size, flags, composition offset
const TFHD_FLAGS = 0x020000; // default-base-is-moof

/**
 * One track's `moof` + `mdat`. `mdat` payload is the concatenated sample bytes (callers prefix NAL units with their
 * 4-byte lengths for video). `baseMediaDecodeTime` is the first sample's DTS in track ticks.
 */
export function buildMediaFragment(
  trackId: number,
  sequenceNumber: number,
  baseMediaDecodeTime: number,
  samples: FragmentSample[],
  payload: Uint8Array
): Uint8Array {
  const rows = new Uint8Array(16 * samples.length);
  const view = new DataView(rows.buffer);

  samples.forEach((sample, i) => {
    view.setUint32(i * 16, sample.duration);
    view.setUint32(i * 16 + 4, sample.size);
    view.setUint32(i * 16 + 8, sample.key ? SAMPLE_FLAGS_KEY : SAMPLE_FLAGS_NON_KEY);
    view.setInt32(i * 16 + 12, sample.cts);
  });

  // moof(8) + mfhd(16) + traf(8) + tfhd(16) + tfdt(20) + trun(20 + 16n) + mdat header(8)
  const dataOffset = 96 + rows.length;
  const moof = box(
    'moof',
    fullBox('mfhd', 0, 0, u32(sequenceNumber)),
    box(
      'traf',
      fullBox('tfhd', 0, TFHD_FLAGS, u32(trackId)),
      fullBox('tfdt', 1, 0, u64(baseMediaDecodeTime)),
      fullBox('trun', 1, TRUN_FLAGS, u32(samples.length), u32(dataOffset), rows)
    )
  );

  return concat([moof, box('mdat', payload)]);
}
