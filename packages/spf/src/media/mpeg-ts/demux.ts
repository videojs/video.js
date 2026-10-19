/**
 * MPEG-2 Transport Stream demuxer — the packet layer only. Walks 188-byte packets, follows PAT → PMT to find the
 * program's H.264 and ADTS AAC elementary streams, and reassembles each stream's PES packets (payload + PTS/DTS).
 *
 * Scoped to what HLS-over-TS as Mux packages it needs: one program, AUD-aligned PES packets carrying a PTS each, no
 * scrambling, no PCR use (timing comes from PES timestamps alone). Codec-level parsing (Annex B NAL units, ADTS frames)
 * is the next layer up — see `h264.ts` and `adts.ts`.
 */

/** PES payload with its 90 kHz timestamps. `dts` defaults to `pts` when the PES carries no DTS. */
export interface PesPacket {
  pts: number | undefined;
  dts: number | undefined;
  data: Uint8Array;
}

/** One elementary stream's PES packets, in transport order, with its PMT stream type. */
export interface ElementaryStream {
  pid: number;
  streamType: number;
  packets: PesPacket[];
}

export const TS_PACKET_LENGTH = 188;
const SYNC_BYTE = 0x47;

/** Container sniff: a TS segment starts on a sync byte and keeps the 188-byte cadence. */
export function isTransportStream(bytes: Uint8Array): boolean {
  return bytes[0] === SYNC_BYTE && (bytes.length <= TS_PACKET_LENGTH || bytes[TS_PACKET_LENGTH] === SYNC_BYTE);
}

/** A PES boundary inside a stream's concatenated payload, with the timestamps that PES carried. */
export interface PesBoundary {
  offset: number;
  pts: number | undefined;
  dts: number | undefined;
}

/** A stream's PES payloads as one continuous elementary stream, with where each PES began. */
export interface ElementaryStreamData {
  data: Uint8Array;
  boundaries: PesBoundary[];
}

/**
 * A stream's PES payloads as one continuous elementary stream plus the PES boundaries. The packager need not align PES
 * packets with access units or audio frames (Mux's doesn't: a picture's slice data can run into the next PES), so codec
 * framing walks the continuous stream and takes its timing from the PES in which each unit _begins_.
 */
export function concatPes(packets: PesPacket[]): ElementaryStreamData {
  const data = new Uint8Array(packets.reduce((n, p) => n + p.data.length, 0));
  const boundaries: PesBoundary[] = [];
  let offset = 0;

  for (const packet of packets) {
    boundaries.push({ offset, pts: packet.pts, dts: packet.dts });
    data.set(packet.data, offset);
    offset += packet.data.length;
  }

  return { data, boundaries };
}

/** 33-bit PTS/DTS from its 5-byte PES encoding — multiplies rather than shifts, since the value exceeds 32 bits. */
function readTimestamp(data: Uint8Array, offset: number): number {
  return (
    (data[offset]! & 0x0e) * 2 ** 29 +
    data[offset + 1]! * 2 ** 22 +
    (data[offset + 2]! & 0xfe) * 2 ** 14 +
    data[offset + 3]! * 2 ** 7 +
    (data[offset + 4]! >> 1)
  );
}

function concat(chunks: Uint8Array[]): Uint8Array {
  if (chunks.length === 1) return chunks[0]!;

  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let offset = 0;

  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }

  return out;
}

/** Parse one reassembled PES packet; `undefined` when the chunks don't start with a PES start code. */
function parsePes(chunks: Uint8Array[]): PesPacket | undefined {
  const data = concat(chunks);
  if (data.length < 9 || data[0] !== 0 || data[1] !== 0 || data[2] !== 1) return undefined;

  const flags = data[7]!;
  const headerLength = data[8]!;
  const pts = flags & 0x80 ? readTimestamp(data, 9) : undefined;
  const dts = flags & 0x40 ? readTimestamp(data, 14) : pts;

  return { pts, dts, data: data.subarray(9 + headerLength) };
}

