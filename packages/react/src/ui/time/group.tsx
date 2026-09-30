'use client';

import type { ForwardedRef, ReactNode } from 'react';
import { forwardRef } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';

// Empty state for Group (no dynamic state)
type GroupState = Record<string, never>;

export interface GroupProps extends UIComponentProps<'span', GroupState> {
  /** Time value components to render inside the group. */
  children?: ReactNode | undefined;
}

/**
 * Container for composed time displays. Renders a `<span>` element.
 *
 * @example
 *   ```tsx
 *   <Time.Group>
 *     <Time.Value type="current" />
 *     <Time.Separator />
 *     <Time.Value type="duration" />
 *   </Time.Group>;
 *   ```;
 */
export const Group = forwardRef(function Group(
  componentProps: GroupProps,
  forwardedRef: ForwardedRef<HTMLSpanElement>
) {
  const { render, className, style, children, ...elementProps } = componentProps;

  const state: GroupState = {};

  return renderElement(
    'span',
    { render, className, style },
    {
      state,
      ref: [forwardedRef],
      props: [{ children }, elementProps],
    }
  );
});

export namespace Group {
  export type Props = GroupProps;
}
