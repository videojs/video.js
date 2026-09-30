'use client';

import { onI18nRegistryChange } from '@videojs/core/i18n';
import { useEffect, useReducer } from 'react';

export function useRegistryEpoch(): number {
  const [epoch, invalidate] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    return onI18nRegistryChange(() => invalidate());
  }, []);

  return epoch;
}
