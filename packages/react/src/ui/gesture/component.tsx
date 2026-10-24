'use client';

import type { GestureProps as CoreGestureProps } from '@videojs/core';
import type { AnyPlayerStore } from '@videojs/core/dom';
import {
  createDoubleTapGesture,
  createTapGesture,
  getGestureActionValue,
  resolveGestureAction,
} from '@videojs/core/dom';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { useContainer, usePlayer } from '../../player/context';

export interface GestureProps extends CoreGestureProps {}

export function Gesture({ type, action, value, pointer, region, disabled }: GestureProps): ReactNode {
  const store = usePlayer() as AnyPlayerStore;
  const container = useContainer();

  useEffect(() => {
    if (!container || !type || !action) return;

    const resolver = resolveGestureAction(action);
    if (!resolver) return;

    const actionValue = getGestureActionValue(action, region, value);

    const onActivate = (event: PointerEvent) => {
      resolver({ store, value: actionValue, event });
    };

    const options = { pointer, region, disabled, action, value: actionValue };

    if (type === 'doubletap') {
      return createDoubleTapGesture(container, onActivate, options);
    }

    if (type === 'tap') return createTapGesture(container, onActivate, options);

    return;
  }, [container, store, type, action, value, pointer, region, disabled]);

  return null;
}

export namespace Gesture {
  export type Props = GestureProps;
}

/** @deprecated Use `GestureProps` instead. */
export type MediaGestureProps = GestureProps;

/** @deprecated Use `Gesture` instead. */
export const MediaGesture = Gesture;
