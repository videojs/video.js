'use client';

import { type RefObject, useLayoutEffect, useReducer, useRef } from 'react';

import type { AddLocaleRoot } from './context';

export function useLangRootElement(
  langRootRef: RefObject<Element | null> | undefined,
  parentAddLocaleRoot?: AddLocaleRoot
) {
  const [, invalidateLangRoot] = useReducer((epoch: number) => epoch + 1, 0);
  const langRootElementRef = useRef<Element | null>(null);

  useLayoutEffect(() => {
    if (!langRootRef) return;

    return parentAddLocaleRoot?.();
  }, [langRootRef, parentAddLocaleRoot]);

  useLayoutEffect(() => {
    if (!langRootRef) {
      if (langRootElementRef.current !== null) {
        langRootElementRef.current = null;
        invalidateLangRoot();
      }

      return;
    }

    const node = langRootRef.current;
    if (node === langRootElementRef.current) return;

    langRootElementRef.current = node;
    invalidateLangRoot();
  });

  return langRootElementRef.current ?? langRootRef?.current ?? null;
}
