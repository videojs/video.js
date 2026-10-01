import { resolveText } from './resolve-text';
import type { Text, TextParams } from './text';
import type { Translator } from './translator';
import { interpolate } from './utils';

/**
 * Translate a text descriptor with a translator, or interpolate its English default without one. A plain string is
 * returned as is.
 *
 * @param text - Text descriptor, or a string returned unchanged.
 * @param translator - Translator from `createTranslator`; omit it to use the English default.
 * @param params - Values for the text's `{placeholders}`.
 * @public
 */
export function translateText(text: Text | string, params?: TextParams): string;
export function translateText(text: Text | string, translator: Translator | undefined, params?: TextParams): string;
export function translateText(
  text: Text | string,
  translatorOrParams?: Translator | TextParams,
  params?: TextParams
): string {
  if (typeof text === 'string') return text;

  if (typeof translatorOrParams === 'function') {
    return translatorOrParams(text, params);
  }

  return interpolate(resolveText(text), translatorOrParams ?? params);
}
