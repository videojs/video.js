import { DEFAULT_LOCALE, isDefaultLocale } from '../i18n';
import { isNumber } from '../predicate/predicate';

/** @internal */
export type TimeFormatOptions = {
  /** BCP 47 tag(s) for the `Intl` formatters. */
  locale?: string | string[];
  /** Called only when `seconds` is negative; formats the localized remaining-time phrase for the duration body. */
  formatRemaining?: (duration: string) => string;
  /** Unit display style; defaults to `"long"`. */
  style?: 'long' | 'short' | 'narrow' | 'digital';
};

type DurationRecord = Partial<{ hours: number; minutes: number; seconds: number }>;

type DurationFormatter = { format: (duration: DurationRecord) => string };

const durationFormatters = new Map<string, DurationFormatter>();

// Use one widely supported formatting path so server and browser output match during SSR hydration.
function createDurationFormatter(
  style: NonNullable<TimeFormatOptions['style']>,
  hoursDisplay?: 'auto' | 'always',
  locale?: string | string[]
): DurationFormatter {
  if (style === 'digital') {
    const number = new Intl.NumberFormat(locale, { useGrouping: false });
    const padded = new Intl.NumberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false });

    return {
      format: (duration) => {
        const body = `${padded.format(duration.minutes ?? 0)}:${padded.format(duration.seconds ?? 0)}`;
        const showHours = hoursDisplay === 'always' || duration.hours !== undefined;

        return showHours ? `${number.format(duration.hours ?? 0)}:${body}` : body;
      },
    };
  }

  const units: Array<[keyof DurationRecord, Intl.NumberFormat]> = [
    ['hours', new Intl.NumberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: style })],
    ['minutes', new Intl.NumberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: style })],
    ['seconds', new Intl.NumberFormat(locale, { style: 'unit', unit: 'second', unitDisplay: style })],
  ];
  // Some embedded WebKit builds ship without `Intl.ListFormat`; join the units the way English unit lists do.
  const list: Pick<Intl.ListFormat, 'format'> =
    typeof Intl.ListFormat === 'function'
      ? new Intl.ListFormat(locale, { type: 'unit', style })
      : { format: (parts) => [...parts].join(style === 'narrow' ? ' ' : ', ') };

  return {
    format: (duration) =>
      list.format(
        units
          .filter(([unit]) => duration[unit] !== undefined)
          .map(([unit, formatter]) => formatter.format(duration[unit] ?? 0))
      ),
  };
}

function localeCacheKey(locale?: string | string[]): string {
  if (locale === undefined) return '';

  return Array.isArray(locale) ? locale.join(':') : locale;
}

function getDurationFormatter(
  locale?: string | string[],
  style: NonNullable<TimeFormatOptions['style']> = 'long',
  hoursDisplay?: 'auto' | 'always'
): DurationFormatter {
  const key = `${localeCacheKey(locale)}:${style}:${hoursDisplay ?? ''}`;
  let formatter = durationFormatters.get(key);

  if (!formatter) {
    formatter = createDurationFormatter(style, hoursDisplay, locale);
    durationFormatters.set(key, formatter);
  }

  return formatter;
}

function isValidTime(value: number): boolean {
  return isNumber(value) && Number.isFinite(value);
}

/**
 * Format seconds to digital display string.
 *
 * @example
 *   formatTime(90); // "1:30"
 *   formatTime(3661); // "1:01:01"
 *   formatTime(35, 3600); // "0:00:35" (guided by 1-hour duration)
 *   formatTime(35, 600); // "00:35" (guided by 10-minute duration)
 *
 * @param seconds - Time in seconds (can be negative)
 * @param guide - Guide time (typically duration) to determine display format
 * @param options - Digital formatting options
 * @returns Formatted string like "1:30" or "1:05:30"
 * @internal
 */
export function formatTime(seconds: number, guide?: number, options?: Pick<TimeFormatOptions, 'locale'>): string {
  if (!isValidTime(seconds)) {
    return '0:00';
  }

  const negative = seconds < 0;
  const positiveSeconds = Math.abs(seconds);
  const totalSeconds = Math.floor(positiveSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secondsPart = totalSeconds % 60;

  const guideSeconds = isValidTime(guide ?? 0) ? Math.abs(guide ?? 0) : 0;
  const guideHours = Math.floor(guideSeconds / 3600);
  const guideMinutes = Math.floor((guideSeconds / 60) % 60);

  const showHours = hours > 0 || guideHours > 0;
  const padMinutes = showHours || guideMinutes >= 10;

  const duration = showHours ? { hours, minutes, seconds: secondsPart } : { minutes, seconds: secondsPart };
  const { locale = DEFAULT_LOCALE } = options ?? {};
  let body = getDurationFormatter(locale, 'digital', showHours ? 'always' : 'auto').format(duration);

  if (!padMinutes) {
    const zero = new Intl.NumberFormat(locale, { useGrouping: false }).format(0);

    body = body.replace(new RegExp(`^${zero}(?=\\p{Nd}\\D)`, 'u'), '');
  }

  return `${negative ? '-' : ''}${body}`;
}

/**
 * Convert seconds to ISO 8601 duration for datetime attribute.
 *
 * @example
 *   secondsToIsoDuration(90); // "PT1M30S"
 *   secondsToIsoDuration(3661); // "PT1H1M1S"
 *
 * @param seconds - Time in seconds
 * @returns ISO 8601 duration string like "PT1M30S"
 * @internal
 */
export function secondsToIsoDuration(seconds: number): string {
  if (!isValidTime(seconds)) {
    return 'PT0S';
  }

  const positiveSeconds = Math.abs(seconds);

  const h = Math.floor(positiveSeconds / 3600);
  const m = Math.floor((positiveSeconds / 60) % 60);
  const s = Math.floor(positiveSeconds % 60);

  let duration = 'PT';

  if (h > 0) duration += `${h}H`;

  if (m > 0) duration += `${m}M`;

  if (s > 0 || duration === 'PT') duration += `${s}S`;

  return duration;
}

/**
 * Human-readable duration using `Intl.NumberFormat` and `Intl.ListFormat`.
 *
 * Negative `seconds` denote remaining time: the absolute value is formatted, then wrapped in a localized phrase via
 * {@link TimeFormatOptions.formatRemaining}; otherwise `{duration} remaining`.
 *
 * @internal
 */
export function formatTimeAsPhrase(seconds: number, options?: TimeFormatOptions): string {
  if (!isValidTime(seconds)) {
    return '';
  }

  const { locale = DEFAULT_LOCALE, style = 'long', formatRemaining } = options ?? {};

  const negative = seconds < 0;
  const positiveSeconds = Math.abs(seconds);
  const totalSeconds = Math.floor(positiveSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secondsPart = totalSeconds % 60;

  const record: DurationRecord = {};

  if (hours > 0) record.hours = hours;

  if (minutes > 0) record.minutes = minutes;

  if (secondsPart > 0 || (hours === 0 && minutes === 0)) record.seconds = secondsPart;

  const body = getDurationFormatter(locale, style).format(record);

  if (negative) {
    if (formatRemaining) return formatRemaining(body);

    if (isDefaultLocale(locale)) return `${body} remaining`;

    return body;
  }

  return body;
}
