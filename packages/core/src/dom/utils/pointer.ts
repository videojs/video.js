import { clamp } from '@videojs/utils/number';

/**
 * Convert a pointer event position to a 0–100 percent along an element's rect.
 *
 * @internal
 */
export function getPercentFromPointerEvent(
  event: { clientX: number; clientY: number },
  rect: DOMRect,
  orientation: 'horizontal' | 'vertical'
): number {
  let ratio: number;

  if (orientation === 'vertical') {
    ratio = 1 - (event.clientY - rect.top) / rect.height;
  } else {
    ratio = (event.clientX - rect.left) / rect.width;
  }

  // Guard against zero-sized rects (e.g., hidden/collapsed element) producing NaN.
  if (!Number.isFinite(ratio)) return 0;

  return clamp(ratio * 100, 0, 100);
}
