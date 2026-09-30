'use client';

import type { GestureProps } from '@videojs/core';
import { createDoubleTapGesture } from '@videojs/core/dom';
import type { RefObject } from 'react';
import { useEffect } from 'react';

import { useContainer } from '../../player/context';
import { useLatestRef } from '../../utils/use-latest-ref';

export interface UseDoubleTapGestureOptions extends Pick<GestureProps, 'pointer' | 'region' | 'disabled'> {
  target?: RefObject<HTMLElement | null>;
}

/**
 * Registers a double-tap gesture on the current player container or an explicit target.
 *
 * @param onActivate - Callback invoked when a matching double tap is recognized.
 * @param options - Gesture matching, target, and disabled options.
 */
export function useDoubleTapGesture(
  onActivate: (event: PointerEvent) => void,
  options?: UseDoubleTapGestureOptions
): void {
  const { pointer, region, disabled = false, target } = options ?? {};
  const contextContainer = useContainer();
  const container = target?.current ?? contextContainer;
  const onActivateRef = useLatestRef(onActivate);

  useEffect(() => {
    if (!container || disabled) return;

    return createDoubleTapGesture(container, (event) => onActivateRef.current(event), { pointer, region });
  }, [container, disabled, pointer, region]);
}