/** PAT: the first program's PMT PID. */
function parsePat(data: Uint8Array, offset: number): number {
  return ((data[offset + 10]! & 0x1f) << 8) | data[offset + 11]!;
}

/** PMT: `(pid, stream_type)` for every elementary stream in the program. */
function parsePmt(data: Uint8Array, offset: number): Array<{ pid: number; streamType: number }> {
  const sectionLength = ((data[offset + 1]! & 0x0f) << 8) | data[offset + 2]!;
  const tableEnd = offset + 3 + sectionLength - 4; // minus CRC
  const programInfoLength = ((data[offset + 10]! & 0x0f) << 8) | data[offset + 11]!;
  const streams: Array<{ pid: number; streamType: number }> = [];

  for (let i = offset + 12 + programInfoLength; i < tableEnd;) {
    const esInfoLength = ((data[i + 3]! & 0x0f) << 8) | data[i + 4]!;

    streams.push({ streamType: data[i]!, pid: ((data[i + 1]! & 0x1f) << 8) | data[i + 2]! });
    i += 5 + esInfoLength;
  }

  return streams;
}

/**
 * Demux a complete TS segment into the PES packets of the requested PMT stream types, keyed by stream type (the first
 * PID the PMT declares for each). Streams of other types are skipped at the packet level, so an audio-only consumer
 * never assembles the video PES. Packets are delimited by the payload-unit-start indicator, so a PES whose length field
 * is 0 (unbounded, the norm for video) still reassembles correctly; a trailing PES cut off by the segment end is kept
 * as-is (its payload is simply short).
 */
export function demuxTransportStream(
  bytes: Uint8Array,
  streamTypes: ReadonlySet<number>
): Map<number, ElementaryStream> {
  const assembling = new Map<number, { stream: ElementaryStream; chunks: Uint8Array[] | undefined }>();
  const claimed = new Set<number>();
  let pmtPid = -1;

  const flush = (entry: { stream: ElementaryStream; chunks: Uint8Array[] | undefined }) => {
    const pes = entry.chunks && parsePes(entry.chunks);

    if (pes) entry.stream.packets.push(pes);
  };

  for (let start = 0; start + TS_PACKET_LENGTH <= bytes.length; start += TS_PACKET_LENGTH) {
    if (bytes[start] !== SYNC_BYTE) {
      // Lost sync: step forward to the next sync byte rather than mis-parsing a partial packet.
      start -= TS_PACKET_LENGTH - 1;
      continue;
    }

    const payloadStart = (bytes[start + 1]! & 0x40) !== 0;
    const pid = ((bytes[start + 1]! & 0x1f) << 8) | bytes[start + 2]!;
    const adaptation = (bytes[start + 3]! & 0x30) >> 4;
    let offset = start + 4;

    if (adaptation & 2) offset += 1 + bytes[start + 4]!;

    if (!(adaptation & 1) || offset >= start + TS_PACKET_LENGTH) continue;

    if (pid === 0) {
      pmtPid = parsePat(bytes, payloadStart ? offset + 1 + bytes[offset]! : offset);
      continue;
    }

    if (pid === pmtPid) {
      for (const { pid: esPid, streamType } of parsePmt(bytes, payloadStart ? offset + 1 + bytes[offset]! : offset)) {
        if (!assembling.has(esPid) && streamTypes.has(streamType) && !claimed.has(streamType)) {
          claimed.add(streamType);
          assembling.set(esPid, { stream: { pid: esPid, streamType, packets: [] }, chunks: undefined });
        }
      }

      continue;
    }

    const entry = assembling.get(pid);
    if (!entry) continue;

    if (payloadStart) {
      flush(entry);
      entry.chunks = [];
    }

    entry.chunks?.push(bytes.subarray(offset, start + TS_PACKET_LENGTH));
  }

  const streams = new Map<number, ElementaryStream>();

  for (const entry of assembling.values()) {
    flush(entry);
    streams.set(entry.stream.streamType, entry.stream);
  }

  return streams;
}
