import type { TranslationKey, TranslationParams } from './params';
import type { TranslationOptions, Translator } from './translator';

type ResolveTranslationArgs<Key extends string> = Key extends TranslationKey
  ? TranslationParams[Key] extends never
    ? [params?: TranslationOptions]
    : [params: TranslationParams[Key] & TranslationOptions]
  : [params?: Record<string, string | number> & TranslationOptions];

/**
 * Translate a key with a translator, requiring the template params that key's English default declares.
 *
 * @param translator - Translator from `createTranslator`.
 * @param key - Translation key, such as `seek.forward`.
 * @param args - The key's template params, plus an optional `default` string.
 * @public
 */
export function resolveTranslation<Key extends string>(
  translator: Translator,
  key: Key,
  ...args: ResolveTranslationArgs<Key>
): string {
  const [params] = args;
  const translate = translator as (key: string, params?: unknown) => string;

  return params !== undefined ? translate(key, params) : translate(key);
}
