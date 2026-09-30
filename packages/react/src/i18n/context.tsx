'use client';

import {
  createTranslator,
  DEFAULT_LOCALE,
  getI18nTranslations,
  type Locale,
  onI18nRegistryChange,
  type Translations,
  type Translator,
} from '@videojs/core/i18n';
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

export type AddLocaleRoot = () => () => void;

export interface I18nContextValue {
  translator: Translator;
  locale: Locale;
  /** True when the locale resolves from an explicit provider prop. */
  localeFromProp: boolean;
  /** @internal True when the nearest provider received an explicit locale prop. */
  localeFromOwnProp?: boolean;
  /** Overrides passed to this provider. */
  translations?: Partial<Translations>;
  /** Callback inherited by nested locale roots. */
  onActiveLocaleChange?: (locale: Locale) => void;
}

/** React context carrying the active translator and locale. @public */
export const I18nContext = createContext<I18nContextValue | null>(null);

export const LocaleRootContext = createContext<AddLocaleRoot | undefined>(undefined);

/**
 * Returns the translator for the nearest `I18nProvider`, or English defaults when none is mounted.
 *
 * @public
 */
export function useTranslator(): Translator {
  const ctx = useContext(I18nContext);
  const [registryEpoch, invalidateRegistry] = useReducer((epoch: number) => epoch + 1, 0);

  useEffect(() => {
    return onI18nRegistryChange(() => invalidateRegistry());
  }, []);

  const fallback = useMemo(() => {
    void registryEpoch;
    return createTranslator(getI18nTranslations(DEFAULT_LOCALE), DEFAULT_LOCALE);
  }, [registryEpoch]);

  if (!ctx) {
    return fallback;
  }

  return ctx.translator;
}

/**
 * Returns the active BCP 47 locale tag from the nearest `I18nProvider`, or `'en'` when none is mounted.
 *
 * @public
 */
export function useLocale(): Locale {
  const ctx = useContext(I18nContext);

  return ctx?.locale ?? DEFAULT_LOCALE;
}
