'use client';

import type { IndicatorVisibilityHandle } from '@videojs/core';
import { getIndicatorVisibilityCoordinator } from '@videojs/core/dom';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useContainer } from '../../player/context';
import { useLatestRef } from '../../utils/use-latest-ref';

export function useIndicatorVisibility(close: () => void): () => void {
  const container = useContainer();
  const closeRef = useLatestRef(close);
  const coordinatorRef = useRef<ReturnType<typeof getIndicatorVisibilityCoordinator> | null>(null);
  const [handle] = useState<IndicatorVisibilityHandle>(() => ({
    close: () => closeRef.current(),
  }));

  useEffect(() => {
    if (!container) return;

    const coordinator = getIndicatorVisibilityCoordinator(container);

    coordinatorRef.current = coordinator;

    return coordinator.register(handle);
  }, [container, handle]);

  return useCallback(() => {
    coordinatorRef.current?.show(handle);
  }, [handle]);
}
