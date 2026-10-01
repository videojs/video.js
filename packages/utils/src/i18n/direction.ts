/** @internal */
export type TextDirection = 'ltr' | 'rtl';

const RTL_SCRIPTS = new Set(['Adlm', 'Arab', 'Hebr', 'Mand', 'Mend', 'Nkoo', 'Rohg', 'Samr', 'Syrc', 'Thaa', 'Yezi']);

/**
 * Resolve the writing direction of a BCP 47 locale.
 *
 * @internal
 */
export function getTextDirection(locale: string): TextDirection {
  try {
    const script = new Intl.Locale(locale).maximize().script;

    return script && RTL_SCRIPTS.has(script) ? 'rtl' : 'ltr';
  } catch {
    return 'ltr';
  }
}
