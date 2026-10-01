import { isNumber } from '../predicate/predicate';

const formatters = new Map<string, Intl.NumberFormat>();

function localeCacheKey(locale?: string | string[]): string {
  if (locale === undefined) return '';

  return Array.isArray(locale) ? locale.join(':') : locale;
}

function getFormatter(locale?: string | string[]): Intl.NumberFormat | undefined {
  const key = localeCacheKey(locale);
  let formatter = formatters.get(key);

  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
      formatters.set(key, formatter);
    } catch {
      return undefined;
    }
  }

  return formatter;
}

function formatFallback(fraction: number): string {
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);

  return `${percent}%`;
}

/**
 * Format a fraction (0-1) with {@link Intl.NumberFormat} `style: "percent"`.
 *
 * @internal
 */
export function formatPercent(fraction: number, locale?: string | string[]): string {
  const value = !isNumber(fraction) || !Number.isFinite(fraction) ? 0 : Math.min(1, Math.max(0, fraction));

  try {
    const formatter = getFormatter(locale) ?? getFormatter(undefined);
    if (formatter) return formatter.format(value);
  } catch {
    // fall through to simple percent string
  }

  return formatFallback(value);
}
