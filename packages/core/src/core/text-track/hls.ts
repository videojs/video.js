import type { MediaTextCue } from '@videojs/media';

import type { TextTrackDefinition } from './definition';

/**
 * An ID3 frame, as hls.js publishes it on a metadata cue.
 *
 * @experimental
 */
export interface Id3Frame {
  /** The frame id, such as `TXXX` or `PRIV`. */
  key: string;
  /** The frame's description or owner, when it has one. */
  info: string;
  data: unknown;
}

/**
 * One attribute of an HLS `EXT-X-DATERANGE` tag, as hls.js publishes it on a metadata cue.
 *
 * @experimental
 */
export interface HlsDateRangeAttribute {
  /** The attribute name, such as `CLASS` or `X-AD-ID`. */
  key: string;
  data: unknown;
}

/**
 * A metadata cue from hls.js. Its `type` tells an ID3 frame from a DATERANGE attribute.
 *
 * @experimental
 */
export type HlsMetadataCue =
  | (MediaTextCue<HlsDateRangeAttribute> & { type: 'com.apple.quicktime.HLS' })
  | (MediaTextCue<Id3Frame> & { type: 'org.id3' | 'https://aomedia.org/emsg/ID3' });

/**
 * The metadata track hls.js publishes ID3 and DATERANGE metadata on.
 *
 * ```ts
 * const [cue] = getActiveTextCues(player.store, hlsMetadataTrack);
 *
 * if (cue?.type === 'com.apple.quicktime.HLS') console.log(cue.value?.key);
 * ```
 *
 * @experimental
 */
export const hlsMetadataTrack: TextTrackDefinition<HlsMetadataCue> = Object.freeze({ kind: 'metadata', label: 'id3' });
