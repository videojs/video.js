import { DEFAULT_LOCALE } from '../../i18n';
import { isUndefined } from '../../predicate';

/**
 * Resolves locale: explicit non-empty value → ambient `lang` → {@link fallback}.
 *
 * @internal
 */
export function effectiveLocale<Locale extends string = string>(
  explicitLocale: Locale | undefined,
  ambientLang: Locale | undefined,
  fallback = DEFAULT_LOCALE as Locale
): Locale {
  if (!isUndefined(explicitLocale) && explicitLocale.trim() !== '') {
    return explicitLocale;
  }

  if (!isUndefined(ambientLang) && ambientLang.trim() !== '') {
    return ambientLang;
  }

  return fallback;
}
