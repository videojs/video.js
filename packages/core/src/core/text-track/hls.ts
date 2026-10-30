import type { MediaTextCue } from '@videojs/media';

import type { TextTrackDefinition } from './definition';

/** An ID3 frame, as hls.js publishes it on a metadata cue. */
export interface Id3Frame {
  /** The frame id, such as `TXXX` or `PRIV`. */
  key: string;
  /** The frame's description or owner, when it has one. */
  info: string;
  data: unknown;
}

/** One attribute of an HLS `EXT-X-DATERANGE` tag, as hls.js publishes it on a metadata cue. */
export interface HlsDateRangeAttribute {
  /** The attribute name, such as `CLASS` or `X-AD-ID`. */
  key: string;
  data: unknown;
}

/**
 * A metadata cue from hls.js. Its `type` tells an ID3 frame from a DATERANGE attribute. ID3 from an `emsg` box is
 * `org.id3` too.
 */
export type HlsMetadataCue =
  | (MediaTextCue<HlsDateRangeAttribute> & { type: 'com.apple.quicktime.HLS' })
  | (MediaTextCue<Id3Frame> & { type: 'org.id3' });

/**
 * The metadata track hls.js publishes ID3 and DATERANGE metadata on.
 *
 * ```ts
 * const [cue] = getActiveTextCues(player.store, hlsMetadataTrack);
 *
 * if (cue?.type === 'com.apple.quicktime.HLS') console.log(cue.value?.key);
 * ```
 */
export const hlsMetadataTrack: TextTrackDefinition<HlsMetadataCue> = Object.freeze({ kind: 'metadata', label: 'id3' });
