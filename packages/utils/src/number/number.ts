/**
 * Clamp a value between min and max (inclusive).
 *
 * @internal
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Convert a value within a range to a clamped percentage (0–100).
 *
 * @param value - Value to convert.
 * @param min - Start of the range.
 * @param max - End of the range.
 * @internal
 */
export function toPercent(value: number, min: number, max: number): number {
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) return 0;

  return clamp(((value - min) / range) * 100, 0, 100);
}

/**
 * Snap a value to the nearest step, offset from min.
 *
 * @internal
 */
export function roundToStep(value: number, step: number, min: number): number {
  const nearest = Math.round((value - min) / step) * step + min;
  const dot = `${step}`.indexOf('.');

  return dot === -1 ? nearest : Number(nearest.toFixed(`${step}`.length - dot - 1));
}
