export type { FlatTranslations, Locale, TranslationParams, Translations, Translator } from '@videojs/core/i18n';

export {
  createTranslator,
  findLocaleKeys,
  getI18nTranslations,
  hasRegisteredLocale,
  isText,
  LOCALES,
  onI18nRegistryChange,
  registerI18n,
} from '@videojs/core/i18n';

export { I18nContext, useLocale, useTranslator } from './context';
export type { CreateI18nOptions, CreateI18nResult, I18nContextValue, I18nProviderProps } from './create-i18n';
export { createI18n, I18nProvider } from './create-i18n';
export { Text, type TextProps } from './text';
