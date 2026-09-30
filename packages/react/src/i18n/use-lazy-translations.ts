'use client';

import {
  type FlatTranslations,
  findLocaleKeys,
  getBrowserTranslations,
  type Locale,
  registerI18n,
  shouldAttemptBrowserTranslation,
} from '@videojs/core/i18n';
import { mergeLocaleOverlays } from '@videojs/utils/dom';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type LocaleLoader = (tag: string) => Promise<Partial<FlatTranslations> | undefined>;

export function useLazyTranslations(resolvedLocale: Locale, loader: LocaleLoader): Partial<FlatTranslations> {
  const [lazyLayer, setLazyLayer] = useState<Partial<FlatTranslations>>({});
  const lazySeqRef = useRef(0);

  // rerun when `resolvedLocale` changes even though the reset callback does not reference it.
  // oxlint-disable-next-line react/exhaustive-deps
  useLayoutEffect(() => {
    lazySeqRef.current += 1;
    setLazyLayer({});
  }, [resolvedLocale]);

  useEffect(() => {
    const seq = lazySeqRef.current;
    const locale = resolvedLocale;

    // Locale loading and browser translation are async; ignore stale results
    // after locale changes or unmount.
    void (async () => {
      try {
        const { merged, loadedTags } = await mergeLocaleOverlays(locale, loader, findLocaleKeys);

        if (seq !== lazySeqRef.current) return;

        if (shouldAttemptBrowserTranslation(locale, loadedTags, merged)) {
          const browser = await getBrowserTranslations(locale);

          if (seq !== lazySeqRef.current) return;

          if (Object.keys(browser).length) registerI18n(locale, browser);
        }

        if (seq !== lazySeqRef.current) return;

        setLazyLayer(merged);
      } catch {
        // Registry and prop translations still work if lazy loading fails.
      }
    })();

    return () => {
      if (lazySeqRef.current === seq) {
        lazySeqRef.current += 1;
      }
    };
  }, [resolvedLocale, loader]);

  return lazyLayer;
}
