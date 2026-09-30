'use client';

import type { InputActionEvent, MediaSnapshot } from '@videojs/core';
import { getMediaSnapshot, subscribeToInputActions } from '@videojs/core/dom';
import { useEffect } from 'react';

import { useContainer, usePlayer } from '../../player/context';
import { useLatestRef } from '../../utils/use-latest-ref';

export function useInputActionSubscription(callback: (event: InputActionEvent, snapshot: MediaSnapshot) => void): void {
  const container = useContainer();
  const store = usePlayer();
  const callbackRef = useLatestRef(callback);
  const storeRef = useLatestRef(store);

  useEffect(() => {
    if (!container) return;

    return subscribeToInputActions(container, (event) => {
      callbackRef.current(event, getMediaSnapshot(storeRef.current));
    });
  }, [container]);
}
