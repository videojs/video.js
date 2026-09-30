'use client';

import type { MenuState } from '@videojs/core';
import { forwardRef, useLayoutEffect } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useSafeId } from '../../utils/use-safe-id';
import { useMenuContext, useMenuGroupContext } from './context';

export interface MenuGroupLabelProps extends UIComponentProps<'div', MenuState> {}

/** Non-interactive label for a group of items. Renders a `<div>`. */
export const MenuGroupLabel = forwardRef<HTMLDivElement, MenuGroupLabelProps>(function MenuGroupLabel(
  { render, className, style, id: idProp, ...elementProps },
  forwardedRef
) {
  const { state } = useMenuContext();
  const group = useMenuGroupContext();
  const generatedId = useSafeId('menu-group-label');
  const id = idProp ?? generatedId;

  useLayoutEffect(() => {
    return group?.registerLabel(id);
  }, [group, id]);

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      ref: [forwardedRef],
      props: [{ id }, elementProps],
    }
  );
});

export namespace MenuGroupLabel {
  export type Props = MenuGroupLabelProps;
  export type State = MenuState;
}
