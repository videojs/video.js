import type { MediaTextCue } from '@videojs/media';
import { isNumber } from '@videojs/utils/predicate';

import type { ThumbnailCoords, ThumbnailImage } from './types';

/**
 * Parse `url#xywh=x,y,w,h` into a URL and optional sprite coordinates.
 *
 * @internal
 */
export function parseMediaFragment(
  text: string,
  baseURL?: string
): {
  url: string;
  width?: number;
  height?: number;
  coords?: ThumbnailCoords;
} {
  const parts = text.trim().split('#');
  const rawURL = parts[0] ?? '';
  const hash = parts[1];

  const url = baseURL ? new URL(rawURL, baseURL).href : rawURL;

  if (!hash) return { url };

  const eqIndex = hash.indexOf('=');
  if (eqIndex === -1) return { url };

  const keys = hash.slice(0, eqIndex);
  const values = hash
    .slice(eqIndex + 1)
    .split(',')
    .map(Number);

  const data: Record<string, number> = {};

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = values[i];

    if (key && isNumber(value) && !Number.isNaN(value)) {
      data[key] = value;
    }
  }

  const result: { url: string; width?: number; height?: number; coords?: ThumbnailCoords } = { url };

  if (isNumber(data.w)) result.width = data.w;

  if (isNumber(data.h)) result.height = data.h;

  if (isNumber(data.x) && isNumber(data.y)) result.coords = { x: data.x, y: data.y };

  return result;
}

/**
 * Convert an array of text cues (e.g. `VTTCue` from a `<track>` element) into {@link ThumbnailImage} entries by parsing
 * the media-fragment in each cue's text.
 *
 * @internal
 */
export function mapCuesToThumbnails(cues: MediaTextCue[], baseURL?: string): ThumbnailImage[] {
  const images: ThumbnailImage[] = [];

  for (const cue of cues) {
    const fragment = parseMediaFragment(cue.text, baseURL);
    const image: ThumbnailImage = { url: fragment.url, startTime: cue.startTime, endTime: cue.endTime };

    if (fragment.width) image.width = fragment.width;

    if (fragment.height) image.height = fragment.height;

    if (fragment.coords) image.coords = fragment.coords;

    images.push(image);
  }

  return images;
}
