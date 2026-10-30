import type { MediaPlaybackRateRange } from '@videojs/media';
import { isString } from '@videojs/utils/predicate';

/**
 * Normalizes author input into a list of playback rates. Accepts an array or a space-separated attribute value, keeps
 * the author's order, and drops invalid and repeated rates. Returns `undefined` when no usable rate is left, so the
 * caller can fall back to its own list.
 */
export function parsePlaybackRates(
  value: readonly number[] | string | null | undefined
): readonly number[] | undefined {
  const candidates = isString(value) ? value.trim().split(/\s+/).map(Number) : (value ?? []);
  const rates = [...new Set(candidates.filter((rate) => Number.isFinite(rate) && rate > 0))];

  return rates.length > 0 ? rates : undefined;
}

/**
 * Slots `rate` into `rates` before the first faster rate, or at the end when none is faster. Returns `rates` unchanged
 * when it already holds `rate`.
 */
export function insertPlaybackRate(rates: readonly number[], rate: number): readonly number[] {
  if (rates.includes(rate)) return rates;

  const index = rates.findIndex((candidate) => candidate > rate);
  if (index === -1) return [...rates, rate];

  return [...rates.slice(0, index), rate, ...rates.slice(index)];
}

/** Keeps the rates that fall within `range`, in their order. */
export function filterPlaybackRates(rates: readonly number[], { min, max }: MediaPlaybackRateRange): readonly number[] {
  return rates.filter((rate) => rate >= min && rate <= max);
}

/**
 * Drops floating-point noise from a rate: browsers store `playbackRate` in single precision, so `1.1` reads back as
 * `1.100000023841858`, and stepped rates such as `1 + 0.1` land just off the value. Five decimal places keeps every
 * rate within the native range intact.
 */
export function roundPlaybackRate(rate: number): number {
  return Math.round(rate * 1e5) / 1e5;
}
