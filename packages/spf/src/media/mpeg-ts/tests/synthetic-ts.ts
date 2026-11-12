/**
 * Synthetic MPEG-TS segments for tests: a PAT, a PMT declaring one ADTS AAC stream, and one PES of ADTS frames. Enough
 * for the demuxer and the AAC codec module to produce a real init segment and fragment, with no network fixture.
 */

const PMT_PID = 0x1000;
const AAC_PID = 0x101;
const AAC_STREAM_TYPE = 0x0f;
const PACKET_LENGTH = 188;

/** One 188-byte packet carrying `payload` from its start, padded with 0xff. */
function packet(pid: number, payload: number[]): number[] {
  const header = [0x47, 0x40 | (pid >> 8), pid & 0xff, 0x10];
  const padding = new Array<number>(PACKET_LENGTH - header.length - payload.length).fill(0xff);

  return [...header, ...payload, ...padding];
}

function pat(): number[] {
  // Pointer field, then the section: table 0, length 13, transport stream 1, program 1 → PMT PID.
  return [0, 0x00, 0xb0, 13, 0, 1, 0xc1, 0, 0, 0, 1, 0xe0 | (PMT_PID >> 8), PMT_PID & 0xff, 0, 0, 0, 0];
}

function pmt(): number[] {
  // Pointer field, then the section: table 2, length 18, program 1, PCR PID, no program info, one stream, CRC.
  return [
    0,
    0x02,
    0xb0,
    18,
    0,
    1,
    0xc1,
    0,
    0,
    0xe0 | (AAC_PID >> 8),
    AAC_PID & 0xff,
    0xf0,
    0,
    AAC_STREAM_TYPE,
    0xe0 | (AAC_PID >> 8),
    AAC_PID & 0xff,
    0xf0,
    0,
    0,
    0,
    0,
    0,
  ];
}

/** A 7-byte-header ADTS frame: AAC LC, mono, `payloadLength` bytes of silence. */
function adtsFrame(samplingIndex: number, payloadLength: number): number[] {
  const length = 7 + payloadLength;

  return [
    0xff,
    0xf1,
    (1 << 6) | (samplingIndex << 2),
    (1 << 6) | (length >> 11),
    (length >> 3) & 0xff,
    ((length & 7) << 5) | 0x1f,
    0xfc,
    ...new Array<number>(payloadLength).fill(0),
  ];
}

/** A PES carrying `data` with a PTS. */
function pes(pts: number, data: number[]): number[] {
  return [
    0,
    0,
    1,
    0xc0,
    0,
    0,
    0x80,
    0x80,
    5,
    0x21 | ((pts >> 29) & 0x0e),
    (pts >> 22) & 0xff,
    ((pts >> 14) & 0xfe) | 1,
    (pts >> 7) & 0xff,
    ((pts << 1) & 0xfe) | 1,
    ...data,
  ];
}

/**
 * An audio-only TS segment of three ADTS frames. `samplingIndex` sets the sample rate (3 = 48 kHz, 4 = 44.1 kHz), so
 * two values stand in for two renditions with different sample entries.
 */
export function aacSegment({
  pts = 900_000,
  samplingIndex = 3,
}: { pts?: number; samplingIndex?: number } = {}): Uint8Array {
  const frames = [0, 1, 2].flatMap(() => adtsFrame(samplingIndex, 8));

  return Uint8Array.from([...packet(0, pat()), ...packet(PMT_PID, pmt()), ...packet(AAC_PID, pes(pts, frames))]);
}
