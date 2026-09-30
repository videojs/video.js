'use client';

import {
  type FlatTranslations,
  flattenTranslations,
  getI18nTranslations,
  type Locale,
  type Translations,
} from '@videojs/core/i18n';
import { useMemo } from 'react';

import { useRegistryEpoch } from './use-registry-epoch';

export function useMergedTranslations(
  resolvedLocale: Locale,
  lazyLayer: Partial<FlatTranslations>,
  translationsProp?: Partial<Translations>
): FlatTranslations {
  const registryEpoch = useRegistryEpoch();

  return useMemo(() => {
    void registryEpoch;
    const registryLayer = getI18nTranslations(resolvedLocale);

    return {
      ...lazyLayer,
      ...registryLayer,
      ...flattenTranslations(translationsProp ?? {}),
    } as FlatTranslations;
  }, [resolvedLocale, lazyLayer, translationsProp, registryEpoch]);
}
