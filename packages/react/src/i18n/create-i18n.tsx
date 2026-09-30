'use client';

import {
  createTranslator,
  loadLocale as defaultLoader,
  type FlatTranslations,
  type Locale,
  type Translations,
} from '@videojs/core/i18n';
import { effectiveLocale } from '@videojs/utils/dom';
import { type Context, type ReactNode, type RefObject, useContext, useMemo } from 'react';

import { I18nContext, type I18nContextValue, LocaleRootContext, useLocale, useTranslator } from './context';
import { getProviderRootProps, type I18nProviderRootProps } from './get-provider-root-props';
import { useAmbientLang } from './use-ambient-lang';
import { useLangRootElement } from './use-lang-root-element';
import { useLazyTranslations } from './use-lazy-translations';
import { useLocaleRootNotifications } from './use-locale-root-notifications';
import { useMergedTranslations } from './use-merged-translations';

export interface CreateI18nOptions {
  /** Override lazy loading of shipped locale packs (tests or custom loaders). */
  loader?: (tag: string) => Promise<Partial<FlatTranslations> | undefined>;
}

export interface I18nProviderProps {
  /**
   * Forces the active locale. Omit to inherit the nearest non-empty `lang` by walking DOM ancestors from
   * {@link langRootRef} when set, otherwise from `document.documentElement` (typically `<html lang>`). Updates when any
   * `lang` attribute changes anywhere under `<html>`, or when subtree moves alter which ancestor supplies `lang`. For
   * SSR, pass `locale` explicitly.
   */
  locale?: Locale;
  /**
   * Element whose ancestor chain is searched for a non-empty `lang` when {@link locale} is omitted—for example a ref to
   * your player shell `HTMLElement`.
   */
  langRootRef?: RefObject<Element | null>;
  /**
   * Per-locale string overrides merged on top of the global registry and any lazy built-in packs for {@link locale}.
   * Applies to translated `aria-label` values and tooltip copy for skin controls wired through `useTranslator`.
   *
   * @example
   *   ```tsx
   *   <I18nProvider locale="ja" translations={{ buttons: { play: '再生', pause: '一時停止' } }}>
   *     <VideoSkin />
   *   </I18nProvider>;
   *   ```;
   */
  translations?: Partial<Translations>;
  children: ReactNode;
  /** Fires when the resolved locale changes (caption selection hooks may use this later). */
  onActiveLocaleChange?: (locale: Locale) => void;
}

export type { I18nContextValue } from './context';

export interface CreateI18nResult {
  I18nContext: Context<I18nContextValue | null>;
  I18nProvider: (props: I18nProviderProps) => ReactNode;
  useTranslator: typeof useTranslator;
  useLocale: typeof useLocale;
}

/**
 * Creates an i18n provider and hooks for the shared React i18n context.
 *
 * @param options - Optional hooks such as custom built-in locale loading.
 * @public
 */
export function createI18n(options?: CreateI18nOptions): CreateI18nResult {
  const loader = options?.loader ?? defaultLoader;

  function I18nProviderRoot({
    locale: localeProp,
    langRootRef,
    parentLocale,
    localeFromProp = localeProp !== undefined,
    localeFromOwnProp = localeProp !== undefined,
    translations: translationsProp,
    children,
    onActiveLocaleChange,
    parentAddLocaleRoot,
  }: I18nProviderRootProps): ReactNode {
    const langRootElement = useLangRootElement(langRootRef, parentAddLocaleRoot);
    const ambientLang = useAmbientLang(langRootRef !== undefined, langRootElement);
    const resolvedLocale = useMemo(
      () => effectiveLocale<Locale>(localeProp, ambientLang ?? parentLocale),
      [localeProp, ambientLang, parentLocale]
    );

    const addLocaleRoot = useLocaleRootNotifications(resolvedLocale, onActiveLocaleChange);
    const lazyLayer = useLazyTranslations(resolvedLocale, loader);
    const translations = useMergedTranslations(resolvedLocale, lazyLayer, translationsProp);

    const translator = useMemo(() => createTranslator(translations, resolvedLocale), [translations, resolvedLocale]);

    const value = useMemo<I18nContextValue>(
      () => ({
        translator,
        locale: resolvedLocale,
        localeFromProp,
        localeFromOwnProp,
        ...(translationsProp !== undefined ? { translations: translationsProp } : {}),
        ...(onActiveLocaleChange !== undefined ? { onActiveLocaleChange } : {}),
      }),
      [translator, resolvedLocale, localeFromProp, localeFromOwnProp, translationsProp, onActiveLocaleChange]
    );

    return (
      <LocaleRootContext.Provider value={addLocaleRoot}>
        <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
      </LocaleRootContext.Provider>
    );
  }

  function I18nProvider(props: I18nProviderProps): ReactNode {
    const parent = useContext(I18nContext);
    const parentAddLocaleRoot = useContext(LocaleRootContext);

    const rootProps = getProviderRootProps(props, parent, parentAddLocaleRoot);
    if (!rootProps) return props.children;

    return <I18nProviderRoot {...rootProps} />;
  }

  return { I18nContext, I18nProvider, useTranslator, useLocale };
}

const defaultI18n = createI18n();

/**
 * Resolves locale and supplies a typed translator to descendants. Mount this explicitly for translated controls, forced
 * locales, SSR copy, or locale-aware player roots.
 *
 * @public
 */
export const I18nProvider = defaultI18n.I18nProvider;
