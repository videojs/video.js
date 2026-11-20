import type { FrameRate } from '../types';

/** Parse HLS attribute list from a tag line. Handles both quoted and unquoted values. */
export function parseAttributeList(line: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const regex = /([A-Z0-9-]+)=(?:"([^"]*)"|([^,]*))/g;

  for (const match of line.matchAll(regex)) {
    const key = match[1];
    const value = match[2] ?? match[3] ?? '';

    if (key) {
      attributes.set(key, value);
    }
  }

  return attributes;
}

/** Parse RESOLUTION attribute value (WIDTHxHEIGHT). */
export function parseResolution(value: string): { width: number; height: number } | null {
  const match = /^(\d+)x(\d+)$/.exec(value);
  if (!match) return null;

  const width = Number.parseInt(match[1]!, 10);
  const height = Number.parseInt(match[2]!, 10);

  return { width, height };
}

/** Parse FRAME-RATE attribute to rational frame rate. */
export function parseFrameRate(value: string): FrameRate | undefined {
  const fps = Number.parseFloat(value);
  if (Number.isNaN(fps) || fps <= 0) return undefined;

  // Common frame rates with tolerance for floating point precision
  if (Math.abs(fps - 23.976) < 0.01) {
    return { frameRateNumerator: 24000, frameRateDenominator: 1001 };
  }

  if (Math.abs(fps - 29.97) < 0.01) {
    return { frameRateNumerator: 30000, frameRateDenominator: 1001 };
  }

  if (Math.abs(fps - 59.94) < 0.01) {
    return { frameRateNumerator: 60000, frameRateDenominator: 1001 };
  }

  // Integer frame rates
  if (fps % 1 === 0) {
    return { frameRateNumerator: Math.round(fps) };
  }

  // Default: use rounded value
  return { frameRateNumerator: Math.round(fps) };
}

// Video codec identifiers, matched case-insensitively against each CODECS
// entry's prefix: AVC (`avc1`, `avc3`), HEVC (`hvc1`, `hev1`), Dolby Vision
// (`dvh1`, `dvhe`, `dva1`, `dvav`, `dav1`), AV1, and VP9. An unrecognized codec
// parses empty, which leaves the track with no codecs to probe or to build its
// SourceBuffer mimetype from.
const VIDEO_CODEC_PREFIXES = [
  'avc1.',
  'avc3.',
  'hvc1.',
  'hev1.',
  'dvh1.',
  'dvhe.',
  'dva1.',
  'dvav.',
  'dav1.',
  'av01.',
  'vp09.',
];

// Audio codec identifiers, matched case-insensitively against each CODECS
// entry's prefix. Beyond AAC (`mp4a.*`): Dolby (`ac-3`, `ec-3`, `ac-4`), Opus,
// FLAC (`fLaC`), DTS (`dts*`), ALAC, and Vorbis. Recognizing these is what lets
// capability probing filter undecodable audio renditions (e.g. an AC-3 5.1
// track on a browser without AC-3) — an unrecognized codec parses empty and is
// treated as unprobeable, so it would never be pruned.
const AUDIO_CODEC_PREFIXES = ['mp4a.', 'ac-3', 'ec-3', 'ac-4', 'opus', 'flac', 'dts', 'alac', 'vorbis'];

/** Parse CODECS attribute into separate video and audio codecs. */
export function parseCodecs(codecs: string): { video?: string; audio?: string } {
  const parts = codecs.split(',').map((s) => s.trim());
  const result: { video?: string; audio?: string } = {};

  for (const codec of parts) {
    const lower = codec.toLowerCase();

    if (VIDEO_CODEC_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
      result.video = codec;
    } else if (AUDIO_CODEC_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
      result.audio = codec;
    }
  }

  return result;
}

/** Parse #EXTINF duration value. */
export function parseExtInfDuration(value: string): number {
  const durationPart = value.split(',')[0] ?? value;
  const duration = Number.parseFloat(durationPart);

  return Number.isNaN(duration) ? 0 : duration;
}

/**
 * Parse BYTERANGE attribute value. Format: "length[@offset]" If offset is omitted, it continues from the previous byte
 * range end.
 */
export function parseByteRange(value: string, previousEnd?: number): { start: number; end: number } | null {
  const match = /^(\d+)(?:@(\d+))?$/.exec(value);
  if (!match) return null;

  const length = Number.parseInt(match[1]!, 10);
  if (Number.isNaN(length)) return null;

  let start: number;

  if (match[2] !== undefined) {
    start = Number.parseInt(match[2], 10);

    if (Number.isNaN(start)) return null;
  } else if (previousEnd !== undefined) {
    start = previousEnd;
  } else {
    return null;
  }

  return { start, end: start + length - 1 };
}

/** AttributeList - Typed attribute access wrapper. */
export interface AttributeList {
  get: (key: string) => string | undefined;
  getInt: (key: string, defaultValue?: number) => number | undefined;
  getFloat: (key: string, defaultValue?: number) => number | undefined;
  getBool: (key: string) => boolean;
  getResolution: (key: string) => { width: number; height: number } | undefined;
  getFrameRate: (key: string) => FrameRate | undefined;
}

/** Create AttributeList from raw attribute string. */
export function createAttributeList(line: string): AttributeList {
  const map = parseAttributeList(line);

  return {
    get(key: string): string | undefined {
      return map.get(key);
    },

    getInt(key: string, defaultValue?: number): number | undefined {
      const value = map.get(key);
      if (value === undefined) return defaultValue;

      const parsed = Number.parseInt(value, 10);

      return Number.isNaN(parsed) ? defaultValue : parsed;
    },

    getFloat(key: string, defaultValue?: number): number | undefined {
      const value = map.get(key);
      if (value === undefined) return defaultValue;

      const parsed = Number.parseFloat(value);

      return Number.isNaN(parsed) ? defaultValue : parsed;
    },

    getBool(key: string): boolean {
      return map.get(key) === 'YES';
    },

    getResolution(key: string): { width: number; height: number } | undefined {
      const value = map.get(key);
      if (!value) return undefined;

      return parseResolution(value) ?? undefined;
    },

    getFrameRate(key: string): FrameRate | undefined {
      const value = map.get(key);
      if (!value) return undefined;

      return parseFrameRate(value);
    },
  };
}

/** Match a tag and extract its attributes. Returns null if the line doesn't match the tag. */
export function matchTag(line: string, tag: string): AttributeList | null {
  const prefix = `#${tag}:`;
  if (!line.startsWith(prefix)) return null;

  return createAttributeList(line.slice(prefix.length));
}
