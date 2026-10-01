/**
 * Default locale used when no player or ambient locale is available.
 *
 * @internal
 */
export const DEFAULT_LOCALE = 'en';

/**
 * Whether the first locale in a lookup list is the default locale or one of its regional variants.
 *
 * @internal
 */
export function isDefaultLocale(locale?: string | string[]): boolean {
  const tag = Array.isArray(locale) ? locale[0] : locale;
  if (!tag) return true;

  return tag === DEFAULT_LOCALE || tag.startsWith(`${DEFAULT_LOCALE}-`);
}

export { getTextDirection, type TextDirection } from './direction';
