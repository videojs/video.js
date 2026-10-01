import en from './locales/en';

export { DEFAULT_LOCALE } from '@videojs/utils/i18n';

export type { GetBrowserTranslationsOptions } from './browser-translation';
export {
  getBrowserTranslations,
  resetBrowserTranslationCacheForTesting,
  resolveBrowserTranslationTarget,
  shouldAttemptBrowserTranslation,
} from './browser-translation';
export { loadLocale } from './load-locale';
export type { LocaleAlias } from './locales';
export { LOCALES, localeAliases } from './locales';
export { flattenTranslations } from './utils';
/** @internal */
export const translations = en;
export type * from './params';
export {
  findLocaleKeys,
  getLocaleKey,
  getI18nTranslations,
  hasRegisteredLocale,
  onI18nRegistryChange,
  registerI18n,
  resetI18nRegistry,
} from './registry';
export { resolveText } from './resolve-text';
export { resolveTranslation } from './resolve-translation';
export { isText, type Text, type TextParams } from './text';
export { translateText } from './translate-text';
export { createTranslator, type TranslationOptions, type Translator } from './translator';
