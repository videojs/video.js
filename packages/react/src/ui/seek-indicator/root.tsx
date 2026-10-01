'use client';

import {
  SeekIndicatorCore,
  SeekIndicatorDataAttrs,
  type SeekIndicatorProps,
  type SeekIndicatorState,
} from '@videojs/core';
import type { ForwardedRef } from 'react';
import { forwardRef } from 'react';

import { useLocale } from '../../i18n/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useInputIndicatorRoot } from '../input-indicator/use-input-indicator-root';
import { SeekIndicatorProvider } from './context';

export interface SeekIndicatorRootProps
  extends UIComponentProps<'div', SeekIndicatorState>, Omit<SeekIndicatorProps, 'locale'> {}

export const SeekIndicatorRoot = forwardRef(function SeekIndicatorRoot(
  componentProps: SeekIndicatorRootProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const { render, className, style, closeDelay, ...elementProps } = componentProps;
  const locale = useLocale();
  const { elementRef, present, state } = useInputIndicatorRoot(() => new SeekIndicatorCore(), { closeDelay, locale });
  if (!present) return null;

  return (
    <SeekIndicatorProvider value={{ state }}>
      {renderElement(
        'div',
        { render, className, style },
        {
          state,
          stateAttrMap: SeekIndicatorDataAttrs,
          ref: [forwardedRef, elementRef],
          props: [elementProps],
        }
      )}
    </SeekIndicatorProvider>
  );
});

export namespace SeekIndicatorRoot {
  export type Props = SeekIndicatorRootProps;
  export type State = SeekIndicatorState;
}
