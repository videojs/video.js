import { isUndefined } from '../../predicate';

/**
 * Normalizes a raw `lang` string (e.g. from {@link findNearestLang}): empty or whitespace-only → `undefined`, otherwise
 * the trimmed value.
 *
 * @internal
 */
export function resolveLangAttr<Locale extends string = string>(raw: string | undefined): Locale | undefined {
  if (isUndefined(raw) || raw.trim() === '') {
    return undefined;
  }

  return raw.trim() as Locale;
}
