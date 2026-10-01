/**
 * Decode-time origin extraction from fMP4/CMAF segments.
 *
 * Non-zero-PTS sources encode media at a non-zero start time (an instant clip starting at asset second 60, an Apple
 * bipbop asset starting at 10s, …). To relocate such a source onto a 0-based presentation timeline via
 * `SourceBuffer.timestampOffset`, the engine needs that start time — the **decode-time origin** — read straight from
 * the container:
 *
 * - `tfdt.baseMediaDecodeTime` (from a media segment's `moof`) — the decode time of the segment's first sample, in the
 *   track's media timescale. This is a DTS: relocating by `−(baseMediaDecodeTime / timescale)` lands the earliest DTS
 *   at exactly 0, so a negative-DTS append failure on Chromium is impossible by construction.
 * - `mdhd.timescale` (from the init segment's `moov`) — ticks per second for that track, needed to convert the raw tick
 *   count to seconds.
 *
 * {@link findMediaTrack} returns the track ID and timescale for the matching media handler;
 * {@link readBaseMediaDecodeTime} uses that ID to select the corresponding media fragment. The ID joins one track's
 * timescale to the same track's decode time, even when a caption track precedes it in a muxed init or segment. Only
 * buffered media handlers (`vide` / `soun`) are selected; caption rendering is outside this reader's scope.
 *
 * Both raw values are returned un-divided to leave room for an edit-list (`elst`) presentation-time correction term if
 * a source ever carries one — the validated streams do not.
 */
import { type Box, findBox, iterateBoxesOfType, readFourCC, readFullBoxVersion, toDataView } from './box';

/** MSE-buffered media handler types (`mdhd`/`hdlr`). Captions/subtitles excluded. */
export type MediaHandlerType = 'vide' | 'soun';

export interface MediaTrackInfo {
  /** `tkhd.track_id` — used to match the corresponding `traf` in media segments. */
  trackId: number;
  /** `mdhd.timescale` — ticks per second for this track. */
  timescale: number;
}

/**
 * The `track_ID` + timescale of the `trak` whose `mdhd` handler matches `handlerType`, skipping a muxed `clcp` caption
 * track. `undefined` if no matching track exists.
 */
export function findMediaTrack(
  initSegment: ArrayBuffer | Uint8Array,
  handlerType: MediaHandlerType
): MediaTrackInfo | undefined {
  const view = toDataView(initSegment);
  const moov = findBox(view, ['moov']);
  if (!moov) return undefined;

  for (const trak of iterateBoxesOfType(view, 'trak', moov.dataStart, moov.end)) {
    if (readTrakHandler(view, trak) !== handlerType) continue;

    const tkhd = findBox(view, ['tkhd'], trak.dataStart, trak.end);
    const mdhd = findBox(view, ['mdia', 'mdhd'], trak.dataStart, trak.end);
    if (!tkhd || !mdhd) return undefined;

    // tkhd FullBox: version(1)+flags(3), creation/modification dates (v0: 4+4, v1:
    // 8+8), then track_id.
    const trackId = view.getUint32(tkhd.dataStart + 4 + (readFullBoxVersion(view, tkhd.dataStart) === 1 ? 16 : 8));

    return { trackId, timescale: readMdhdTimescale(view, mdhd) };
  }

  return undefined;
}

/**
 * `baseMediaDecodeTime` (in the track's media timescale) from the `traf` matching `trackId` (via `tfhd.track_id`) —
 * required for muxed multi-`traf` segments. `undefined` if no matching `tfdt` exists.
 */
export function readBaseMediaDecodeTime(mediaSegment: ArrayBuffer | Uint8Array, trackId: number): number | undefined {
  const view = toDataView(mediaSegment);
  const moof = findBox(view, ['moof']);
  if (!moof) return undefined;

  for (const traf of iterateBoxesOfType(view, 'traf', moof.dataStart, moof.end)) {
    if (readTrafTrackId(view, traf) !== trackId) continue;

    const tfdt = findBox(view, ['tfdt'], traf.dataStart, traf.end);

    return tfdt ? readTfdtBaseMediaDecodeTime(view, tfdt) : undefined;
  }

  return undefined;
}

// --- shared leaf field-readers ------------------------------------------------

/** `mdhd.timescale`: FullBox version(1)+flags(3) + dates (v0: 4+4, v1: 8+8) + timescale. */
function readMdhdTimescale(view: DataView, mdhd: Box): number {
  return view.getUint32(mdhd.dataStart + 4 + (readFullBoxVersion(view, mdhd.dataStart) === 1 ? 16 : 8));
}

/** `tfdt.baseMediaDecodeTime`: FullBox, then the value — v0: (4), v1: (8). */
function readTfdtBaseMediaDecodeTime(view: DataView, tfdt: Box): number {
  const at = tfdt.dataStart + 4;

  return readFullBoxVersion(view, tfdt.dataStart) === 1 ? Number(view.getBigUint64(at)) : view.getUint32(at);
}

// --- track identity readers --------------------------------------------------

/** `hdlr.handler_type` for a `trak`: FullBox version(1)+flags(3) + pre_defined(4) + handler_type(4). */
function readTrakHandler(view: DataView, trak: Box): string | undefined {
  const hdlr = findBox(view, ['mdia', 'hdlr'], trak.dataStart, trak.end);

  return hdlr ? readFourCC(view, hdlr.dataStart + 8) : undefined;
}

/** `tfhd.track_id` for a `traf`: FullBox version(1)+flags(3) + track_id(4). */
function readTrafTrackId(view: DataView, traf: Box): number | undefined {
  const tfhd = findBox(view, ['tfhd'], traf.dataStart, traf.end);

  return tfhd ? view.getUint32(tfhd.dataStart + 4) : undefined;
}
