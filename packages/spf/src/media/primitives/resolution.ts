/**
 * Pixel dimensions, and the one projection every reader of them needs.
 *
 * Shared by the surfaces a rendition cap measures — a screen (`media/dom/screen`), a player element
 * (`behaviors/dom/track-player-resolution`) — and by the caps that compare renditions against them. Lives outside the
 * DOM layer because scaling and rounding two numbers needs no DOM, which is also what lets the DOM-free selection rules
 * name the type they read instead of restating its shape.
 */

/**
 * A surface's pixel dimensions.
 *
 * A width and a height rather than a `"720p"`-style tier, because a tier only describes a surface once you assume its
 * aspect ratio — the assumption that mis-measures an anamorphic or otherwise non-16:9 rendition.
 */
export interface Resolution {
  readonly width: number;
  readonly height: number;
}

/**
 * Apply `scale` to a size and normalize it to whole pixels, or `undefined` where that leaves nothing to describe.
 *
 * Rounded because pixels are whole and a fractional scale doesn't divide a surface evenly. A non-positive or non-finite
 * axis yields `undefined` rather than a zero-area reading: an element that isn't being rendered reports `0 × 0` and a
 * nonsense dimension reports `NaN`, and the caps consuming this read absence as "unknown, don't cap" while an area of
 * zero would read as a cap of zero — pinning every source to its smallest rendition.
 *
 * @param size - Dimensions to project, in the units `scale` converts from
 * @param scale - Multiplier for both axes, e.g. `devicePixelRatio`; defaults to 1
 * @returns The scaled, whole-pixel resolution, or `undefined` when either axis
 * doesn't survive it
 */
export function scaleResolution(size: Resolution, scale = 1): Resolution | undefined {
  const width = Math.round(size.width * scale);
  const height = Math.round(size.height * scale);

  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? { width, height } : undefined;
}
