import type { GestureRegion } from './gesture';

/**
 * Determine which named region a pointer position falls into.
 *
 * Regions divide the container width equally based on how many are active: - `left` + `right` → halves (50% / 50%) -
 * `left` + `center` + `right` → thirds (33% / 34% / 33%)
 *
 * Single region: `left` covers the left half, `right` the right half, and `center` covers the full surface. Partial
 * two-region combos (e.g. `left` + `center`) use the same natural zones — positions outside all active zones return
 * `null` so full-surface gestures can handle them.
 */
export function resolveRegion(
  clientX: number,
  containerRect: DOMRect,
  activeRegions: ReadonlySet<GestureRegion>
): GestureRegion | null {
  const relativeX = clientX - containerRect.left;
  const width = containerRect.width;
  if (width === 0) return null;

  const ratio = relativeX / width;

  if (activeRegions.size === 2 && activeRegions.has('left') && activeRegions.has('right')) {
    return ratio < 0.5 ? 'left' : 'right';
  }

  if (activeRegions.size === 3) {
    if (ratio < 1 / 3) return 'left';

    if (ratio < 2 / 3) return 'center';

    return 'right';
  }

  // Single region or partial combinations — each region covers its natural zone.
  // Pointer outside all active zones returns null (full-surface gesture handles it).
  // Note: with `left` + `center`, left covers 0–50% and center covers 33–66%.
  // Overlap at 33–50% resolves to `left` (checked first).
  if (activeRegions.has('left') && ratio < 0.5) return 'left';

  if (activeRegions.has('right') && ratio >= 0.5) return 'right';

  if (activeRegions.has('center')) {
    if (activeRegions.size === 1) return 'center';

    if (ratio >= 1 / 3 && ratio < 2 / 3) return 'center';
  }

  return null;
}
