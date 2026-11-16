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
  // Keep the decimals of min too: min 0.25 with step 0.5 must land on 0.75, not 0.8.
  const decimals = Math.max(countDecimals(step), countDecimals(min));

  return decimals === 0 ? nearest : Number(nearest.toFixed(decimals));
}

function countDecimals(value: number): number {
  // Small and large numbers print in exponential notation: 2.5e-7 has 8 decimals.
  const [mantissa = '', exponent = '0'] = `${value}`.split('e');
  const dot = mantissa.indexOf('.');
  const fraction = dot === -1 ? 0 : mantissa.length - dot - 1;

  // toFixed() accepts at most 100 digits.
  return Math.min(Math.max(fraction - Number(exponent), 0), 100);
}
