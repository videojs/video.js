'use client';

import type { ForwardedRef, ReactNode } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';

// Empty state for Separator (no dynamic state)
type SeparatorState = Record<string, never>;

export interface SeparatorProps extends UIComponentProps<'span', SeparatorState> {
  /** Separator content. Defaults to "/". */
  children?: ReactNode | undefined;
}

/**
 * Divider between time values. Hidden from screen readers.
 *
 * @example
 *   ```tsx
 *   <Time.Separator />
 *   <Time.Separator> of </Time.Separator>
 *   ```;
 */
export const Separator = forwardRef(function Separator(
  componentProps: SeparatorProps,
  forwardedRef: ForwardedRef<HTMLSpanElement>
) {
  const { render, className, style, children = '/', ...elementProps } = componentProps;

  const state: SeparatorState = {};

  return renderElement(
    'span',
    { render, className, style },
    {
      state,
      ref: [forwardedRef],
      props: [{ 'aria-hidden': 'true', children }, elementProps],
    }
  );
});

export namespace Separator {
  export type Props = SeparatorProps;
}
