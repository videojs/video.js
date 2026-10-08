import type { MediaCrossOriginType } from '@videojs/media';

export interface ThumbnailCoords {
  x: number;
  y: number;
}

export interface ThumbnailImage {
  url: string;
  startTime: number;
  endTime?: number;
  width?: number;
  height?: number;
  coords?: ThumbnailCoords;
}

/** @internal */
export type ThumbnailSrc = string | ThumbnailImage[] | null;

/** The `<img>` CORS-settings attribute: a mode, the bare attribute (`''`, read as `anonymous`), or `null` for none. */
export type ThumbnailCrossOrigin = MediaCrossOriginType | '' | null;

export type ThumbnailLoading = 'eager' | 'lazy';

export type ThumbnailFetchPriority = 'high' | 'low' | 'auto';

/** @internal */
export interface ThumbnailConstraints {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

/** @internal */
export interface ThumbnailResizeResult {
  scale: number;
  containerWidth: number;
  containerHeight: number;
  imageWidth: number;
  imageHeight: number;
  offsetX: number;
  offsetY: number;
}
