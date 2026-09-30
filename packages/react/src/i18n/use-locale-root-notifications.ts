'use client';

import type { Locale } from '@videojs/core/i18n';
import { useCallback, useEffect, useReducer, useRef } from 'react';

export function useLocaleRootNotifications(resolvedLocale: Locale, onActiveLocaleChange?: (locale: Locale) => void) {
  const onActiveLocaleChangeRef = useRef(onActiveLocaleChange);

  onActiveLocaleChangeRef.current = onActiveLocaleChange;

  const childLocaleRootCountRef = useRef(0);
  const [localeRootEpoch, invalidateLocaleRoots] = useReducer((epoch: number) => epoch + 1, 0);

  const addLocaleRoot = useCallback(() => {
    childLocaleRootCountRef.current += 1;
    return () => {
      childLocaleRootCountRef.current = Math.max(0, childLocaleRootCountRef.current - 1);

      if (childLocaleRootCountRef.current === 0) {
        invalidateLocaleRoots();
      }
    };
  }, []);

  // Nested lang roots report their own active locale while mounted. When the
  // last one unmounts, notify the ancestor again with its now-effective locale.
  // rerun when nested locale roots unmount even though notification reads refs.
  // oxlint-disable-next-line react/exhaustive-deps
  useEffect(() => {
    const id = setTimeout(() => {
      if (childLocaleRootCountRef.current > 0) return;

      onActiveLocaleChangeRef.current?.(resolvedLocale);
    }, 0);

    return () => clearTimeout(id);
  }, [resolvedLocale, localeRootEpoch]);

  return addLocaleRoot;
}
