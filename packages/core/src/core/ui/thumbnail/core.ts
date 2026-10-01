import { findLastAtOrBefore } from '@videojs/utils/array';
import { isNull, isUndefined } from '@videojs/utils/predicate';

import type {
  ThumbnailConstraints,
  ThumbnailCrossOrigin,
  ThumbnailFetchPriority,
  ThumbnailImage,
  ThumbnailLoading,
  ThumbnailResizeResult,
} from './types';

export interface ThumbnailProps {
  /** Time in seconds to display the thumbnail for. */
  time?: number | undefined;
  /** Pre-parsed thumbnail images — bypasses the automatic `<track>` detection. */
  thumbnails?: ThumbnailImage[] | undefined;
}

export interface ThumbnailImageProps {
  /**
   * CORS setting forwarded to the inner `<img>`.
   *
   * Left unset, this follows the media element: a cross-origin thumbnail `<track>` only loads when the media is
   * CORS-enabled, so the sprite sheets its cues point at are fetched with that same mode. Pass `null` to opt out and
   * fetch them without CORS. Thumbnails supplied directly never inherit, since they need not be related to the media
   * element at all.
   *
   * `''` is a value like any other, read as Anonymous by the CORS-settings attribute rules — it does not opt out.
   */
  crossOrigin?: ThumbnailCrossOrigin | undefined;
  /** Image loading strategy forwarded to the inner `<img>`. */
  loading?: ThumbnailLoading | undefined;
  /** Image fetch priority hint forwarded to the inner `<img>`. */
  fetchPriority?: ThumbnailFetchPriority | undefined;
}

export interface ThumbnailState {
  /** The thumbnail image is loading. */
  loading: boolean;
  /** The thumbnail image failed to load. */
  error: boolean;
  /** Whether the component is hidden because no thumbnail is available and it is not loading. */
  hidden: boolean;
}

/** @internal */
export class ThumbnailCore {
  findActiveThumbnail(thumbnails: ThumbnailImage[], time: number): ThumbnailImage | undefined {
    return findLastAtOrBefore(thumbnails, time, (thumbnail) => thumbnail.startTime);
  }

  /**
   * Parse CSS constraint strings into numeric `ThumbnailConstraints`.
   *
   * Accepts any object with string `minWidth`/`maxWidth`/`minHeight`/`maxHeight` properties — `CSSStyleDeclaration`
   * satisfies this structurally.
   */
  parseConstraints(raw: {
    minWidth: string;
    maxWidth: string;
    minHeight: string;
    maxHeight: string;
  }): ThumbnailConstraints {
    const minW = parseFloat(raw.minWidth);
    const maxW = parseFloat(raw.maxWidth);
    const minH = parseFloat(raw.minHeight);
    const maxH = parseFloat(raw.maxHeight);

    return {
      minWidth: Number.isFinite(minW) ? minW : 0,
      maxWidth: Number.isFinite(maxW) ? maxW : Infinity,
      minHeight: Number.isFinite(minH) ? minH : 0,
      maxHeight: Number.isFinite(maxH) ? maxH : Infinity,
    };
  }

  /**
   * Calculate a uniform scale factor that sizes `tileWidth × tileHeight` to the given CSS min/max constraints while
   * preserving aspect ratio.
   *
   * - Fills the max constraints, scaling the tile up as readily as down. A box that grows — entering fullscreen widens it
   *   through a container query — has to take the tile with it rather than leave it at its native size.
   * - Raises that to meet min constraints, which win over max as they do in CSS.
   * - Returns `1` when unconstrained.
   */
  calculateScale(tileWidth: number, tileHeight: number, constraints: ThumbnailConstraints): number {
    const { minWidth, maxWidth, minHeight, maxHeight } = constraints;

    const maxRatio = Math.min(maxWidth / tileWidth, maxHeight / tileHeight);
    const minRatio = Math.max(minWidth / tileWidth, minHeight / tileHeight);

    const scale = Number.isFinite(maxRatio) ? maxRatio : 1;

    return Number.isFinite(minRatio) && minRatio > scale ? minRatio : scale;
  }

  /**
   * Compute container and image dimensions for the current thumbnail, scaled to the element's CSS min/max constraints.
   *
   * The container clips the sprite sheet via `overflow: hidden`, and the image is positioned with `transform:
   * translate()` to show the correct tile.
   */
  resize(
    thumbnail: ThumbnailImage,
    imgNaturalWidth: number,
    imgNaturalHeight: number,
    constraints: ThumbnailConstraints
  ): ThumbnailResizeResult | undefined {
    const tileWidth = thumbnail.width ?? imgNaturalWidth;
    const tileHeight = thumbnail.height ?? imgNaturalHeight;
    if (!tileWidth || !tileHeight) return undefined;

    const scale = this.calculateScale(tileWidth, tileHeight, constraints);

    const coordX = thumbnail.coords?.x ?? 0;
    const coordY = thumbnail.coords?.y ?? 0;

    // Inset by 1px to eat the interpolation fringe the browser introduces when
    // scaling the sprite sheet (bilinear filtering blends across tile boundaries).
    const inset = scale !== 1 ? 1 : 0;

    return {
      scale,
      // Floor container so it never extends past the tile boundary.
      containerWidth: Math.max(0, Math.floor(tileWidth * scale) - inset * 2),
      containerHeight: Math.max(0, Math.floor(tileHeight * scale) - inset * 2),
      // Ceil image so the sprite sheet always fills the container.
      imageWidth: Math.ceil(imgNaturalWidth * scale),
      imageHeight: Math.ceil(imgNaturalHeight * scale),
      // Ceil offset so it never undershoots the tile origin (prevents top/left bleed).
      offsetX: Math.ceil(coordX * scale) + inset,
      offsetY: Math.ceil(coordY * scale) + inset,
    };
  }

  /**
   * Resolve the CORS mode the image should request with.
   *
   * `null` opts out and drops the attribute. Any other explicit value wins, including `''`, which the CORS-settings
   * attribute reads as Anonymous. Otherwise the inherited mode applies, which renderers supply only for
   * `<track>`-sourced thumbnails since a list set directly may point at a host unrelated to the media element.
   */
  resolveCrossOrigin(
    explicit: ThumbnailCrossOrigin | undefined,
    inherited: ThumbnailCrossOrigin | undefined
  ): Exclude<ThumbnailCrossOrigin, null> | undefined {
    if (isNull(explicit)) return undefined;

    if (!isUndefined(explicit)) return explicit;

    return inherited ?? undefined;
  }

  getState(loading: boolean, error: boolean, thumbnail: ThumbnailImage | undefined): ThumbnailState {
    return {
      loading,
      error,
      hidden: !loading && !thumbnail,
    };
  }

  getAttrs(_state: ThumbnailState) {
    return {
      // Sprite coordinates are physical offsets from the image's left edge.
      dir: 'ltr' as const,
      role: 'img' as const,
      'aria-hidden': 'true' as const,
    };
  }
}

/** @internal */
export namespace ThumbnailCore {
  export type Props = ThumbnailProps & ThumbnailImageProps;
  export type RootProps = ThumbnailProps;
  export type ImageProps = ThumbnailImageProps;
  export type State = ThumbnailState;
}
