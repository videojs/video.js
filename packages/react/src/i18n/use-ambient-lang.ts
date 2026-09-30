'use client';

import type { Locale } from '@videojs/core/i18n';
import { nearestLang, resolveLangAttr, subscribeAmbientLang } from '@videojs/utils/dom';
import { useSyncExternalStore } from 'react';

function ambientLangServerSnapshot(): string | undefined {
  return undefined;
}

export function useAmbientLang(hasLangRoot: boolean, langRootElement: Element | null): Locale | undefined {
  return useSyncExternalStore(
    subscribeAmbientLang,
    () => {
      const root = hasLangRoot || typeof document === 'undefined' ? langRootElement : document.documentElement;
      if (!root) return undefined;

      return resolveLangAttr<Locale>(nearestLang(root));
    },
    ambientLangServerSnapshot
  );
}
